const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');

const app = express();

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration for trusted frontend origins (supports single origin or comma-separated origins)
const getAllowedOrigins = () => {
  const configured = process.env.CLIENT_URL || 'http://localhost:5173';
  return configured.split(',').map((url) => url.trim().replace(/\/$/, '')).filter(Boolean);
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      const allowedOrigins = getAllowedOrigins();
      const isAllowed = allowedOrigins.some((allowed) => {
        if (allowed === '*') return true;
        return origin === allowed || origin.replace(/\/$/, '') === allowed;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`[CORS Blocked] Origin not allowed: ${origin}. Allowed origins:`, allowedOrigins);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true, // Allow cookies to be sent across origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Request body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// Cookie parsing
app.use(cookieParser(process.env.COOKIE_SECRET));

// Development request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Mount centralized API routes
app.use('/api', apiRoutes);

// Catch 404 Not Found
app.use(notFoundHandler);

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
