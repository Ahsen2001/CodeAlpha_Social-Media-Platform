const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const userModel = require('../models/userModel');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    });
};

const authController = {
    async register(req, res, next) {
        try {
            // Check validation errors
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { username, email, password } = req.body;

            // Check if user exists
            const existingEmail = await userModel.findUserByEmail(email);
            if (existingEmail) {
                return res.status(400).json({ success: false, message: 'Email already in use' });
            }

            const existingUsername = await userModel.findUserByUsername(username);
            if (existingUsername) {
                return res.status(400).json({ success: false, message: 'Username already taken' });
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create user
            const result = await userModel.createUser(username, email, hashedPassword);

            if (result && result.insertId) {
                const token = generateToken(result.insertId);
                res.status(201).json({
                    success: true,
                    token,
                    user: {
                        id: result.insertId,
                        username,
                        email
                    }
                });
            } else {
                res.status(500).json({ success: false, message: 'Failed to register user' });
            }
        } catch (error) {
            next(error);
        }
    },

    async login(req, res, next) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { email, password } = req.body;

            // Find user
            const user = await userModel.findUserByEmail(email);
            if (!user) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            // Check password
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            // Generate Token
            const token = generateToken(user.id);

            res.status(200).json({
                success: true,
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                }
            });
        } catch (error) {
            next(error);
        }
    },

    async getMe(req, res, next) {
        try {
            // req.user.id comes from authMiddleware
            const user = await userModel.findUserById(req.user.id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            res.status(200).json({
                success: true,
                user
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = authController;
