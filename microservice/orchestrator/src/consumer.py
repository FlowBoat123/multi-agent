import json
from src.utils.rabbitmq import get_connection, close_all_connections, rabbitmq_manager
from src.graph import build_graph
from src.state_type import AgentState
from src.publisher import publish_processing_event
import logging
import asyncio
import signal
import sys
import time
import pika

logger = logging.getLogger(__name__)
app = build_graph()

# Remove global variables as they're managed by the singleton
consumer_channel = None
is_consuming = False

async def run(question: str, conversation_id: str, conversation_history: str = None):
    query = AgentState(
        question=question,
        conversation_id=conversation_id,
        conversation_history=conversation_history
    )

    result = await app.ainvoke(query)
    print("Final result:", result)
    return result

def callback(ch, method, properties, body):
    try:
        data = json.loads(body.decode("utf-8"))
        logger.info(f"Received message: {data}")
        
        message = data.get("message", "")
        conversationId = data.get("conversationId", "")
        conversation_history = data.get("conversation_history", None)
        userId = data.get("userId", "")
        
        action = method.routing_key
        
        if action == "chat.message.received":
            # Publish processing started event
            publish_processing_event("processing.started", conversationId)
            
            response = asyncio.run(run(message, conversationId, conversation_history))
            logger.info(f"Processed response: {response}")
            
            # Use the same channel for publishing response
            ch.basic_publish(
                exchange="app.exchange",
                routing_key="chat.response.generated",
                body=json.dumps({
                    "message": response.get("response", ""),
                    "conversationId": conversationId,
                    "context": response.get("context", ""),
                    "userId": userId
                }),
                properties=pika.BasicProperties(
                    correlation_id=properties.correlation_id if properties else None,
                    delivery_mode=2,
                    content_type='application/json'
                )
            )
            
            # Publish processing completed event
            publish_processing_event("processing.completed", conversationId)
            
        else:
            logger.warning(f"Unknown action: {action}")

        # Acknowledge the message
        ch.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as e:
        logger.error(f"Error processing message: {e}", exc_info=True)
        
        # Extract conversation ID for error reporting
        try:
            data = json.loads(body.decode("utf-8"))
            conversationId = data.get("conversationId", "unknown")
            publish_processing_event("processing.error", conversationId, {"error": str(e)})
        except Exception as pub_error:
            logger.error(f"Failed to publish error event: {pub_error}")
        
        # Reject message without requeue to avoid infinite loops
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    global is_consuming
    logger.info(f"Received signal {signum}. Shutting down gracefully...")
    is_consuming = False
    
    if consumer_channel and not consumer_channel.is_closed:
        consumer_channel.stop_consuming()
    
    close_all_connections()

def start_consumer():
    """Start the RabbitMQ consumer with proper error handling"""
    global consumer_channel, is_consuming
    
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    max_retries = 5
    retry_delay = 5
    
    for attempt in range(max_retries):
        try:
            connection, consumer_channel = get_connection()
            
            # Declare the queues
            consumer_channel.queue_declare(
                queue="chat.response.queue",
                durable=True,
                arguments={
                    "x-dead-letter-exchange": "dlx.exchange",
                    "x-dead-letter-routing-key": "chat.response.python.dead"
                }
            )

            # Bind the queues to routing keys
            consumer_channel.queue_bind(
                exchange="app.exchange", 
                queue="chat.response.queue", 
                routing_key="chat.message.received"
            )
            
            # Set QoS to process one message at a time
            consumer_channel.basic_qos(prefetch_count=1)

            logger.info("Waiting for messages. To exit press CTRL+C")
            is_consuming = True

            # Start consuming messages
            consumer_channel.basic_consume(
                queue="chat.response.queue", 
                on_message_callback=callback
            )
            
            consumer_channel.start_consuming()
            break
            
        except KeyboardInterrupt:
            logger.info("Received keyboard interrupt")
            break
        except Exception as e:
            logger.error(f"Error starting consumer (attempt {attempt + 1}/{max_retries}): {e}")
            
            if attempt < max_retries - 1:
                logger.info(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
            else:
                logger.error("Max retries reached. Exiting.")
                raise
    
        finally:
            close_connection()

def close_connection():
    """Close RabbitMQ connection properly"""
    global consumer_channel, is_consuming
    
    logger.info("Closing RabbitMQ connections...")
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
    logger.info("RabbitMQ connection closed successfully.")