const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subject.controller');
const topicController = require('../controllers/topic.controller');
const { protect } = require('../middleware/auth.middleware');
const {
  validateObjectId,
  validateSubject,
  validateTopic,
} = require('../middleware/validation.middleware');

// All subject routes require authentication
router.use(protect);

// Subject CRUD
router.post('/', validateSubject, subjectController.create);
router.get('/', subjectController.getAll);
router.get('/:id', validateObjectId('id'), subjectController.getById);
router.put('/:id', validateObjectId('id'), validateSubject, subjectController.update);
router.delete('/:id', validateObjectId('id'), subjectController.delete);

// Nested topic routes on subject
router.post(
  '/:subjectId/topics',
  validateObjectId('subjectId'),
  validateTopic,
  topicController.createForSubject
);
router.post(
  '/:subjectId/topics/bulk',
  validateObjectId('subjectId'),
  topicController.createBulkForSubject
);
router.post(
  '/:subjectId/topics/extract',
  validateObjectId('subjectId'),
  topicController.extractFromSyllabus
);
router.get(
  '/:subjectId/topics',
  validateObjectId('subjectId'),
  topicController.getBySubject
);

module.exports = router;
