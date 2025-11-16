const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const router = express.Router();

router.get("/", authMiddleware, userController.findUser);
router.patch("/update", authMiddleware, userController.update);
router.delete("/delete", authMiddleware, userController.deleteAccount);
router.patch("/changePassword", authMiddleware, userController.changePassword);

module.exports = router;
