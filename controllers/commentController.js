const commentModel = require('../models/commentModel');
const { validationResult } = require('express-validator');

const commentController = {
    async addComment(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { content } = req.body;
            const { postId } = req.params;

            const insertId = await commentModel.createComment(postId, req.user.id, content);
            const newComment = await commentModel.getCommentById(insertId);

            res.status(201).json({ success: true, comment: newComment });
        } catch (error) {
            // Check if foreign key constraint error due to invalid post ID
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                return res.status(404).json({ success: false, message: 'Referenced Post does not exist' });
            }
            next(error);
        }
    },

    async getComments(req, res, next) {
        try {
            const { postId } = req.params;
            const comments = await commentModel.getCommentsByPostId(postId);
            
            res.status(200).json({ success: true, count: comments.length, comments });
        } catch (error) {
            next(error);
        }
    },

    async deleteComment(req, res, next) {
        try {
            const affectedRows = await commentModel.deleteComment(req.params.id, req.user.id);
            if (affectedRows === 0) {
                // Comment either doesn't exist, or doesn't belong to the user
                return res.status(403).json({ success: false, message: 'Not authorized or comment does not exist' });
            }
            res.status(200).json({ success: true, message: 'Comment deleted successfully' });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = commentController;
