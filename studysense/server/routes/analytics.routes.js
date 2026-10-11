const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/overview', analyticsController.getOverview);
router.get('/subjects', analyticsController.getSubjectPerformance);
router.get('/topics', analyticsController.getTopicPerformance);
router.get('/trends', analyticsController.getTrends);
router.get('/recommendations', analyticsController.getRecommendations);

module.exports = router;
