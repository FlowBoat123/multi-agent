const Document = require("../models/documentModel");
const logger = require("../utils/logger"); // Import logger

const findAll = async (whereClause) => {
    try {
        const documents = await Document.find(whereClause);
        logger.info(`Fetched all documents with condition: ${JSON.stringify(whereClause)}`);
        return documents;
    } catch (error) {
        logger.error(`Error fetching documents: ${error.message}`);
        throw error;
    }
};

const findById = async (id) => {
    try {
        const document = await Document.findById(id);
        if (!document) {
            logger.warn(`Document not found with ID: ${id}`);
        } else {
            logger.info(`Fetched document with ID: ${id}`);
        }
        return document;
    } catch (error) {
        logger.error(`Error fetching document by ID ${id}: ${error.message}`);
        throw error;
    }
};

const findOne = async (whereClause) => {
    try {
        const document = await Document.findOne(whereClause);
        if (!document) {
            logger.warn(`Document not found with condition: ${JSON.stringify(whereClause)}`);
        } else {
            logger.info(`Fetched document with condition: ${JSON.stringify(whereClause)}`);
        }
        return document;
    } catch (error) {
        logger.error(`Error fetching document: ${error.message}`);
        throw error;
    }
};

const create = async (insertClause) => {
    try {
        const document = new Document(insertClause);
        await document.save();
        logger.info(`Document created successfully: ${JSON.stringify(insertClause)}`);
        return document;
    } catch (error) {
        logger.error(`Error creating document: ${error.message}`);
        throw error;
    }
};

// Xóa một tài liệu theo ID
const drop = async (id) => {
    try {
        const result = await Document.findByIdAndDelete(id);
        if (!result) {
            logger.warn(`Document not found for deletion with ID: ${id}`);
        } else {
            logger.info(`Document deleted successfully with ID: ${id}`);
        }
        return result;
    } catch (error) {
        logger.error(`Error deleting document with ID ${id}: ${error.message}`);
        throw error;
    }
};

// Cập nhật một tài liệu theo ID
const update = async (id, updateClause) => {
    try {
        const updatedDocument = await Document.findByIdAndUpdate(id, updateClause, { new: true });
        if (!updatedDocument) {
            logger.warn(`Document not found for update with ID: ${id}`);
        } else {
            logger.info(`Document updated successfully with ID: ${id}`);
        }
        return updatedDocument;
    } catch (error) {
        logger.error(`Error updating document with ID ${id}: ${error.message}`);
        throw error;
    }
};

const updateUser = async (user) => {
    try {
        return await Document.updateMany(
            { "user.id": user.id },
            {
                $set: {
                    "user.username": user.username,
                    "user.email": user.email,
                    "user.avatar": user.avatar,
                    "user.role": user.role
                }
            },
            { new: true });
    } catch (error) {
        logger.error(`Error updating user in documents: ${error.message}`);
        throw error;
    }
};

module.exports = {
    findAll,
    findOne,
    create,
    drop,
    update,
    findById,
    updateUser
};