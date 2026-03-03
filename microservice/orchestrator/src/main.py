from dotenv import load_dotenv
load_dotenv()

from src.consumer import start_consumer, close_connection
import signal
import sys
import logging

logger = logging.getLogger(__name__)

def signal_handler(signum, frame):
    """
    Handle shutdown signals gracefully
    """
    logger.info(f"Received signal {signum}. Shutting down gracefully...")
    close_connection()
    sys.exit(0)

def main():
    """
    Main function with proper signal handling
    """
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        start_consumer()
    except KeyboardInterrupt:
        print("Shutting down...")
        close_connection()

if __name__ == '__main__':
    main()