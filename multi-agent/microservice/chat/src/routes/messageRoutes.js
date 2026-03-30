const express = require("express");
const messageController = require("../controllers/messageController");
const authMiddleware = require("../middlewares/authMiddeware");
const router = express.Router();

router.get("/", authMiddleware, messageController.findAll);
router.delete("/:messageId", authMiddleware, messageController.drop);
router.patch("/:messageId", authMiddleware, messageController.update);
router.post("/", authMiddleware, messageController.create);


module.exports = router;
