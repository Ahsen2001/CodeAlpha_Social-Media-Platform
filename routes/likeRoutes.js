const express = require('express');
const router = express.Router();
const likeController = require('../controllers/likeController');
const { protect } = require('../middlewares/authMiddleware');

// Route: POST /api/likes/post/:postId
// Desc:  Like a post
// Access: Protected
router.post('/post/:postId', protect, likeController.likePost);

// Route: DELETE /api/likes/post/:postId
// Desc:  Unlike a post
// Access: Protected
router.delete('/post/:postId', protect, likeController.unlikePost);

// Route: GET /api/likes/post/:postId/count
// Desc:  Get total likes for a post
// Access: Protected
router.get('/post/:postId/count', protect, likeController.getLikesCount);

module.exports = router;
