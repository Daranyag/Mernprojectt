const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');
const { protect } = require('../middleware/auth.middleware');
const { validateObjectId } = require('../middleware/validation.middleware');

router.use(protect);

router.get('/', quizController.getAttempts);
router.get('/:id', validateObjectId('id'), quizController.getAttemptById);

module.exports = router;
