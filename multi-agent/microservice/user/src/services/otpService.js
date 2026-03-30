const Otp = require("../models/otpModel");
const logger = require("../utils/logger");

const findOne = async (whereClause) => {
    try {
        const otp = await Otp.findOne(whereClause).sort({ createdAt: -1 });
        logger.info(`OTP fetched for condition: ${JSON.stringify(whereClause)}`);
        return otp;
    } catch (error) {
        logger.error(`Error fetching OTP: ${error.message}`);
        throw error;
    }
};

const create = async (insertClause) => {
    try {
        const otp = new Otp(insertClause);
        await otp.save();
        logger.info(`OTP created: ${JSON.stringify(insertClause)}`);
        return otp;
    } catch (error) {
        logger.error(`Error creating OTP: ${error.message}`);
        throw error;
    }
};

module.exports = {
    findOne,
    create,
};