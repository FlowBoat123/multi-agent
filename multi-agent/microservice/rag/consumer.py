import json
from handler.rag import rag
from config.rabbitmq import get_connection
from utils.logger import logger
import asyncio

def callback(ch, method, properties, body):
    """
    Callback function to process messages from the queue.
    """
    try:
        data = json.loads(body)
        logger.info(f"Received message: {data}")

        # Extract action and data
        action = method.routing_key  # Use routing key to determine action
        user_id = data.get("userId")

        if action == "chat.message.received":
            logger.info(f"Processing chat message for user ID: {user_id}")
            response = asyncio.run(rag(data))  # Gọi hàm async rag
            logger.info(f"[RAG Response] {response}")
            
            ch.basic_publish(
                exchange="app.exchange",
                routing_key="chat.response.generated",
                body=json.dumps({
                    "conversationId": data.get("conversationId"),
                    "message": response
                }),
                properties=properties  # giữ nguyên correlation_id nếu có
            )
        else:
            logger.warn(f"Unknown action: {action}")

        # Acknowledge the message
        ch.basic_ack(delivery_tag=method.delivery_tag)

    except Exception as e:
        logger.error(f"Error processing message: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

def start_consumer():
    """
    Start the RabbitMQ consumer.
    """
    connection, channel = get_connection()

    # Declare the queues
    channel.queue_declare(
        queue="chat.response.queue",
        durable=True,
        arguments={
            "x-dead-letter-exchange": "dlx.exchange",
            "x-dead-letter-routing-key": "chat.response.python.dead"
        })

    # Bind the queues to routing keys
    channel.queue_bind(exchange="app.exchange", queue="chat.response.queue", routing_key="chat.message.received")
    # channel.queue_bind(exchange="app.exchange", queue="chat.response.queue", routing_key="chat.response.generated")

    logger.info("Waiting for messages. To exit press CTRL+C")

    # Start consuming messages
    channel.basic_consume(queue="chat.response.queue", on_message_callback=callback)
    channel.start_consuming()