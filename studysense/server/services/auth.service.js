const User = require('../models/User');
const { generateToken } = require('../utils/token.utils');

/**
 * Register a new user
 * @param {object} userData - { name, email, password }
 * @returns {object} { user, token }
 */
const registerUser = async ({ name, email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // Check if email already in use
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error('An account with this email address already exists. Please log in.');
    error.statusCode = 409;
    throw error;
  }

  // Create new user (password will be hashed in Mongoose pre-save hook)
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
  });

  const token = generateToken(user._id);

  return {
    user: user.toSafeObject(),
    token,
  };
};

/**
 * Authenticate user credentials
 * @param {object} credentials - { email, password }
 * @returns {object} { user, token }
 */
const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // Find user and explicitly include password field for verification
  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordMatch = await user.matchPassword(password);
  if (!isPasswordMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user._id);

  return {
    user: user.toSafeObject(),
    token,
  };
};

/**
 * Retrieve user by ID
 * @param {string} userId 
 * @returns {object} safe user object
 */
const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User account not found');
    error.statusCode = 404;
    throw error;
  }
  return user.toSafeObject();
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
};
