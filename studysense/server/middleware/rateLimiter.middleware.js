const rateLimit = require('express-rate-limit');
const { sendError } = require('../utils/response.utils');

/**
 * Rate limiter for sensitive authentication endpoints (login, register)
 * Prevents brute-force credential stuffing and DoS attacks
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: process.env.NODE_ENV === 'test' ? 1000 : 25, // 25 attempts per window for normal use, higher for testing
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    return sendError(
      res,
      429,
      'Too many authentication attempts from this IP. Please try again after 15 minutes.'
    );
  },
  skip: () => process.env.NODE_ENV === 'test', // Skip rate limiting during automated test suite runs
});

module.exports = {
  authRateLimiter,
};
