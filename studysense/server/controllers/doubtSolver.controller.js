const doubtSolverService = require('../services/doubtSolver.service');
const { sendSuccess, sendError } = require('../utils/response.utils');

class DoubtSolverController {
  /**
   * POST /api/doubt-solver/explain
   * 1-tap conceptual breakdown for a quiz question or mistake
   */
  async explainConcept(req, res, next) {
    try {
      const breakdown = await doubtSolverService.explainConcept(req.user.id, req.body);
      return sendSuccess(res, 200, 'Conceptual breakdown generated successfully', { breakdown });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/doubt-solver/ask
   * Context-aware student Q&A referencing active subject, syllabus, and notes
   */
  async askDoubt(req, res, next) {
    try {
      const result = await doubtSolverService.solveDoubt(req.user.id, req.body);
      return sendSuccess(res, 200, 'Doubt response generated successfully', { result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/doubt-solver/context
   * Returns student's active subject, topics, and relevant notes
   */
  async getContext(req, res, next) {
    try {
      const { subjectId, topicId, unit } = req.query;
      const context = await doubtSolverService.getStudentAcademicContext(req.user.id, subjectId, topicId, unit);
      return sendSuccess(res, 200, 'Academic context retrieved successfully', { context });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DoubtSolverController();
