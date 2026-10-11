const subjectService = require('../services/subject.service');
const { sendSuccess } = require('../utils/response.utils');

/**
 * Controller for Subject endpoints
 */
class SubjectController {
  /**
   * POST /api/subjects
   */
  async create(req, res, next) {
    try {
      const subject = await subjectService.createSubject(req.user.id, req.body);
      return sendSuccess(res, 201, 'Subject created successfully', { subject });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/subjects
   */
  async getAll(req, res, next) {
    try {
      const subjects = await subjectService.getSubjects(req.user.id);
      return sendSuccess(res, 200, 'Subjects retrieved successfully', { subjects });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/subjects/:id
   */
  async getById(req, res, next) {
    try {
      const subject = await subjectService.getSubjectById(req.user.id, req.params.id);
      return sendSuccess(res, 200, 'Subject retrieved successfully', { subject });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/subjects/:id
   */
  async update(req, res, next) {
    try {
      const subject = await subjectService.updateSubject(req.user.id, req.params.id, req.body);
      return sendSuccess(res, 200, 'Subject updated successfully', { subject });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/subjects/:id
   */
  async delete(req, res, next) {
    try {
      const result = await subjectService.deleteSubject(req.user.id, req.params.id);
      return sendSuccess(res, 200, 'Subject and associated topics deleted successfully', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SubjectController();
