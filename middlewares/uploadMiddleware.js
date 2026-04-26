const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── Ensure upload directories exist ──────────────────────
const UPLOAD_ROOT = path.join(__dirname, '..', 'public', 'uploads');
const DIRS = {
    avatars: path.join(UPLOAD_ROOT, 'avatars'),
    posts: path.join(UPLOAD_ROOT, 'posts'),
};
Object.values(DIRS).forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── Allowed MIME types ───────────────────────────────────
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE_MB = 5;

// ── File filter ──────────────────────────────────────────
const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP are allowed.'));
    }
};

// ── Storage: Profile Avatars ─────────────────────────────
const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, DIRS.avatars),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        // Use user ID to overwrite their existing avatar automatically
        cb(null, `user_${req.user.id}${ext}`);
    },
});

// ── Storage: Post Images ─────────────────────────────────
const postStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, DIRS.posts),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e6)}`;
        cb(null, `post_${req.user.id}_${uniqueSuffix}${ext}`);
    },
});

// ── Multer instances ─────────────────────────────────────
const uploadAvatar = multer({
    storage: avatarStorage,
    limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
    fileFilter,
});

const uploadPostImage = multer({
    storage: postStorage,
    limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
    fileFilter,
});

// ── Multer error handler (wrap as Express middleware) ────
const handleMulterError = (multerMiddleware) => (req, res, next) => {
    multerMiddleware(req, res, (err) => {
        if (!err) return next();
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: `File too large. Maximum size is ${MAX_SIZE_MB}MB.`,
                });
            }
            return res.status(400).json({ success: false, message: err.message });
        }
        // Custom fileFilter error
        return res.status(400).json({ success: false, message: err.message });
    });
};

// ── Helper: delete old avatar file ───────────────────────
const deleteOldAvatar = (userId) => {
    const exts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    for (const ext of exts) {
        const filePath = path.join(DIRS.avatars, `user_${userId}${ext}`);
        if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (_) {}
        }
    }
};

module.exports = {
    uploadAvatar: handleMulterError(uploadAvatar.single('avatar')),
    uploadPostImage: handleMulterError(uploadPostImage.single('image')),
    deleteOldAvatar,
    DIRS,
};
