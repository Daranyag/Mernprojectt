const dashboardService = require('../services/dashboard.service');
const { sendSuccess } = require('../utils/response.utils');

/**
 * Controller for student dashboard operations
 * Module 2: Main Dashboard
 */
class DashboardController {
  /**
   * GET /api/dashboard/summary
   * Fetches the dashboard summary and metrics for the verified authenticated student
   */
  async getSummary(req, res, next) {
    try {
      // req.user is guaranteed and verified by the protect middleware
      const userId = req.user.id || req.user._id;
      const data = await dashboardService.getDashboardSummary(userId);

      return sendSuccess(res, 200, 'Dashboard summary retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
