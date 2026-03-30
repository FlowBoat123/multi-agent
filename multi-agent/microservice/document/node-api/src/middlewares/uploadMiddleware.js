const { upload } = require("../utils/upload");
const { errorResponse } = require("../utils/response");
const { StatusCodes } = require("http-status-codes");

const uploadMiddleware = async (req, res, next) => {
    try {
        await upload.single('file')(req, res, (err) => {
            if (err) {
                return errorResponse(res, StatusCodes.BAD_REQUEST, "File is not valid or too large");
            }
            next();
        });
    } catch (error) {
        console.log(error)
        return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message)
    }
}

module.exports = uploadMiddleware;
