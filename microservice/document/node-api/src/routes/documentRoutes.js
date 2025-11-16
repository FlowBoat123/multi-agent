const express = require("express");
const documentController = require("../controllers/documentController");
const authMiddleware = require("../middlewares/authMiddeware");
const uploadMiddleware = require("../middlewares/uploadMiddleware");
const router = express.Router();

router.post("/", authMiddleware, uploadMiddleware, documentController.create);
router.delete("/:documentId", authMiddleware, documentController.drop);
router.get("/:documentId", authMiddleware, documentController.findOne);
router.get("/", authMiddleware, documentController.findAll)

module.exports = router;
