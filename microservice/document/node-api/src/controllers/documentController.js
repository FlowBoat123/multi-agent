const { StatusCodes } = require("http-status-codes");
const documentService = require("../services/documentService");
const { successResponse, errorResponse } = require("../utils/response");
const minio = require("../utils/minio");
const logger = require("../utils/logger");
const { sendDocument, deleteDocument } = require("../workers/documentPublisher");

const create = async (req, res) => {
    const file = req.file;
    const user = req.user;
    const name = file.originalname;

    try {
        logger.info(`Checking if document with name "${name}" already exists for user ID: ${user.id}`);
        const existingName = await documentService.findOne({
            "user.id": user.id,
            name
        });

        if (existingName) {
            logger.warn(`Document with name "${name}" already exists for user ID: ${user.id}`);
            return errorResponse(res, StatusCodes.BAD_REQUEST, "Document with this name already exists.");
        }

        logger.info(`Creating new document "${name}" for user ID: ${user.id}`);
        const document = await documentService.create({
            name,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar: user.avatar || "https://example.com/default-avatar.png",
                role: user.role || "user"
            }
        });

        logger.info(`Uploading file "${name}" to MinIO for user ID: ${user.id}`);
        await minio.uploadFile(`user${user.id}`, file.buffer, file.originalname);

        // publish document creation event
        await sendDocument({
            documentId: document.id,
            name: document.name,
            userId: user.id
        });

        logger.info(`Document "${name}" created successfully for user ID: ${user.id}`);
        return successResponse(res, StatusCodes.CREATED, "Document uploaded successfully. Please wait 5-10m to search with this document.", {
            documentId: document.id,
            documentName: name
        });
    } catch (error) {
        logger.error(`Error creating document "${name}" for user ID: ${user.id} - ${error.message}`);
        return errorResponse(
            res,
            StatusCodes.INTERNAL_SERVER_ERROR,
            error.message
        );
    }
};

const drop = async (req, res) => {
    const { documentId } = req.params;
    const user = req.user;

    try {
        logger.info(`Fetching document with ID: ${documentId} for user ID: ${user.id}`);
        const document = await documentService.findById(documentId);

        logger.info(`Deleting file "${document.name}" from MinIO for user ID: ${user.id}`);
        await minio.deleteFile(`user${user.id}`, document.name);

        logger.info(`Deleting document with ID: ${documentId} from database`);
        await documentService.drop(documentId);

        // publish document deletion event
        await deleteDocument({
            documentId: document.id,
            name: document.name,
            userId: user.id
        });

        logger.info(`Document with ID: ${documentId} deleted successfully for user ID: ${user.id}`);
        return successResponse(res, StatusCodes.OK, "Document deleted successfully.");
    } catch (error) {
        logger.error(`Error deleting document with ID: ${documentId} for user ID: ${user.id} - ${error.message}`);
        return errorResponse(
            res,
            StatusCodes.INTERNAL_SERVER_ERROR,
            error.message
        );
    }
};

const findOne = async (req, res) => {
    const { documentId } = req.params;
    const user = req.user;

    try {
        logger.info(`Fetching document with ID: ${documentId} for user ID: ${user.id}`);
        const document = await documentService.findById(documentId);

        logger.info(`Generating presigned URL for file "${document.name}" from MinIO for user ID: ${user.id}`);
        const file = await minio.getFile(`user${user.id}`, document.name);

        logger.info(`Document with ID: ${documentId} fetched successfully for user ID: ${user.id}`);
        return successResponse(res, StatusCodes.OK, "Document fetched successfully.", {
            link: file
        });
    } catch (error) {
        logger.error(`Error fetching document with ID: ${documentId} for user ID: ${user.id} - ${error.message}`);
        return errorResponse(
            res,
            StatusCodes.INTERNAL_SERVER_ERROR,
            error.message
        );
    }
};

const findAll = async (req, res) => {
    const user = req.user;

    try {
        logger.info(`Fetching all documents for user ID: ${user.id}`);
        const documents = await documentService.findAll({
            "user.id": user.id
        });

        logger.info(`All documents fetched successfully for user ID: ${user.id}`);
        return successResponse(res, StatusCodes.OK, "Documents fetched successfully.", documents);
    } catch (error) {
        logger.error(`Error fetching documents for user ID: ${user.id} - ${error.message}`);
        return errorResponse(
            res,
            StatusCodes.INTERNAL_SERVER_ERROR,
            error.message
        );
    }
};

module.exports = {
    create,
    drop,
    findOne,
    findAll
};