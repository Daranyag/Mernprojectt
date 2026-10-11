const mistakeService = require('../services/mistake.service');
const { sendSuccess, sendError } = require('../utils/response.utils');

class MistakeController {
  async recordDirectMistakes(req, res) {
    try {
      const records = await mistakeService.recordDirectMistakes(req.user._id, req.body);
      return sendSuccess(res, 201, 'Mistakes recorded successfully', records);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  async getMistakes(req, res) {
    try {
      const mistakes = await mistakeService.getMistakes(req.user._id, req.query);
      return sendSuccess(res, 200, 'Mistakes retrieved successfully', mistakes);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  async getMistakeById(req, res) {
    try {
      const mistake = await mistakeService.getMistakeById(req.user._id, req.params.id);
      return sendSuccess(res, 200, 'Mistake retrieved successfully', mistake);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  async updateMistake(req, res) {
    try {
      const mistake = await mistakeService.updateMistake(req.user._id, req.params.id, req.body);
      return sendSuccess(res, 200, 'Mistake updated successfully', mistake);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  async toggleMarkedForReview(req, res) {
    try {
      const mistake = await mistakeService.toggleMarkedForReview(req.user._id, req.params.id);
      return sendSuccess(res, 200, 'Mistake review status updated', mistake);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  async deleteMistake(req, res) {
    try {
      const result = await mistakeService.deleteMistake(req.user._id, req.params.id);
      return sendSuccess(res, 200, 'Mistake deleted successfully', result);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  async getPracticeSession(req, res) {
    try {
      const session = await mistakeService.getPracticeSession(req.user._id, req.query);
      return sendSuccess(res, 200, 'Practice session questions prepared', session);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  async submitPracticeAnswer(req, res) {
    try {
      const result = await mistakeService.submitPracticeAnswer(req.user._id, req.params.id, req.body);
      return sendSuccess(res, 200, 'Practice answer evaluated successfully', result);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  async getPracticeHistory(req, res) {
    try {
      const history = await mistakeService.getPracticeHistory(req.user._id);
      return sendSuccess(res, 200, 'Practice history retrieved successfully', history);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }
}

module.exports = new MistakeController();
