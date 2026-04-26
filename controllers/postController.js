const postModel = require('../models/postModel');
const { validationResult } = require('express-validator');

const postController = {
    async createPost(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { content, media_url } = req.body;
            
            if (!content && !media_url) {
                return res.status(400).json({ success: false, message: 'Post must contain either content or media' });
            }

            const insertId = await postModel.createPost(req.user.id, content || null, media_url || null);
            const newPost = await postModel.getPostById(insertId);

            res.status(201).json({ success: true, post: newPost });
        } catch (error) {
            next(error);
        }
    },

    async getPosts(req, res, next) {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const offset = parseInt(req.query.offset) || 0;
            
            // To align with the follow-based feed logic, we'll fetch the Relationship feed.
            const posts = await postModel.getFeed(req.user.id, limit, offset);
            
            res.status(200).json({ success: true, posts });
        } catch (error) {
            next(error);
        }
    },

    async getPost(req, res, next) {
        try {
            const post = await postModel.getPostById(req.params.id);
            if (!post) {
                return res.status(404).json({ success: false, message: 'Post not found' });
            }
            res.status(200).json({ success: true, post });
        } catch (error) {
            next(error);
        }
    },

    async deletePost(req, res, next) {
        try {
            const affectedRows = await postModel.deletePost(req.params.id, req.user.id);
            if (affectedRows === 0) {
                // Post either doesn't exist, or doesn't belong to the user
                return res.status(403).json({ success: false, message: 'Not authorized or post does not exist' });
            }
            res.status(200).json({ success: true, message: 'Post deleted successfully' });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = postController;
