import pika
import os
import logging
import threading
from contextlib import contextmanager

logger = logging.getLogger(__name__)

class RabbitMQConnection:
    """Singleton RabbitMQ connection manager"""
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(RabbitMQConnection, cls).__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        self.connection = None
        self.channel = None
        self._lock = threading.Lock()
        self._initialized = True
    
    def connect(self):
        """Establish connection to RabbitMQ with proper error handling"""
        if self.is_connected():
            return self.connection, self.channel
            
        try:
            rabbitmq_host = os.getenv("RABBITMQ_HOST", "localhost")
            rabbitmq_port = int(os.getenv("RABBITMQ_PORT", 5672))
            rabbitmq_user = os.getenv("RABBITMQ_USER", "guest")
            rabbitmq_password = os.getenv("RABBITMQ_PASSWORD", "guest")
            rabbitmq_heartbeat = int(os.getenv("RABBITMQ_HEARTBEAT", 600))
            rabbitmq_blocked_timeout = int(os.getenv("RABBITMQ_BLOCKED_TIMEOUT", 300))

            credentials = pika.PlainCredentials(rabbitmq_user, rabbitmq_password)
            
            # Add connection parameters for better resource management
            parameters = pika.ConnectionParameters(
                host=rabbitmq_host,
                port=rabbitmq_port,
                credentials=credentials,
                heartbeat=rabbitmq_heartbeat,
                blocked_connection_timeout=rabbitmq_blocked_timeout,
                connection_attempts=3,
                retry_delay=2,
                socket_timeout=10,
                stack_timeout=10
            )
            
            self.connection = pika.BlockingConnection(parameters)
            self.channel = self.connection.channel()
            
            logger.info(
                f"Connected to RabbitMQ at {rabbitmq_host}:{rabbitmq_port} "
                f"as user '{rabbitmq_user}', heartbeat={rabbitmq_heartbeat}s."
            )
            
            return self.connection, self.channel
            
        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {e}")
            self.cleanup()
            raise
    
    def is_connected(self):
        """Check if connection is active"""
        return (self.connection is not None and 
                not self.connection.is_closed and
                self.channel is not None and
                not self.channel.is_closed)
    
    def cleanup(self):
        """Properly close connections"""
        with self._lock:
            try:
                if self.channel and not self.channel.is_closed:
                    self.channel.close()
            except Exception as e:
                logger.warning(f"Error closing channel: {e}")
            
            try:
                if self.connection and not self.connection.is_closed:
                    self.connection.close()
            except Exception as e:
                logger.warning(f"Error closing connection: {e}")
            
            self.channel = None
            self.connection = None
    
    def reconnect(self):
        """Reconnect to RabbitMQ"""
        logger.info("Reconnecting to RabbitMQ...")
        self.cleanup()
        return self.connect()

# Global instance
rabbitmq_manager = RabbitMQConnection()

def get_connection():
    """Get RabbitMQ connection - backward compatibility"""
    return rabbitmq_manager.connect()

@contextmanager
def get_channel():
    """Context manager for safe channel usage"""
    connection, channel = None, None
    try:
        connection, channel = rabbitmq_manager.connect()
        yield channel
    except Exception as e:
        logger.error(f"Channel operation failed: {e}")
        # Try to reconnect
        try:
            connection, channel = rabbitmq_manager.reconnect()
            yield channel
        except Exception as reconnect_error:
            logger.error(f"Reconnection failed: {reconnect_error}")
            raise
    finally:
        # Don't close the channel/connection here as it's managed globally
        pass

def close_all_connections():
    """Close all RabbitMQ connections"""
    rabbitmq_manager.cleanup()
