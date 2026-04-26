const userModel = require('../models/userModel');
const { validationResult } = require('express-validator');

const userController = {
    // Get currently authenticated user's profile
    async getMyProfile(req, res, next) {
        try {
            const user = await userModel.getUserProfileById(req.user.id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            res.status(200).json({ success: true, profile: user });
        } catch (error) {
            next(error);
        }
    },

    // Get another user's profile by username
    async getUserProfile(req, res, next) {
        try {
            const { username } = req.params;
            const user = await userModel.getUserProfileByUsername(username);
            
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            
            res.status(200).json({ success: true, profile: user });
        } catch (error) {
            next(error);
        }
    },

    // Update authenticated user's profile
    async updateProfile(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            // bio and avatar_url are optional via standard PUT design, mapping to COALESCE in SQL
            let { bio, avatar_url } = req.body;
            
            if (bio === undefined) bio = null;
            if (avatar_url === undefined) avatar_url = null;

            const affectedRows = await userModel.updateUserProfile(req.user.id, bio, avatar_url);

            if (affectedRows > 0) {
                const updatedUser = await userModel.getUserProfileById(req.user.id);
                res.status(200).json({ success: true, profile: updatedUser, message: 'Profile updated successfully' });
            } else {
                res.status(400).json({ success: false, message: 'Failed to update user profile' });
            }
        } catch (error) {
            next(error);
        }
    }
};

module.exports = userController;
