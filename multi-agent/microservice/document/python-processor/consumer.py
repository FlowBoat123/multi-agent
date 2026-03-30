import json
from handler.create import create_document
from handler.delete import delete_document
from config.rabbitmq import get_connection, close_all_connections, rabbitmq_manager
from utils.logger import logger
import asyncio
import signal
import sys
import time

# Global variables for consumer management
consumer_channel = None
is_consuming = False

def callback(ch, method, properties, body):
    """
    Callback function to process messages from the queue with improved error handling.
    """
    try:
        message = json.loads(body)
        logger.info(f"Received message: {message}")

        # Extract action and data
        action = method.routing_key
        document_id = message.get("documentId")
        name = message.get("name")
        user_id = message.get("userId")

        # Validate required fields
        if not document_id or not name or not user_id:
            logger.error(f"Missing required fields in message: {message}")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
            return

        # Process based on action
        if action == "document.received":
            logger.info(f"Processing document creation: {name} for user ID: {user_id}")
            result = asyncio.run(create_document({
                "documentId": document_id, 
                "name": name, 
                "userId": user_id
            }))
            logger.info(f"Document creation completed for {document_id}: {result}")
            
        elif action == "document.deleted":
            logger.info(f"Processing document deletion: {name} for user ID: {user_id}")
            result = asyncio.run(delete_document({
                "documentId": document_id, 
                "name": name, 
                "userId": user_id
            }))
            logger.info(f"Document deletion completed for {document_id}: {result}")
            
        else:
            logger.warning(f"Unknown action: {action}")
            # Still acknowledge unknown actions to avoid reprocessing
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return

        # Acknowledge the message after successful processing
        ch.basic_ack(delivery_tag=method.delivery_tag)
        logger.debug(f"Message acknowledged for action: {action}")

    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in message: {e}")
        # Don't requeue invalid JSON
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
        
    except Exception as e:
        logger.error(f"Error processing message: {e}", exc_info=True)
        
        # For transient errors, you might want to requeue
        # For permanent errors (like validation), don't requeue
        should_requeue = not isinstance(e, (ValueError, KeyError, TypeError))
        
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=should_requeue)
        logger.info(f"Message nacked with requeue={should_requeue}")

def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    global is_consuming
    logger.info(f"Received signal {signum}. Shutting down gracefully...")
    is_consuming = False
    
    if consumer_channel and not consumer_channel.is_closed:
        try:
            consumer_channel.stop_consuming()
        except Exception as e:
            logger.warning(f"Error stopping consumer: {e}")
    
    close_all_connections()

def start_consumer():
    """
    Start the RabbitMQ consumer with improved error handling and reconnection logic.
    """
    global consumer_channel, is_consuming
    
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    max_retries = 5
    retry_delay = 5
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Starting consumer (attempt {attempt + 1}/{max_retries})")
            
            connection, consumer_channel = get_connection()

            # Declare the queues with improved configuration
            consumer_channel.queue_declare(
                queue="document.response.queue",
                durable=True,
                arguments={
                    "x-dead-letter-exchange": "dlx.exchange",
                    "x-dead-letter-routing-key": "document.response.python.dead",
                    "x-message-ttl": 3600000,  # 1 hour TTL
                    "x-max-retries": 3
                }
            )

            # Bind the queues to routing keys
            consumer_channel.queue_bind(
                exchange="app.exchange", 
                queue="document.response.queue", 
                routing_key="document.received"
            )
            consumer_channel.queue_bind(
                exchange="app.exchange", 
                queue="document.response.queue", 
                routing_key="document.deleted"
            )
            
            # Set QoS to process one message at a time
            consumer_channel.basic_qos(prefetch_count=1)

            logger.info("Document service ready. Waiting for messages. To exit press CTRL+C")
            is_consuming = True

            # Start consuming messages
            consumer_channel.basic_consume(
                queue="document.response.queue", 
                on_message_callback=callback
            )
            
            # This will block until stop_consuming is called
            consumer_channel.start_consuming()
            
            # If we reach here, consumption was stopped gracefully
            break
            
        except KeyboardInterrupt:
            logger.info("Received keyboard interrupt")
            break
            
        except Exception as e:
            logger.error(f"Error starting consumer (attempt {attempt + 1}/{max_retries}): {e}")
            
            # Cleanup current connection before retry
            try:
                if consumer_channel:
                    consumer_channel.close()
            except:
                pass
            
            if attempt < max_retries - 1:
                logger.info(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
                retry_delay = min(retry_delay * 2, 60)  # Exponential backoff with max 60s
            else:
                logger.error("Max retries reached. Exiting.")
                raise
    
        finally:
            close_connection()

def close_connection():
    """Close RabbitMQ connection properly"""
    global consumer_channel, is_consuming
    
    logger.info("Closing document service RabbitMQ connections...")
    is_consuming = False
    
    try:
        if consumer_channel and not consumer_channel.is_closed:
            logger.info("Stopping message consumption...")
            consumer_channel.stop_consuming()
    except Exception as e:
        logger.warning(f"Error stopping consumption: {e}")
    
    # Use the singleton's cleanup method
    close_all_connections()
    consumer_channel = None
    logger.info("Document service RabbitMQ connection closed successfully.")