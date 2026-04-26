const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { uploadAvatar, uploadPostImage } = require('../middlewares/uploadMiddleware');
const uploadController = require('../controllers/uploadController');

/**
 * POST /api/upload/avatar
 * Upload a profile picture (replaces existing)
 * Access: Protected
 */
router.post('/avatar', protect, uploadAvatar, uploadController.uploadAvatar);

/**
 * POST /api/upload/post-image
 * Upload an image for use in a post.
 * Returns the hosted URL; client then passes it as media_url in POST /api/posts.
 * Access: Protected
 */
router.post('/post-image', protect, uploadPostImage, uploadController.uploadPostImage);

module.exports = router;
