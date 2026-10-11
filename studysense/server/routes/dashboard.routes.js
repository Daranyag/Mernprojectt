const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { protect } = require('../middleware/auth.middleware');

/**
 * Dashboard Routes
 * Base prefix: /api/dashboard
 */

// All dashboard endpoints require valid authentication
router.use(protect);

// GET /api/dashboard/summary
router.get('/summary', dashboardController.getSummary);

module.exports = router;
