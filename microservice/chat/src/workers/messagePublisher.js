const logger = require('../utils/logger');
const { publish } = require('../utils/rabbitmq');

async function sendUserMessage({ userId, conversationId, message, conversation_history }) {
    logger.info('User message:', message);
    await publish('chat.message.received', {
        userId,
        conversationId,
        message,
        conversation_history
    });
}

module.exports = { sendUserMessage };
