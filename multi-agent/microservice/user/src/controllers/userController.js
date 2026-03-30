const { StatusCodes } = require("http-status-codes");
const userService = require("../services/userService");
const { successResponse, errorResponse } = require("../utils/response");
const bcrypt = require("bcryptjs");
const logger = require("../utils/logger");
const { updateUser } = require("../workers/userPublisher");

const findUser = async (req, res) => {
    const user = req.user;

    try {
        logger.info(`Fetching user details for user ID: ${user.id}`);
        return successResponse(res, StatusCodes.OK, "Find user successfully.", {
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            birthday: user.birthday,
            gender: user.gender
        });
    } catch (error) {
        logger.error(`Error fetching user details for user ID: ${user.id} - ${error.message}`);
        return errorResponse(
            res,
            StatusCodes.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

const update = async (req, res) => {
    const user = req.user;
    const { birthday, username } = req.body;

    const updateClause = Object.assign(
        {},
        birthday && { birthday },
        username && { username }
    );

    try {
        await userService.updateUser(user.id, updateClause);
        // publish user update event
        await updateUser({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            avatar: user.avatar
        });
        logger.info(`User updated successfully for user ID: ${user.id}`);
        return successResponse(res, StatusCodes.OK, "User updated successfully.");
    } catch (error) {
        logger.error(`Error updating user ID: ${user.id} - ${error.message}`);
        return errorResponse(
            res,
            StatusCodes.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

const deleteAccount = async (req, res) => {
    const user = req.user;

    try {
        await userService.deleteUser(user.id);
        logger.info(`User deleted successfully for user ID: ${user.id}`);
        return successResponse(res, StatusCodes.OK, "User deleted successfully.");
    } catch (error) {
        logger.error(`Error deleting user ID: ${user.id} - ${error.message}`);
        return errorResponse(
            res,
            StatusCodes.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

const changePassword = async (req, res) => {
    const { curPass, newPass } = req.body;
    const user = req.user;

    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashPassword = bcrypt.hashSync(newPass, salt);

    try {
        const checkPassword = bcrypt.compareSync(curPass, user.password);
        if (!checkPassword) {
            logger.warn(`Incorrect current password for user ID: ${user.id}`);
            return errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                "Password incorrect."
            );
        }

        await userService.updateUser(user.id, {
            password: hashPassword
        });

        logger.info(`Password changed successfully for user ID: ${user.id}`);
        return successResponse(res, StatusCodes.OK, "Change password successfully.");
    } catch (error) {
        logger.error(`Error changing password for user ID: ${user.id} - ${error.message}`);
        return errorResponse(
            res,
            StatusCodes.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

module.exports = {
    findUser,
    update,
    deleteAccount,
    changePassword,
};