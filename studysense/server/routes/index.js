const express = require('express');
const router = express.Router();

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const dashboardRoutes = require('./dashboard.routes');
const subjectRoutes = require('./subject.routes');
const topicRoutes = require('./topic.routes');
const materialRoutes = require('./material.routes');
const questionRoutes = require('./question.routes');
const quizRoutes = require('./quiz.routes');
const quizAttemptRoutes = require('./quizAttempt.routes');
const mistakeRoutes = require('./mistake.routes');
const analyticsRoutes = require('./analytics.routes');
const quizGeneratorRoutes = require('./quizGenerator.routes');
const examPaperRoutes = require('./examPaper.routes');
const importantTopicsRoutes = require('./importantTopics.routes');

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/subjects', subjectRoutes);
router.use('/topics', topicRoutes);
router.use('/materials', materialRoutes);
router.use('/questions', questionRoutes);
router.use('/quizzes', quizRoutes);
router.use('/quiz-attempts', quizAttemptRoutes);
router.use('/mistakes', mistakeRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/quiz-generator', quizGeneratorRoutes);
router.use('/exam-papers', examPaperRoutes);
router.use('/important-topics', importantTopicsRoutes);

module.exports = router;


