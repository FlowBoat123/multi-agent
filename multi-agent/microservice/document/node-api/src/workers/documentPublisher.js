const logger = require('../utils/logger');
const { publish } = require('../utils/rabbitmq');

// Khi user gửi message
async function sendDocument({ documentId, name, userId }) {
    logger.info('Document:', name);
    await publish('document.received', {
        documentId,
        name,
        userId
    });
}

async function deleteDocument({ documentId, name, userId }) {
    logger.info('Deleting document:', name);
    await publish('document.deleted', {
        documentId,
        name,
        userId
    });
}

module.exports = { sendDocument, deleteDocument };
