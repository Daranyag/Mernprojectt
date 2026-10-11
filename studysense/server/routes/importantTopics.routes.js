const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const importantTopicsController = require('../controllers/importantTopics.controller');

// Enforce authentication on all important-topics endpoints
router.use(protect);

router.post('/analyze', importantTopicsController.analyzeTopics);
router.get('/', importantTopicsController.getAnalyses);
router.get('/:id', importantTopicsController.getAnalysisById);
router.patch('/:id/topics/:topicId/status', importantTopicsController.updateRevisionStatus);
router.post('/:id/regenerate', importantTopicsController.regenerateAnalysis);
router.delete('/:id', importantTopicsController.deleteAnalysis);

module.exports = router;
