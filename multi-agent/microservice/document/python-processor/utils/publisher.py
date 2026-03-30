import json
import pika
from config.rabbitmq import get_channel
from utils.logger import logger

def publish_document_event(event_type: str, document_id: str, user_id: str, data: dict = None):
    """
    Publish document processing event to RabbitMQ
    
    Args:
        event_type: Type of event (e.g., 'document.processed', 'document.failed')
        document_id: ID of the document
        user_id: ID of the user
        data: Additional data to include in the event
    """
    try:
        with get_channel() as channel:
            event_data = {
                "documentId": document_id,
                "userId": user_id,
                "eventType": event_type,
                "timestamp": None,  # Will be set by the message broker
            }
            
            if data:
                event_data.update(data)
            
            channel.basic_publish(
                exchange="app.exchange",
                routing_key=event_type,
                body=json.dumps(event_data),
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Make message persistent
                    content_type='application/json'
                )
            )
            
            logger.info(f"Published event: {event_type} for document: {document_id}")
            
    except Exception as e:
        logger.error(f"Failed to publish document event {event_type}: {e}")