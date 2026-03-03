const Message = require("../models/messageModel");
const mongoose = require("mongoose");
const logger = require("../utils/logger");

const findById = async (id) => {
    return await Message.findById(id);
}

const findOne = async (whereClause) => {
    return await Message.findOne(whereClause);
};

const findAll = async (whereClause, limit = 10, offset = 0) => {
    try {
        const query = { ...whereClause };

        // Validate và convert ObjectId
        if (query.conversationId && mongoose.Types.ObjectId.isValid(query.conversationId)) {
            query.conversationId = new mongoose.Types.ObjectId(query.conversationId);
        }

        logger.info(`Fetching messages for conversation ${query.conversationId}`);

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(Math.max(0, Number(limit)))
            .skip(Math.max(0, Number(offset)))
            .lean(); // Thêm .lean() để tăng performance

        return messages;

    } catch (error) {
        logger.error(`Error in findAll: ${error.message}`, { whereClause, limit, offset });
        throw error;
    }
};

const create = async (insertClause) => {
    try {
        // Tạo copy để không mutate input
        const messageData = { ...insertClause };

        // Validate và convert ObjectId
        if (messageData.conversationId) {
            if (!mongoose.Types.ObjectId.isValid(messageData.conversationId)) {
                throw new Error(`Invalid conversationId: ${messageData.conversationId}`);
            }
            messageData.conversationId = new mongoose.Types.ObjectId(messageData.conversationId);
        }

        // Tạo và save message
        const message = new Message(messageData);
        const savedMessage = await message.save();

        logger.info(`Message created in conversation ${messageData.conversationId}`, {
            messageId: savedMessage._id,
            conversationId: messageData.conversationId
        });

        return savedMessage;

    } catch (error) {
        logger.error(`Error creating message: ${error.message}`, { insertClause });
        throw error;
    }
};

const drop = async (whereClause) => {
    try {
        // Tạo copy để không mutate input
        const query = { ...whereClause };

        // Validate và convert ObjectId
        if (query.conversationId) {
            if (!mongoose.Types.ObjectId.isValid(query.conversationId)) {
                throw new Error(`Invalid conversationId: ${query.conversationId}`);
            }
            query.conversationId = new mongoose.Types.ObjectId(query.conversationId);
        }

        // Delete messages
        const result = await Message.deleteMany(query);

        logger.info(`Messages deleted for conversation ${query.conversationId}`, {
            deletedCount: result.deletedCount,
            conversationId: query.conversationId
        });

        return result;

    } catch (error) {
        logger.error(`Error deleting messages: ${error.message}`, { whereClause });
        throw error;
    }
};

const update = async (id, updateClause) => {
    return await Message.findByIdAndUpdate(id, updateClause, { new: true });
};

const findOldestMessage = async (conversationId) => {
    const conversation = new mongoose.Types.ObjectId(conversationId);

    return await Message.findOne({
        conversationId: conversation,
        role: "bot",
    }).sort({ createdAt: -1 }).lean();
}

const findOlderMessage = async (conversationId, limit) => {
    const conversation = new mongoose.Types.ObjectId(conversationId);

    const botMessage = await Message.find({
        conversationId: conversation,
        role: "bot"
    }).sort({ createdAt: -1 }).limit(limit).lean();

    const userMessage = await Message.find({
        conversationId: conversation,
        role: "user"
    }).sort({ createdAt: -1 }).limit(limit).lean();

    const response = []
    const count = Math.min(limit, userMessage.length, botMessage.length);

    for (let i = 0; i < count; i++) {
        response.push({
            "user": userMessage[i].message,
            "bot": botMessage[i].message,
            "context": botMessage[i].context
        });
    }

    return response
}

module.exports = {
    findAll,
    findOne,
    create,
    drop,
    update,
    findById,
    findOldestMessage,
    findOlderMessage
};