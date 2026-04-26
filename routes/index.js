const express = require('express');
const router = express.Router();

// Healthcheck Route
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running and healthy.'
    });
});

module.exports = router;
