const express = require("express");
const passport = require('passport');

const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/login", authController.login);
router.post("/register", authController.register);
router.delete("/logout", authMiddleware, authController.logout);
router.post("/sendOtp", authController.sendOTP);
router.post("/verifyOtp", authController.verifyOTP);
router.put("/refresh-token", authController.refreshToken);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), authController.googleAuthCallback);

module.exports = router;