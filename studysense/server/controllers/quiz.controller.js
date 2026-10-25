const quizService = require('../services/quiz.service');
const { sendSuccess, sendError } = require('../utils/response.utils');

class QuizController {
  async createQuiz(req, res) {
    try {
      const quiz = await quizService.createQuiz(req.user._id, req.body);
      return sendSuccess(res, 201, 'Quiz created successfully', quiz);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  async getQuizzes(req, res) {
    try {
      const quizzes = await quizService.getQuizzes(req.user._id, req.query);
      return sendSuccess(res, 200, 'Quizzes retrieved successfully', quizzes);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  async getQuizById(req, res) {
    try {
      const quiz = await quizService.getQuizById(req.user._id, req.params.id);
      return sendSuccess(res, 200, 'Quiz retrieved successfully', quiz);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  async getQuizForTaking(req, res) {
    try {
      const quiz = await quizService.getQuizForTaking(req.user._id, req.params.id);
      return sendSuccess(res, 200, 'Quiz loaded for test session', quiz);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  async updateQuiz(req, res) {
    try {
      const quiz = await quizService.updateQuiz(req.user._id, req.params.id, req.body);
      return sendSuccess(res, 200, 'Quiz updated successfully', quiz);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  async deleteQuiz(req, res) {
    try {
      const result = await quizService.deleteQuiz(req.user._id, req.params.id);
      return sendSuccess(res, 200, 'Quiz deleted successfully', result);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  async submitQuiz(req, res) {
    try {
      const attempt = await quizService.submitQuiz(req.user._id, req.params.id, req.body);
      return sendSuccess(res, 201, 'Quiz submitted and evaluated successfully', attempt);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  async getAttempts(req, res) {
    try {
      const attempts = await quizService.getAttempts(req.user._id, req.query);
      return sendSuccess(res, 200, 'Quiz attempts retrieved successfully', attempts);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  async getAttemptById(req, res) {
    try {
      const attempt = await quizService.getAttemptById(req.user._id, req.params.id);
      return sendSuccess(res, 200, 'Quiz attempt retrieved successfully', attempt);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }

  async recordDirectAttempt(req, res) {
    try {
      const attempt = await quizService.recordDirectAttempt(req.user._id, req.body);
      return sendSuccess(res, 201, 'Quiz attempt recorded successfully', attempt);
    } catch (error) {
      return sendError(res, error.statusCode || 500, error.message);
    }
  }
}

module.exports = new QuizController();
