const express = require('express');
const router = express.Router();

router.use('/conversation', require('./conversationRoutes'));
router.use('/message', require('./messageRoutes'));

module.exports = router;