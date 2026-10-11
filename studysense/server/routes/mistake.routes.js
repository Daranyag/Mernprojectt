const express = require('express');
const router = express.Router();
const mistakeController = require('../controllers/mistake.controller');
const { protect } = require('../middleware/auth.middleware');
const {
  validateObjectId,
  validateMistakeUpdate,
  validatePracticeAnswer,
} = require('../middleware/validation.middleware');

router.use(protect);

// Specific routes first to prevent conflict with /:id
router.get('/practice/session', mistakeController.getPracticeSession);
router.get('/practice/history', mistakeController.getPracticeHistory);
router.post('/record', mistakeController.recordDirectMistakes);

// Core Mistake Book routes
router.get('/', mistakeController.getMistakes);
router.get('/:id', validateObjectId('id'), mistakeController.getMistakeById);
router.patch('/:id', validateObjectId('id'), validateMistakeUpdate, mistakeController.updateMistake);
router.patch('/:id/review', validateObjectId('id'), mistakeController.toggleMarkedForReview);
router.delete('/:id', validateObjectId('id'), mistakeController.deleteMistake);

// Practice question submission
router.post(
  '/:id/practice-result',
  validateObjectId('id'),
  validatePracticeAnswer,
  mistakeController.submitPracticeAnswer
);

module.exports = router;
