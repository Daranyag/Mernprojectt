const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'studysense_token';

/**
 * Generate a signed JWT token
 * @param {string} userId - Mongo user ID
 * @returns {string} - Signed JWT string
 */
const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in server environment');
  }

  return jwt.sign({ id: userId }, secret, {
    expiresIn: process.env.JWT_EXPIRE || '1d',
  });
};

/**
 * Verify JWT token
 * @param {string} token 
 * @returns {object} decoded payload
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;
  return jwt.verify(token, secret);
};

/**
 * Attach the JWT token inside an HttpOnly, secure cookie
 * @param {object} res - Express response object
 * @param {string} token - Signed JWT
 */
const setAuthCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieMaxAge = 24 * 60 * 60 * 1000; // 1 day in milliseconds

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true, // Prevents access from client-side JavaScript (XSS mitigation)
    secure: isProduction, // Sent only over HTTPS in production
    sameSite: isProduction ? 'strict' : 'lax', // CSRF protection for modern browsers
    path: '/',
    maxAge: cookieMaxAge,
  });
};

/**
 * Clear the authentication cookie upon logout
 * Must match path and domain flags of setAuthCookie
 * @param {object} res - Express response object
 */
const clearAuthCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie(COOKIE_NAME, '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
    expires: new Date(0), // Immediate expiration
  });
};

module.exports = {
  COOKIE_NAME,
  generateToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
};
