const express = require('express');
const router = express.Router();
const topicController = require('../controllers/topic.controller');
const { protect } = require('../middleware/auth.middleware');
const {
  validateObjectId,
  validateTopic,
} = require('../middleware/validation.middleware');

// All topic routes require authentication
router.use(protect);

// Topic direct endpoints
router.get('/:id', validateObjectId('id'), topicController.getById);
router.put('/:id', validateObjectId('id'), validateTopic, topicController.update);
router.delete('/:id', validateObjectId('id'), topicController.delete);

module.exports = router;
