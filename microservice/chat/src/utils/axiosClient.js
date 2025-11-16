const axios = require('axios');
const logger = require('./logger');

const findOneUser = async (accessToken, refreshToken) => {
    try {
        const response = await axios.get('http://user:3004/api/v1/user/', {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
                'x-refresh-token': `Bearer ${refreshToken}`,
            },
            withCredentials: true,
        });
        logger.info('Successfully fetched user data.');
        return response.data.data;
    } catch (error) {
        logger.error(`Error fetching user: ${error.message}`);
        throw error;
    }
};

const findAllDocument = async (accessToken, refreshToken) => {
    try {
        const response = await axiosClient.get('http://document:3001/api/v1/document/', {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
                'x-refresh-token': `Bearer ${refreshToken}`,
            },
            withCredentials: true,
        });
        logger.info(`Fetched all documents.`);
        return response.data.data;
    } catch (error) {
        logger.error(`Error fetching documents: ${error.message}`);
        throw error;
    }
};

module.exports = {
    findOneUser,
    findAllDocument,
};