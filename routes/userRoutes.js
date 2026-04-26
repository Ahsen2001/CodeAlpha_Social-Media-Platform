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
        .optional({ nullable: true, checkFalsy: true })
        .custom((value) => {
            if (!value) return true;
            // Accept relative upload paths (from multer) OR full http/https URLs
            const isRelativeUpload = /^\/uploads\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(value);
            const isFullUrl        = /^https?:\/\/.+/i.test(value);
            if (!isRelativeUpload && !isFullUrl) {
                throw new Error('avatar_url must be a valid URL or an uploaded file path');
            }
            return true;
        })
], userController.updateProfile);

// Route: GET /api/users/:username
// Desc:  Get a user's profile by username (public profile view)
// Access: Public
router.get('/:username', userController.getUserProfile);

module.exports = router;
