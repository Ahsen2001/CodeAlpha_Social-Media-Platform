const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { protect } = require('../middlewares/authMiddleware');

// Route: POST /api/comments/post/:postId
// Desc:  Add a comment to a post
// Access: Protected
router.post('/post/:postId', protect, [
    body('content').notEmpty().withMessage('Comment content is required')
], commentController.addComment);

// Route: GET /api/comments/post/:postId
// Desc:  Get all comments for a post
// Access: Protected
router.get('/post/:postId', protect, commentController.getComments);

// Route: DELETE /api/comments/:id
// Desc:  Delete a comment by its ID
// Access: Protected
router.delete('/:id', protect, commentController.deleteComment);

module.exports = router;
