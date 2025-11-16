const User = require('../models/userModel');
const logger = require("../utils/logger");

module.exports = {
    findUserById: async (id) => {
        try {
            const user = await User.findById(id);
            logger.info(`User fetched by ID: ${id}`);
            return user;
        } catch (error) {
            logger.error(`Error fetching user by ID ${id}: ${error.message}`);
            throw error;
        }
    },
    findUserByUsername: async (username) => {
        try {
            const user = await User.findOne({ username });
            logger.info(`User fetched by username: ${username}`);
            return user;
        } catch (error) {
            logger.error(`Error fetching user by username ${username}: ${error.message}`);
            throw error;
        }
    },
    findUserByEmail: async (email) => {
        try {
            const user = await User.findOne({ email });
            logger.info(`User fetched by email: ${email}`);
            return user;
        } catch (error) {
            logger.error(`Error fetching user by email ${email}: ${error.message}`);
            throw error;
        }
    },
    findUserByGoogleId: async (googleId) => {
        try {
            const user = await User.findOne({ google_id: googleId });
            logger.info(`User fetched by Google ID: ${googleId}`);
            return user;
        } catch (error) {
            logger.error(`Error fetching user by Google ID ${googleId}: ${error.message}`);
            throw error;
        }
    },
    updateUser: async (id, data) => {
        try {
            const user = await User.findByIdAndUpdate(id, data, { new: true });
            logger.info(`User updated: ${id}`);
            return user;
        } catch (error) {
            logger.error(`Error updating user ${id}: ${error.message}`);
            throw error;
        }
    },
    deleteUser: async (id) => {
        try {
            const user = await User.findByIdAndDelete(id);
            logger.info(`User deleted: ${id}`);
            return user;
        } catch (error) {
            logger.error(`Error deleting user ${id}: ${error.message}`);
            throw error;
        }
    },
    createUser: async (data) => {
        try {
            const user = await User.create(data);
            logger.info(`User created: ${JSON.stringify(data)}`);
            return user;
        } catch (error) {
            logger.error(`Error creating user: ${error.message}`);
            throw error;
        }
    }
};