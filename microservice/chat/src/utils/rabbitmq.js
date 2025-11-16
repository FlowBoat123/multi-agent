require('dotenv').config();
const amqp = require('amqplib');
const logger = require('./logger');

let connection = null;
let channel = null;
let connectingPromise = null;

// Retry configuration
const RETRY_CONFIG = {
    maxRetries: 15,
    initialDelay: 2000,
    maxDelay: 30000,
    backoffMultiplier: 1.5
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function setupExchangesAndQueues() {
    if (!channel) throw new Error('Channel not available');

    try {
        // Main application exchange
        await channel.assertExchange('app.exchange', 'direct', { durable: true });

        // Dead Letter Exchange + Queue
        await channel.assertExchange('dlx.exchange', 'direct', { durable: true });
        await channel.assertQueue('dlx.queue', { durable: true });
        await channel.bindQueue('dlx.queue', 'dlx.exchange', '#');

        logger.info('[RabbitMQ] Exchanges and queues set up successfully');
    } catch (error) {
        logger.error('[RabbitMQ] Failed to setup exchanges/queues:', { error: error.message });
        throw error;
    }
}

async function connectRabbitMQ() {
    // Nếu channel còn hoạt động thì trả về luôn
    if (channel && connection && !connection.connection.stream.destroyed) {
        return channel;
    }

    // Nếu đang trong quá trình kết nối thì chờ
    if (connectingPromise) {
        return connectingPromise;
    }

    connectingPromise = (async () => {
        let retryCount = 0;
        let delay = RETRY_CONFIG.initialDelay;

        while (retryCount < RETRY_CONFIG.maxRetries) {
            try {
                logger.info(`[RabbitMQ] Attempting connection (${retryCount + 1}/${RETRY_CONFIG.maxRetries})...`);

                connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672');
                channel = await connection.createChannel();

                connection.on('error', (err) => {
                    logger.error('[RabbitMQ] Connection error:', { error: err.message });
                    channel = null;
                    connection = null;
                    connectingPromise = null;
                });

                connection.on('close', () => {
                    logger.warn('[RabbitMQ] Connection closed, will attempt to reconnect...');
                    channel = null;
                    connection = null;
                    connectingPromise = null;
                    // Tự động reconnect sau 5s
                    setTimeout(() => {
                        connectRabbitMQ().catch(err => {
                            logger.error('[RabbitMQ] Auto-reconnect failed:', { error: err.message });
                        });
                    }, 5000);
                });

                await setupExchangesAndQueues();

                logger.info('[RabbitMQ] Connected successfully');
                return channel;

            } catch (error) {
                retryCount++;

                if (error.code === 'EAI_AGAIN' || error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                    logger.warn(`[RabbitMQ] Connection failed (${error.code}), retrying in ${delay / 1000}s...`, {
                        attempt: retryCount,
                        maxRetries: RETRY_CONFIG.maxRetries,
                        error: error.message
                    });
                } else {
                    logger.error(`[RabbitMQ] Connection error:`, {
                        error: error.message,
                        code: error.code,
                        attempt: retryCount
                    });
                }

                if (retryCount >= RETRY_CONFIG.maxRetries) {
                    connectingPromise = null;
                    channel = null;
                    connection = null;
                    const finalError = new Error(`Failed to connect to RabbitMQ after ${RETRY_CONFIG.maxRetries} attempts. Last error: ${error.message}`);
                    finalError.originalError = error;
                    throw finalError;
                }

                await sleep(delay);
                delay = Math.min(delay * RETRY_CONFIG.backoffMultiplier, RETRY_CONFIG.maxDelay);
            }
        }
    })();

    return connectingPromise;
}

async function publish(event, payload) {
    try {
        if (!channel) {
            await connectRabbitMQ();
        }

        const success = channel.publish(
            'app.exchange',
            event,
            Buffer.from(JSON.stringify(payload)),
            { persistent: true }
        );

        if (!success) {
            throw new Error('Channel write buffer full');
        }

        logger.info('[RabbitMQ] Published event', { event, payload });
    } catch (error) {
        logger.error('[RabbitMQ] Publish failed:', {
            event,
            error: error.message
        });

        // Try to reconnect and retry once
        try {
            channel = null;
            await connectRabbitMQ();

            const success = channel.publish(
                'app.exchange',
                event,
                Buffer.from(JSON.stringify(payload)),
                { persistent: true }
            );

            if (success) {
                logger.info('[RabbitMQ] Published event after reconnect', { event });
            } else {
                throw new Error('Retry publish failed');
            }
        } catch (retryError) {
            logger.error('[RabbitMQ] Retry publish failed:', {
                event,
                error: retryError.message
            });
            throw retryError;
        }
    }
}

async function consume(queue, event, handler) {
    try {
        if (!channel) {
            await connectRabbitMQ();
        }

        // Assert queue with DLX configuration
        await channel.assertQueue(queue, {
            durable: true,
            arguments: {
                'x-dead-letter-exchange': 'dlx.exchange',
                'x-dead-letter-routing-key': `chat.response.nodejs.dead`
            }
        });

        // Bind queue to exchange
        await channel.bindQueue(queue, 'app.exchange', event);

        // Set prefetch count for better load balancing
        await channel.prefetch(1);

        // Start consuming
        await channel.consume(queue, async (msg) => {
            if (!msg) return;

            try {
                const data = JSON.parse(msg.content.toString());
                logger.info(`[RabbitMQ] Processing ${event}`, {
                    data,
                    messageId: msg.properties.messageId,
                    deliveryTag: msg.fields.deliveryTag
                });

                await handler(data);
                channel.ack(msg);

                logger.debug(`[RabbitMQ] Successfully processed ${event}`, {
                    deliveryTag: msg.fields.deliveryTag
                });

            } catch (handlerError) {
                logger.error(`[RabbitMQ] Handler failed for ${event}`, {
                    error: handlerError.message,
                    stack: handlerError.stack,
                    deliveryTag: msg.fields.deliveryTag,
                    redelivered: msg.fields.redelivered
                });

                // Send to DLX (Dead Letter Exchange)
                channel.nack(msg, false, false);
            }
        }, {
            noAck: false
        });

        logger.info(`[RabbitMQ] Consumer set up for ${event} on queue ${queue}`);
    } catch (error) {
        logger.error(`[RabbitMQ] Failed to set up consumer for ${event}:`, {
            error: error.message
        });
        throw error;
    }
}

// Health check function
function isHealthy() {
    return channel && connection && !connection.connection.stream.destroyed;
}

// Graceful shutdown
async function close() {
    try {
        if (channel) {
            await channel.close();
            logger.info('[RabbitMQ] Channel closed');
        }
        if (connection) {
            await connection.close();
            logger.info('[RabbitMQ] Connection closed');
        }
    } catch (error) {
        logger.error('[RabbitMQ] Error during shutdown:', { error: error.message });
    } finally {
        channel = null;
        connection = null;
        connectingPromise = null;
    }
}

// Initialize connection on module load (non-blocking)
(async () => {
    try {
        await connectRabbitMQ();
    } catch (error) {
        logger.error('[RabbitMQ] Initial connection failed:', { error: error.message });
        // Don't crash the application, let it continue without RabbitMQ
    }
})();

module.exports = {
    connectRabbitMQ,
    publish,
    consume,
    isHealthy,
    close
};
