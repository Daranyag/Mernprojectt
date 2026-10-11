const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const examPaperController = require('../controllers/examPaper.controller');

// Enforce authentication on all exam paper endpoints
router.use(protect);

router.get('/', examPaperController.getExamPapers);
router.get('/:id', examPaperController.getExamPaperById);
router.post('/generate', examPaperController.generateExamPaper);
router.put('/:id', examPaperController.updateExamPaper);
router.post('/:id/finalize', examPaperController.finalizeExamPaper);
router.post('/:id/duplicate', examPaperController.duplicateExamPaper);
router.post('/:id/regenerate-question', examPaperController.regenerateQuestion);
router.delete('/:id', examPaperController.deleteExamPaper);

module.exports = router;
