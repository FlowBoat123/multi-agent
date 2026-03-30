const express = require("express");
const conversationController = require("../controllers/conversationController");
const authMiddleware = require("../middlewares/authMiddeware");
const router = express.Router();

router.get("/", authMiddleware, conversationController.findAll);
router.delete("/:conversationId", authMiddleware, conversationController.drop);
router.patch("/:conversationId", authMiddleware, conversationController.update);
router.post("/", authMiddleware, conversationController.create);

module.exports = router;
