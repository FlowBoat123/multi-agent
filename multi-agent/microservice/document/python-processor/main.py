from consumer import start_consumer, close_connection
from dotenv import load_dotenv
import logging
import sys
from utils.logger import logger

def main():
    """
    Main function with proper error handling and logging setup
    """
    load_dotenv()
    
    # Configure logging if not already configured
    if not logger.handlers:
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.StreamHandler(sys.stdout),
                logging.FileHandler('document_service.log')
            ]
        )
    
    logger.info("Starting Document Service...")
    
    try:
        start_consumer()
    except KeyboardInterrupt:
        logger.info("Service interrupted by user")
    except Exception as e:
        logger.error(f"Service error: {e}", exc_info=True)
        sys.exit(1)
    finally:
        logger.info("Service shutting down...")
        close_connection()
        logger.info("Service stopped")

if __name__ == '__main__':
    main()