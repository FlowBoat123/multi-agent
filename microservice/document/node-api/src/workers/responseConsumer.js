const { consume } = require('../utils/rabbitmq');
const logger = require('../utils/logger');
const documentService = require('../services/documentService');

const updateUser = async (data) => {
    const { id, username, email, avatar, role } = data;
    logger.info(`Updating user ${id} for documents`);
    try {
        const updatedUser = await documentService.updateUser({
            id,
            username,
            email,
            avatar,
            role
        });
        logger.info(`User ${id} updated successfully in documents`);
        return updatedUser;
    } catch (error) {
        logger.error(`Error updating user in documents: ${error.message}`);
        throw error;
    }
}

async function startResponseConsumer() {
    await consume('document.response.queue.user', 'user.updated', updateUser);
}

module.exports = { startResponseConsumer };
