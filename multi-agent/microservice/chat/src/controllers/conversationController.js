const { StatusCodes } = require("http-status-codes");
const conversationService = require("../services/conversationService");
const messageService = require("../services/messageService");
const { successResponse, errorResponse } = require("../utils/response");
const logger = require("../utils/logger"); 
const create = async (req, res) => {
    const user = req.user;
    const name = req.body.name || "New chat";

    try {
        const conversation = await conversationService.create({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar || null,
                role: user.role || "user"
            },
            name: name,
        });

        logger.info(`Conversation created by user ${user.id}: ${conversation.id}`);
        return successResponse(res, StatusCodes.CREATED, "New conversation created successfully.", {
            conversationId: conversation.id,
            conversationName: conversation.name
        });
    } catch (error) {
        logger.error(`Error creating conversation: ${error.message}`);
        return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

const drop = async (req, res) => {
    const { conversationId } = req.params;

    try {
        await messageService.drop({ conversationId });
        await conversationService.drop(conversationId);

        logger.info(`Conversation deleted: ${conversationId}`);
        return successResponse(res, StatusCodes.OK, "Conversation has been deleted successfully.");
    } catch (error) {
        logger.error(`Error deleting conversation ${conversationId}: ${error.message}`);
        return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

const findAll = async (req, res) => {
    const user = req.user;
    const { offset } = req.query;
    const limit = 10;

    try {
        const conversation = await conversationService.findAll(
            { "user.id": user.id },
            limit,
            offset
        );

        logger.info(`Conversations fetched for user ${user.id}`);
        return successResponse(res, StatusCodes.OK, "Find all conversations successfully", conversation);
    } catch (error) {
        logger.error(`Error fetching conversations for user ${user.id}: ${error.message}`);
        return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

const update = async (req, res) => {
    const { conversationId } = req.params;
    const { name } = req.body;

    try {
        await conversationService.update(conversationId, { name });

        logger.info(`Conversation updated: ${conversationId}`);
        return successResponse(res, StatusCodes.OK, "Conversation has been updated successfully.");
    } catch (error) {
        logger.error(`Error updating conversation ${conversationId}: ${error.message}`);
        return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
};

module.exports = {
    create,
    drop,
    findAll,
    update
};