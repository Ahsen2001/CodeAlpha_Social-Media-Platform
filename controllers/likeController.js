const likeModel = require('../models/likeModel');

const likeController = {
    async likePost(req, res, next) {
        try {
            const { postId } = req.params;
            
            const result = await likeModel.likePost(req.user.id, postId);
            
            if (!result.success && result.duplicate) {
                return res.status(400).json({ success: false, message: 'You have already liked this post' });
            }

            res.status(201).json({ success: true, message: 'Post liked successfully' });
        } catch (error) {
            // Foreign key constraint failure (e.g., post does not exist)
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(404).json({ success: false, message: 'Referenced Post does not exist' });
            }
            next(error);
        }
    },

    async unlikePost(req, res, next) {
        try {
            const { postId } = req.params;
            
            const affectedRows = await likeModel.unlikePost(req.user.id, postId);
            if (affectedRows === 0) {
                return res.status(400).json({ success: false, message: 'Post was not liked previously' });
            }

            res.status(200).json({ success: true, message: 'Post unliked successfully' });
        } catch (error) {
            next(error);
        }
    },

    async getLikesCount(req, res, next) {
        try {
            const { postId } = req.params;
            const count = await likeModel.getLikesCount(postId);
            
            res.status(200).json({ success: true, postId, count });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = likeController;
