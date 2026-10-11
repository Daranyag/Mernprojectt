const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth.middleware');
const quizGeneratorController = require('../controllers/quizGenerator.controller');

// Memory storage for multer so buffers can be parsed safely in-memory without persistent scratch disk exposure
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024 // 20 MB max file size
  },
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (ext === 'pdf' || ext === 'pptx') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .pdf and .pptx files are allowed.'), false);
    }
  }
});

// Protect all quiz-generator routes
router.use(protect);

// Source ingestion endpoints
router.post('/sources/text', quizGeneratorController.ingestTextSource);
router.post('/sources/upload', upload.single('file'), quizGeneratorController.ingestFileUpload);
router.post('/sources/url', quizGeneratorController.ingestUrlSource);
router.get('/sources', quizGeneratorController.getSources);
router.delete('/sources/:id', quizGeneratorController.deleteSource);

// Quiz generation and saving
router.post('/generate', quizGeneratorController.generateQuiz);
router.post('/save', quizGeneratorController.saveGeneratedQuestions);

module.exports = router;
