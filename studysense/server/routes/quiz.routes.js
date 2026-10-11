const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz.controller');
const { protect } = require('../middleware/auth.middleware');
const { validateQuiz, validateQuizSubmission, validateObjectId } = require('../middleware/validation.middleware');

router.use(protect);

// Quiz management
router.get('/', quizController.getQuizzes);
router.post('/', validateQuiz, quizController.createQuiz);
router.get('/:id', validateObjectId('id'), quizController.getQuizById);
router.get('/:id/take', validateObjectId('id'), quizController.getQuizForTaking);
router.put('/:id', validateObjectId('id'), validateQuiz, quizController.updateQuiz);
router.delete('/:id', validateObjectId('id'), quizController.deleteQuiz);
router.post('/:id/submit', validateObjectId('id'), validateQuizSubmission, quizController.submitQuiz);

module.exports = router;
