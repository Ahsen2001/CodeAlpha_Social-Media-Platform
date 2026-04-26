const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const postController = require('../controllers/postController');
const { protect } = require('../middlewares/authMiddleware');

// Route: POST /api/posts
// Desc:  Create a post
// Access: Protected
router.post('/', protect, [
    body('media_url')
        .optional()
        .isURL({ require_tld: false, require_protocol: true })
        .withMessage('media_url must be a valid complete URL')
], postController.createPost);

// Route: GET /api/posts
// Desc:  Get posts based on follow-feed logic
// Access: Protected
router.get('/', protect, postController.getPosts);

// Route: GET /api/posts/:id
// Desc:  Get post by ID
// Access: Protected
router.get('/:id', protect, postController.getPost);

// Route: DELETE /api/posts/:id
// Desc:  Delete post
// Access: Protected
router.delete('/:id', protect, postController.deletePost);

module.exports = router;
