const express = require('express');
const router = express.Router();
const questionController = require('../controllers/question.controller');
const { protect } = require('../middleware/auth.middleware');
const { validateQuestion, validateObjectId } = require('../middleware/validation.middleware');

router.use(protect);

router.get('/', questionController.getQuestions);
router.post('/', validateQuestion, questionController.createQuestion);
router.get('/:id', validateObjectId('id'), questionController.getQuestionById);
router.put('/:id', validateObjectId('id'), validateQuestion, questionController.updateQuestion);
router.delete('/:id', validateObjectId('id'), questionController.deleteQuestion);

module.exports = router;
