const authService = require('../services/auth.service');
const { setAuthCookie, clearAuthCookie } = require('../utils/token.utils');
const { sendSuccess } = require('../utils/response.utils');

/**
 * Register a new student account
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const { user, token } = await authService.registerUser({ name, email, password });

    // Establish authenticated session via HttpOnly cookie
    setAuthCookie(res, token);

    return sendSuccess(res, 201, 'Account created successfully', {
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log in to an existing account
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.loginUser({ email, password });

    // Establish authenticated session via HttpOnly cookie
    setAuthCookie(res, token);

    return sendSuccess(res, 200, 'Logged in successfully', {
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log out from current session
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    clearAuthCookie(res);
    return sendSuccess(res, 200, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get currently authenticated user profile
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    // req.user is populated by protect middleware
    return sendSuccess(res, 200, 'Profile retrieved successfully', {
      user: req.user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update authenticated user profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = req.user;
    const {
      name,
      college,
      department,
      degree,
      yearOfStudy,
      semester,
      bio,
      targetExam,
      preferredDifficulty,
      preferredMarksTier,
      dailyGoalMinutes,
      emailNotifications,
    } = req.body;

    if (name && name.trim().length >= 2) user.name = name.trim();
    if (college !== undefined) user.college = college.trim();
    if (department !== undefined) user.department = department.trim();
    if (degree !== undefined) user.degree = degree.trim();
    if (yearOfStudy !== undefined) user.yearOfStudy = yearOfStudy.trim();
    if (semester !== undefined) user.semester = semester.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (targetExam !== undefined) user.targetExam = targetExam.trim();
    if (preferredDifficulty && ['Easy', 'Medium', 'Hard', 'Mixed'].includes(preferredDifficulty)) {
      user.preferredDifficulty = preferredDifficulty;
    }
    if (preferredMarksTier && ['1m', '2m', '14m', 'mixed'].includes(preferredMarksTier)) {
      user.preferredMarksTier = preferredMarksTier;
    }
    if (dailyGoalMinutes !== undefined && !isNaN(Number(dailyGoalMinutes))) {
      user.dailyGoalMinutes = Math.max(10, Number(dailyGoalMinutes));
    }
    if (emailNotifications !== undefined) {
      user.emailNotifications = Boolean(emailNotifications);
    }

    await user.save();

    return sendSuccess(res, 200, 'Profile updated successfully', {
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change user password
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return sendError(res, 400, 'Current and new password are required');
    }

    if (newPassword.length < 8) {
      return sendError(res, 400, 'New password must be at least 8 characters long');
    }

    // Retrieve user with password hash selected
    const User = require('../models/User');
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return sendError(res, 400, 'Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    return sendSuccess(res, 200, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
};
