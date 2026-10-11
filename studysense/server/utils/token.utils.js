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

  // When frontend and backend are hosted on different domains in production (e.g., Vercel and Render),
  // sameSite must be 'none' and secure must be true for cross-site cookie transmission.
  const sameSite = isProduction ? (process.env.COOKIE_SAME_SITE || 'none') : 'lax';

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true, // Prevents access from client-side JavaScript (XSS mitigation)
    secure: isProduction, // Sent only over HTTPS in production
    sameSite: sameSite,
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
  const sameSite = isProduction ? (process.env.COOKIE_SAME_SITE || 'none') : 'lax';

  res.cookie(COOKIE_NAME, '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: sameSite,
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
