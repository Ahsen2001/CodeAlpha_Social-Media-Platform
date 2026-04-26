const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disabled to allow CDN resources (Bootstrap Icons, Google Fonts)
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files (profile pictures, post images)
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// API Routes
app.use('/api', routes);

// Fallback: serve index.html for unknown routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
