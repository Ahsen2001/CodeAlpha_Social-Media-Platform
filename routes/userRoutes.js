const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

// Route: GET /api/users/profile
// Desc:  Get current user's profile
// Access: Protected
router.get('/profile', protect, userController.getMyProfile);

// Route: PUT /api/users/profile
// Desc:  Update current user's profile
// Access: Protected
router.put('/profile', protect, [
    body('avatar_url')
        .optional()
        .isURL({ require_tld: false, require_protocol: true })
        .withMessage('avatar_url must be a valid complete URL')
], userController.updateProfile);

// Route: GET /api/users/:username
// Desc:  Get a user's profile by username (public profile view)
// Access: Public
router.get('/:username', userController.getUserProfile);

module.exports = router;
