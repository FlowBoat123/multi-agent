import json
import logging
from src.utils.rabbitmq import get_channel, rabbitmq_manager
import pika

logger = logging.getLogger(__name__)

def publish_processing_event(event_type: str, conversation_id: str, data: dict = None):
    """
    Publish processing event to RabbitMQ using context manager
    """
    try:
        with get_channel() as channel:
            event_data = {
                "conversationId": conversation_id,
                "eventType": event_type,
                "timestamp": None,
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
            
            logger.info(f"Published event: {event_type} for conversation: {conversation_id}")
            
    except Exception as e:
        logger.error(f"Failed to publish event {event_type}: {e}")
        # Don't re-raise to avoid breaking the main flow
        # You might want to implement a retry mechanism here

class EventPublisher:
    """Improved EventPublisher using shared connection"""
    
    def publish_event(self, event_type: str, conversation_id: str, data: dict = None):
        """Publish event using shared connection"""
        publish_processing_event(event_type, conversation_id, data)
    
    def __enter__(self):
        # Connection is managed globally, no need to connect here
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        # Don't close connection here as it's shared
        pass