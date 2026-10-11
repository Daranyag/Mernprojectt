const { verifyToken, COOKIE_NAME } = require('../utils/token.utils');
const { sendError } = require('../utils/response.utils');
const User = require('../models/User');

/**
 * Authentication middleware that verifies JWT from HttpOnly cookie or Authorization header
 */
const protect = async (req, res, next) => {
  let token = null;

  // 1. Check HttpOnly cookie (preferred secure browser mechanism)
  if (req.cookies && req.cookies[COOKIE_NAME]) {
    token = req.cookies[COOKIE_NAME];
  } 
  // 2. Fallback to Authorization: Bearer <token> header for REST clients / testing
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return sendError(res, 401, 'Authentication required. No token provided.');
  }

  try {
    const decoded = verifyToken(token);

    // Fetch user without password
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return sendError(res, 401, 'Account associated with this session no longer exists.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Session expired. Please log in again.');
    }
    return sendError(res, 401, 'Invalid authentication token.');
  }
};

module.exports = {
  protect,
};
