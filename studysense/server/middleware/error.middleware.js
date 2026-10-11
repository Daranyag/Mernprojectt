const { sendError } = require('../utils/response.utils');

/**
 * 404 Route Not Found middleware
 */
const notFoundHandler = (req, res, next) => {
  return sendError(res, 404, `Endpoint not found: ${req.method} ${req.originalUrl}`);
};

/**
 * Centralized error handler
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // Log error in development/test
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Error] ${req.method} ${req.originalUrl} - ${err.name}: ${err.message}`);
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const keys = Object.keys(err.keyValue || {});
    if (keys.includes('name')) {
      message = `A subject with the name "${err.keyValue.name}" already exists in your account.`;
    } else if (keys.includes('email')) {
      message = 'An account with this email address already exists. Please log in.';
    } else {
      const field = keys[0] || 'field';
      message = `A record with this ${field} already exists. Please use a unique value.`;
    }
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = {};
    Object.values(err.errors).forEach((val) => {
      errors[val.path] = val.message;
    });
  }

  // Handle invalid Mongoose ObjectId
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Resource not found with specified identifier: ${err.value}`;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication session expired. Please log in again.';
  }

  return sendError(res, statusCode, message, errors);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
