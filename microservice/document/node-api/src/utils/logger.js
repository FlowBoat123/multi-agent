require('dotenv').config();
const { createLogger, format, transports } = require('winston');
const Elasticsearch = require('winston-elasticsearch');

// Cấu hình Elasticsearch transport
const esTransportOpts = {
    level: 'info',
    clientOpts: {
        node: process.env.ELASTICSEARCH_URL || 'http://elasticsearch:9200'
    },
    index: 'logs-document',
    dataStream: true,
    buffering: true,
    bufferLimit: 100,
    flushInterval: 2000,
    transformer: (logData) => ({
        '@timestamp': logData.timestamp || new Date().toISOString(),
        message: logData.message,
        level: logData.level,
        ...logData.meta
    }),
    handleExceptions: false,
    exitOnError: false
};

// Tạo logger ngay lập tức
const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
    ),
    transports: [
        new Elasticsearch.ElasticsearchTransport(esTransportOpts),
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.simple()
            )
        })
    ],
    exceptionHandlers: [
        new transports.Console()
    ]
});

// Xử lý lỗi cho Elasticsearch transport
logger.on('error', (error) => {
    console.error('Logger error:', error);
});

module.exports = logger;