const questionService = require('../services/question.service');
const { sendSuccess, sendError } = require('../utils/response.utils');

class QuestionController {
  async createQuestion(req, res) {
    try {
      const question = await questionService.createQuestion(req.user._id, req.body);
      return sendSuccess(res, 201, 'Question created successfully in Question Bank', question);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  async getQuestions(req, res) {
    try {
      const questions = await questionService.getQuestions(req.user._id, req.query);
      return sendSuccess(res, 200, 'Questions retrieved successfully', questions);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  async getQuestionById(req, res) {
    try {
      const question = await questionService.getQuestionById(req.user._id, req.params.id);
      return sendSuccess(res, 200, 'Question retrieved successfully', question);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  async updateQuestion(req, res) {
    try {
      const question = await questionService.updateQuestion(req.user._id, req.params.id, req.body);
      return sendSuccess(res, 200, 'Question updated successfully', question);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  async deleteQuestion(req, res) {
    try {
      const result = await questionService.deleteQuestion(req.user._id, req.params.id);
      return sendSuccess(res, 200, 'Question deleted successfully', result);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }
}

module.exports = new QuestionController();
