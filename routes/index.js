const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// Healthcheck Route
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running and healthy.'
    });
});

module.exports = router;
