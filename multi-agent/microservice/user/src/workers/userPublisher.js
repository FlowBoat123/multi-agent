const logger = require('../utils/logger');
const { publish } = require('../utils/rabbitmq');

// Khi user gửi message
async function updateUser(newUser) {
    logger.info('User message:', message);
    await publish('user.updated', newUser);
}

module.exports = { updateUser };
