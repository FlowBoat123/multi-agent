const { successResponse, errorResponse } = require("../utils/response");
const { StatusCodes } = require("http-status-codes");
const userService = require("../services/userService");
const otpService = require("../services/otpService");
const bcrypt = require("bcryptjs");
const { createAccessToken, createRefreshToken, decodeRefreshToken } = require("../utils/jwt");
const ms = require("ms");
const otpGenerator = require("otp-generator");
const mail = require("../utils/mail");
const logger = require("../utils/logger");

const login = async (req, res) => {
    try {
        const { password } = req.body;
        const email = req.body.email.toLowerCase();

        const user = await userService.findUserByEmail(email);
        if (!user) {
            logger.warn(`Login failed: Email not found - ${email}`);
            return errorResponse(res, StatusCodes.NOT_FOUND, "Email not found.");
        }
        const checkPassword = bcrypt.compareSync(password, user.password);
        if (!checkPassword) {
            logger.warn(`Login failed: Incorrect password for email - ${email}`);
            return errorResponse(
                res,
                StatusCodes.BAD_REQUEST,
                "Password incorrect."
            );
        }

        const accessToken = createAccessToken({
            userId: user.id
        });
        const refreshToken = createRefreshToken({ userId: user.id });
        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            maxAge: ms("7 days"),
            sameSite: 'Strict'
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            maxAge: ms("7 days"),
            sameSite: 'Strict'
        });
        res.cookie("isLogin", user.username, {
            maxAge: ms("7 days"),
        });

        logger.info(`User logged in successfully: ${user.id}`);
        return successResponse(res, StatusCodes.OK, "Login successfully.", {
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            birthday: user.birthday,
            gender: user.gender
        });
    } catch (error) {
        logger.error(`Error during login: ${error.message}`);
        return errorResponse(
            res,
            StatusCodes.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

const register = async (req, res) => {
    const { password, birthday, username } = req.body;
    const email = req.body.email.toLowerCase();

    const user = await userService.findUserByEmail(email);
    if (user) {
        logger.warn(`Registration failed: Email already exists - ${email}`);
        return errorResponse(res, StatusCodes.BAD_REQUEST, "Email existed.");
    }

    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashPassword = bcrypt.hashSync(password, salt);

    try {
        const user = await userService.createUser({
            birthday,
            username,
            email,
            password: hashPassword
        });

        logger.info(`User registered successfully: ${user.id}`);
        return successResponse(res, StatusCodes.CREATED, "Registration successful.");
    } catch (error) {
        logger.error(`Error during registration: ${error.message}`);
        return errorResponse(
            res,
            StatusCodes.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

const logout = async (req, res) => {
    try {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        res.clearCookie("isLogin");
        logger.info("User logged out successfully");
        return successResponse(res, StatusCodes.OK, "Log out successfully.");
    } catch (error) {
        logger.error(`Error during logout: ${error.message}`);
        return errorResponse(
            res,
            StatusCodes.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

const sendOTP = async (req, res) => {
    const email = req.body.email.toLowerCase();

    const otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
        digits: true
    });

    try {
        const userExist = await userService.findUserByEmail(email);
        if (userExist) {
            logger.warn(`OTP request failed: Email already exists - ${email}`);
            return errorResponse(res, StatusCodes.CONFLICT, "Email existed.");
        }

        await mail.sendVerificationEmail(email, otp);

        const expire = new Date();
        expire.setMinutes(expire.getMinutes() + 5);

        await otpService.create({
            email: email,
            otp: otp,
            expire
        });

        logger.info(`OTP sent successfully to email: ${email}`);
        return successResponse(res, StatusCodes.OK, "OTP sent successfully");
    } catch (error) {
        logger.error(`Error sending OTP: ${error.message}`);
        return errorResponse(
            res,
            StatusCodes.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

const verifyOTP = async (req, res) => {
    const { otp } = req.body;
    const email = req.body.email.toLowerCase();
    const time = new Date();

    try {
        const otpEx = await otpService.findOne({
            email: email
        });

        if (otpEx.expire < time) {
            logger.warn(`OTP verification failed: OTP expired for email - ${email}`);
            return errorResponse(
                res,
                StatusCodes.CONFLICT,
                "OTP expired, please request a new one."
            );
        }

        if (otpEx.otp != otp) {
            logger.warn(`OTP verification failed: Incorrect OTP for email - ${email}`);
            return errorResponse(
                res,
                StatusCodes.CONFLICT,
                "OTP incorrect."
            );
        }

        logger.info(`OTP verified successfully for email: ${email}`);
        return successResponse(res, StatusCodes.OK, "OTP verified successfully.");
    } catch (error) {
        logger.error(`Error verifying OTP: ${error.message}`);
        return errorResponse(
            res,
            StatusCodes.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

const refreshToken = async (req, res) => {
    try {
        const refreshTokenFromCookie = req.cookies?.refreshToken;

        const decodedRefreshToken = decodeRefreshToken(refreshTokenFromCookie);
        if (!decodedRefreshToken) {
            logger.warn("Refresh token failed: Invalid token");
            return errorResponse(res, StatusCodes.UNAUTHORIZED, "Invalid token");
        }

        const newAccessToken = createAccessToken({
            userId: decodedRefreshToken.userId
        });

        res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            maxAge: ms("7 days"),
            sameSite: 'Strict'
        });

        logger.info(`Refresh token successful for user ID: ${decodedRefreshToken.userId}`);
        return successResponse(res, StatusCodes.OK, "Refresh token successfully.", {
            accessToken: newAccessToken,
        });
    } catch (error) {
        logger.error(`Error during refresh token: ${error.message}`);
        return errorResponse(
            res,
            StatusCodes.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

const googleAuthCallback = async (req, res) => {
    const user = req.user;

    try {
        let userExist = await userService.findUserByGoogleId(user.googleId);

        if (!userExist) {
            userExist = await userService.createUser({
                google_id: user.googleId,
                username: user.username,
                email: user.email
            });
        }

        const accessToken = createAccessToken({
            userId: userExist.id
        });
        const refreshToken = createRefreshToken({ userId: userExist.id });

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            maxAge: ms("7 days"),
            sameSite: 'Strict'
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            maxAge: ms("7 days"),
            sameSite: 'Strict'
        });
        res.cookie("isLogin", user.username, {
            maxAge: ms("7 days"),
            sameSite: 'Strict'
        });

        logger.info(`Google authentication successful for user ID: ${userExist.id}`);
        return res.redirect('http://localhost:5173');
    } catch (error) {
        logger.error(`Error during Google authentication: ${error.message}`);
        return errorResponse(
            res,
            StatusCodes.INTERNAL_SERVER_ERROR,
            error
        );
    }
};

module.exports = {
    login,
    register,
    logout,
    sendOTP,
    verifyOTP,
    refreshToken,
    googleAuthCallback
};