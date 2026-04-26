const followModel = require('../models/followModel');

const followController = {
    async followUser(req, res, next) {
        try {
            const followedId = parseInt(req.params.userId, 10);
            const followerId = req.user.id;

            if (followerId === followedId) {
                return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
            }

            const result = await followModel.followUser(followerId, followedId);
            
            if (!result.success && result.duplicate) {
                return res.status(400).json({ success: false, message: 'You are already following this user' });
            }

            res.status(201).json({ success: true, message: 'User followed successfully' });
        } catch (error) {
            // Foreign key error when target user does not exist
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(404).json({ success: false, message: 'User does not exist' });
            }
            next(error);
        }
    },

    async unfollowUser(req, res, next) {
        try {
            const followedId = parseInt(req.params.userId, 10);
            const followerId = req.user.id;

            const affectedRows = await followModel.unfollowUser(followerId, followedId);
            if (affectedRows === 0) {
                return res.status(400).json({ success: false, message: 'You are not following this user' });
            }

            res.status(200).json({ success: true, message: 'User unfollowed successfully' });
        } catch (error) {
            next(error);
        }
    },

    async getFollowers(req, res, next) {
        try {
            const { userId } = req.params;
            const followers = await followModel.getFollowers(userId);
            
            res.status(200).json({ success: true, count: followers.length, followers });
        } catch (error) {
            next(error);
        }
    },

    async getFollowing(req, res, next) {
        try {
            const { userId } = req.params;
            const following = await followModel.getFollowing(userId);
            
            res.status(200).json({ success: true, count: following.length, following });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = followController;
