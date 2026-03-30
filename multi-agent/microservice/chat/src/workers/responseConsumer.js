const { consume } = require('../utils/rabbitmq');
const { emitMessage, emitStatus } = require('../config/socket');
const messageService = require('../services/messageService'); // Dịch vụ để lưu tin nhắn
const conversationService = require('../services/conversationService'); // Dịch vụ để cập nhật cuộc trò chuyện
const logger = require('../utils/logger'); // Logger để ghi log
const { getFile } = require("../utils/minio")

const handleBotResponse = async (data) => {
    logger.info('Bot reply:', data.message);

    try {
        const message = await messageService.create({
            conversationId: data.conversationId,
            message: data.message,
            role: 'bot',
            context: data.context || null,
        });
        emitMessage(data.conversationId, {
            messageId: message.id,
            message: data.message,
            role: 'bot',
        });

        logger.info(`Message saved successfully for conversation ${data.conversationId}`);
    } catch (error) {
        logger.error(`Error saving message for conversation ${data.conversationId}: ${error.message}`);
        throw error;
    }
}

const handleAnalysis = async (data) => {
    logger.info(`Analysis for conversation ${data.conversationId}`);

    try {
        if (data.status === 'started') {
            emitStatus(data.conversationId, 'started', 'analysis');
        }

        if (data.status === 'completed') {
            emitStatus(data.conversationId, 'completed', 'analysis');
        }

        logger.info(`Conversation ${data.conversationId} start analysis`);
    } catch (error) {
        logger.error(`Error updating conversation ${data.conversationId}: ${error.message}`);
        throw error;
    }
}

const handleRetrieving = async (data) => {
    logger.info(`Retrieving for conversation ${data.conversationId}`);

    try {
        if (data.status === 'started') {
            emitStatus(data.conversationId, 'started', 'retrieving');
        }

        if (data.status === 'completed') {
            emitStatus(data.conversationId, 'completed', 'retrieving');
        }

        logger.info(`Conversation ${data.conversationId} start retrieving`);
    } catch (error) {
        logger.error(`Error updating conversation ${data.conversationId}: ${error.message}`);
        throw error;
    }
}

const handleSummarizing = async (data) => {
    logger.info(`Summarizing for conversation ${data.conversationId}`);

    try {
        if (data.status === 'started') {
            emitStatus(data.conversationId, 'started', 'summarizing');
        }

        if (data.status === 'completed') {
            emitStatus(data.conversationId, 'completed', 'summarizing');
        }

        logger.info(`Conversation ${data.conversationId} start summarizing`);
    } catch (error) {
        logger.error(`Error updating conversation ${data.conversationId}: ${error.message}`);
        throw error;
    }
}

const handleProcessingError = (data) => {
    logger.error(`Processing error for conversation ${data.conversationId}: ${data.error}`);
    emitStatus(data.conversationId, 'error', 'processing');
}

const updateUser = async (data) => {
    const { id, username, email, avatar, role } = data;
    logger.info(`Updating user ${id} for chats`);
    try {
        const updatedUser = await conversationService.updateUser({
            id,
            username,
            email,
            avatar,
            role
        });
        logger.info(`User ${id} updated successfully in chats`);
        return updatedUser;
    } catch (error) {
        logger.error(`Error updating user in chats: ${error.message}`);
        throw error;
    }
}

async function startResponseConsumer() {
    await consume('chat.response.queue.chat', 'chat.response.generated', handleBotResponse);
    await consume('chat.response.queue.user', 'user.updated', updateUser);

    await consume('chat.response.queue.analysis', 'analysis.status', handleAnalysis);
    await consume('chat.response.queue.retrieving', 'retrieving.status', handleRetrieving);
    await consume('chat.response.queue.summarizing', 'summarizing.status', handleSummarizing);
    await consume('chat.response.queue.processing.error', 'processing.error', handleProcessingError);
}

module.exports = { startResponseConsumer };
