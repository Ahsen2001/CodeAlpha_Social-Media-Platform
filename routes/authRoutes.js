const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// Route: POST /api/auth/register
// Desc:  Register a new user
router.post('/register', [
    body('username').notEmpty().withMessage('Username is required').isLength({ min: 3 }).withMessage('Must be at least 3 characters'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be 6 or more characters')
], authController.register);

// Route: POST /api/auth/login
// Desc:  Authenticate user & get token
router.post('/login', [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required')
], authController.login);

// Route: GET /api/auth/me
// Desc:  Get current logged in user
// Access: Protected
router.get('/me', protect, authController.getMe);

module.exports = router;
