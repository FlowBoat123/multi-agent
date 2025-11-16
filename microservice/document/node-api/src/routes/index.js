const express = require('express');
const router = express.Router();

router.use('/document', require('./documentRoutes'));

module.exports = router;