const express = require('express');
const router = express.Router();
const doubtSolverController = require('../controllers/doubtSolver.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.post('/explain', doubtSolverController.explainConcept);
router.post('/ask', doubtSolverController.askDoubt);
router.get('/context', doubtSolverController.getContext);

module.exports = router;
