const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');
const { protect } = require('../middlewares/authMiddleware');

// Route: POST /api/follows/user/:userId
// Desc:  Follow a user
// Access: Protected
router.post('/user/:userId', protect, followController.followUser);

// Route: DELETE /api/follows/user/:userId
// Desc:  Unfollow a user
// Access: Protected
router.delete('/user/:userId', protect, followController.unfollowUser);

// Route: GET /api/follows/user/:userId/followers
// Desc:  Get a user's followers list
// Access: Protected
router.get('/user/:userId/followers', protect, followController.getFollowers);

// Route: GET /api/follows/user/:userId/following
// Desc:  Get a user's following list
// Access: Protected
router.get('/user/:userId/following', protect, followController.getFollowing);

module.exports = router;
