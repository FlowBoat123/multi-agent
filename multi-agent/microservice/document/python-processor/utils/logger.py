import logging
from logging import Handler
from elasticsearch import Elasticsearch
import socket
import json
from datetime import datetime
import os

# Thiết lập Elasticsearch client
ELASTIC_URL = os.getenv("ELASTIC_URL", "http://elasticsearch:9200")

class ElasticsearchHandler(Handler):
    def __init__(self, hosts, index='logs-document'):
        super().__init__()
        self.es = Elasticsearch(hosts)
        self.index = index

    def emit(self, record):
        log_entry = self.format(record)
        try:
            self.es.index(index=self.index, body=json.loads(log_entry))
        except Exception as e:
            print(f"Failed to send log to Elasticsearch: {e}")


class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "module": record.module,
            "filename": record.filename,
            "funcName": record.funcName,
            "lineNo": record.lineno,
            "host": socket.gethostname(),
        }
        return json.dumps(log_record)


def get_logger(name='my-logger'):
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)

    if not logger.hasHandlers():
        es_handler = ElasticsearchHandler(hosts=[ELASTIC_URL])
        es_handler.setFormatter(JSONFormatter())

        logger.addHandler(es_handler)

        # Optional: also log to console
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(logging.Formatter('[%(levelname)s] %(message)s'))
        logger.addHandler(console_handler)

    return logger

logger = get_logger()