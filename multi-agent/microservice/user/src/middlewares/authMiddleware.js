const { StatusCodes } = require("http-status-codes");
const { errorResponse } = require("../utils/response");
const { decodeAccessToken, decodeRefreshToken, createAccessToken } = require("../utils/jwt");
const userService = require("../services/userService");
const logger = require("../utils/logger");
const ms = require("ms");

const logout = (res) => {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.clearCookie("isLogin");
    logger.info("User logged out and cookies cleared.");
};

const authMiddleware = async (req, res, next) => {
    const accessToken = req.cookies?.accessToken || req.headers["authorization"]?.split(" ")[1];
    const refreshToken = req.cookies?.refreshToken || req.headers["x-refresh-token"]?.split(" ")[1];

    try {
        const decodedAccessToken = decodeAccessToken(accessToken);
        req.user = await userService.findUserById(decodedAccessToken.userId);
        logger.info(`Access token validated for user ${req.user.id}`);
        next();
    } catch (error) {
        if (error?.message?.includes("jwt expired") || error?.message?.includes("jwt malformed")) {
            if (!refreshToken) {
                logout(res);
                logger.warn("Refresh token not found. User needs to log in again.");
                return errorResponse(
                    res,
                    StatusCodes.UNAUTHORIZED,
                    "Refresh token not found. Please log in again."
                );
            }

            try {
                const decodedRefreshToken = decodeRefreshToken(refreshToken);
                req.user = await userService.findUserById(decodedRefreshToken.userId);

                if (!req.user) {
                    logout(res);
                    logger.warn("Invalid refresh token. User needs to log in again.");
                    return errorResponse(
                        res,
                        StatusCodes.UNAUTHORIZED,
                        "Refresh token is invalid. Please log in again."
                    );
                }

                const newAccessToken = createAccessToken({ userId: req.user.id });
                res.cookie("accessToken", newAccessToken, {
                    httpOnly: true,
                    maxAge: ms("7 days"),
                });

                logger.info(`New access token issued for user ${req.user.id}`);
                next();
            } catch (refreshTokenError) {
                logout(res);
                logger.error(`Refresh token validation failed: ${refreshTokenError.message}`);
                return errorResponse(
                    res,
                    StatusCodes.UNAUTHORIZED,
                    "Refresh token expired. Please log in again."
                );
            }
        } else {
            logout(res);
            logger.error(`Authorization failed: ${error.message}`);
            return errorResponse(
                res,
                StatusCodes.UNAUTHORIZED,
                "Unauthorized! Please log in again."
            );
        }
    }
};

module.exports = authMiddleware;