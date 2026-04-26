const path = require('path');
const userModel = require('../models/userModel');
const { deleteOldAvatar } = require('../middlewares/uploadMiddleware');

const uploadController = {
    /**
     * POST /api/upload/avatar
     * Handles profile picture upload.
     * The file is already saved to disk by multer at this point.
     */
    async uploadAvatar(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No file uploaded.' });
            }

            // Delete any previous avatar files with different extensions before updating DB
            deleteOldAvatar(req.user.id);

            // Build a publicly accessible URL path
            const avatarUrl = `/uploads/avatars/${req.file.filename}`;

            // Persist the new avatar_url in the database
            await userModel.updateUserProfile(req.user.id, null, avatarUrl);

            res.status(200).json({
                success: true,
                message: 'Profile picture updated successfully.',
                avatar_url: avatarUrl,
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/upload/post-image
     * Handles post image upload. Returns the hosted URL for use in post creation.
     */
    async uploadPostImage(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No file uploaded.' });
            }

            const imageUrl = `/uploads/posts/${req.file.filename}`;

            res.status(200).json({
                success: true,
                message: 'Image uploaded successfully.',
                image_url: imageUrl,
            });
        } catch (error) {
            next(error);
        }
    },
};

module.exports = uploadController;
