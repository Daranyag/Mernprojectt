const analyticsService = require('../services/analytics.service');
const { sendSuccess, sendError } = require('../utils/response.utils');

class AnalyticsController {
  async getOverview(req, res) {
    try {
      const overview = await analyticsService.getOverview(req.user._id);
      return sendSuccess(res, 200, 'Performance overview retrieved successfully', overview);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  async getSubjectPerformance(req, res) {
    try {
      const subjects = await analyticsService.getSubjectPerformance(req.user._id);
      return sendSuccess(res, 200, 'Subject performance retrieved successfully', subjects);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  async getTopicPerformance(req, res) {
    try {
      const topics = await analyticsService.getTopicPerformance(req.user._id);
      return sendSuccess(res, 200, 'Topic performance retrieved successfully', topics);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  async getTrends(req, res) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 15;
      const trends = await analyticsService.getTrends(req.user._id, limit);
      return sendSuccess(res, 200, 'Performance trends retrieved successfully', trends);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  async getRecommendations(req, res) {
    try {
      const recommendations = await analyticsService.getRecommendations(req.user._id);
      return sendSuccess(res, 200, 'Smart recommendations retrieved successfully', recommendations);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }
}

module.exports = new AnalyticsController();
