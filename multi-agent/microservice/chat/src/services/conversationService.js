const Conversation = require("../models/conversationModel");
const logger = require("../utils/logger");

const create = async (insertClause) => {
    const conversation = new Conversation(insertClause);
    await conversation.save();
    logger.info(`Conversation created: ${conversation.id}`);
    return conversation;
};

const drop = async (id) => {
    const result = await Conversation.findByIdAndDelete(id);
    logger.info(`Conversation deleted: ${id}`);
    return result;
};

const update = async (id, updateClause) => {
    const result = await Conversation.findByIdAndUpdate(id, updateClause, { new: true });
    logger.info(`Conversation updated: ${id}`);
    return result;
};

const findAll = async (whereClause, limit, offset) => {
    return await Conversation.find(whereClause)
        .sort({ visitedAt: -1 })
        .limit(limit)
        .skip(offset);
};

const findById = async (id) => {
    return (await Conversation.findById(id));
};

const findOne = async (whereClause) => {
    return (await Conversation.findOne(whereClause));
};

const updateUser = async (user) => {
    return await Conversation.updateMany(
        { "user.id": user.id },
        {
            $set: {
                "user.username": user.username,
                "user.email": user.email,
                "user.avatar": user.avatar,
                "user.role": user.role,
            },
        },
        { new: true }
    );
}

module.exports = {
    findAll,
    findOne,
    create,
    drop,
    update,
    findById,
    updateUser
};