const topicService = require('../services/topic.service');
const { sendSuccess } = require('../utils/response.utils');

/**
 * Controller for Topic operations
 */
class TopicController {
  /**
   * POST /api/subjects/:subjectId/topics
   */
  async createForSubject(req, res, next) {
    try {
      const topic = await topicService.createTopic(req.user.id, req.params.subjectId, req.body);
      return sendSuccess(res, 201, 'Topic created successfully', { topic });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/subjects/:subjectId/topics/bulk
   */
  async createBulkForSubject(req, res, next) {
    try {
      const result = await topicService.bulkCreateTopics(req.user.id, req.params.subjectId, req.body);
      return sendSuccess(res, 201, `Successfully added ${result.count} topics`, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/subjects/:subjectId/topics/extract
   */
  async extractFromSyllabus(req, res, next) {
    try {
      const { text, subjectName } = req.body;
      const topics = await topicService.extractTopicsFromSyllabus(text, subjectName);
      return sendSuccess(res, 200, `Extracted ${topics.length} topic candidates`, { topics });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/subjects/:subjectId/topics
   */
  async getBySubject(req, res, next) {
    try {
      const topics = await topicService.getTopicsBySubject(req.user.id, req.params.subjectId);
      return sendSuccess(res, 200, 'Topics retrieved successfully', { topics });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/topics/:id
   */
  async getById(req, res, next) {
    try {
      const topic = await topicService.getTopicById(req.user.id, req.params.id);
      return sendSuccess(res, 200, 'Topic retrieved successfully', { topic });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/topics/:id
   */
  async update(req, res, next) {
    try {
      const topic = await topicService.updateTopic(req.user.id, req.params.id, req.body);
      return sendSuccess(res, 200, 'Topic updated successfully', { topic });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/topics/:id
   */
  async delete(req, res, next) {
    try {
      const result = await topicService.deleteTopic(req.user.id, req.params.id);
      return sendSuccess(res, 200, 'Topic deleted successfully', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TopicController();
