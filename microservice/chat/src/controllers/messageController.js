const { StatusCodes } = require("http-status-codes");
const messageService = require("../services/messageService");
// const { findAllDocument } = require("../utils/axiosClient");
const conversationService = require("../services/conversationService");
const { successResponse, errorResponse } = require("../utils/response");
const logger = require("../utils/logger");
const { emitMessage } = require("../config/socket");
const { sendUserMessage } = require("../workers/messagePublisher");

const create = async (req, res) => {
    const user = req.user;
    const { conversationId, message } = req.body;
    const now = new Date();

    try {
        const oldestMessage = await messageService.findOldestMessage(conversationId);
        const olderMessage = await messageService.findOlderMessage(conversationId, 3);

        const newMessage = await messageService.create({
            conversationId,
            message,
            role: "user"
        });

        await conversationService.update(
            conversationId,
            {
                visitedAt: now
            }
        );

        emitMessage(conversationId, {
            messageId: newMessage.id,
            message: newMessage.message,
            role: newMessage.role
        });

        // publish to chat message
        await sendUserMessage({
            userId: user.id,
            conversationId,
            message: newMessage.message,
            conversation_history: olderMessage
        });

        logger.info(`Message created by user ${user.id}: ${newMessage.id}`);
        return successResponse(res, StatusCodes.CREATED, "Message created successfully.", {
            messageId: newMessage.id,
            message: newMessage.message,
            role: "user"
        });
    } catch (error) {
        return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, error);
    }
}

const drop = async (req, res) => {
    const { messageId } = req.params;

    try {
        await messageService.drop(messageId);

        logger.info(`Message deleted: ${messageId}`);
        return successResponse(res, StatusCodes.OK, "Đã xoá tin nhắn.");
    } catch (error) {
        return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, error);
    }
}

const findAll = async (req, res) => {
    const { conversationId, offset = 0 } = req.query;
    const limit = 20;
    const user = req.user;

    try {
        const message = await messageService.findAll(
            {
                conversationId
            },
            limit,
            offset
        );

        logger.info(`Messages fetched for user ${user.id}`);
        return successResponse(res, StatusCodes.OK, "Find all messages successfully.", message);
    } catch (error) {
        return errorResponse(
            res,
            StatusCodes.INTERNAL_SERVER_ERROR,
            error.message
        );
    }
}

const update = async (req, res) => {
    const { messageId } = req.params;
    const { message, conversationId } = req.body;
    const now = new Date();

    try {
        await messageService.update(
            messageId,
            {
                message
            }
        );

        await conversationService.update(
            conversationId,
            {
                visitedAt: now
            }
        );

        logger.info(`Message updated: ${messageId}`);
        return successResponse(res, StatusCodes.OK, "Message updated successfully.");
    } catch (error) {
        return errorResponse(
            res,
            StatusCodes.INTERNAL_SERVER_ERROR,
            error
        );
    }
}

module.exports = {
    create,
    drop,
    findAll,
    update,
}