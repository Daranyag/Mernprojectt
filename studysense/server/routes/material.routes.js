const express = require('express');
const router = express.Router();
const multer = require('multer');
const materialController = require('../controllers/material.controller');
const { protect } = require('../middleware/auth.middleware');
const {
  validateObjectId,
  validateMaterial,
} = require('../middleware/validation.middleware');

// In-memory multer storage for PDF document uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB max file size
  },
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (ext === 'pdf' || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .pdf documents are supported.'), false);
    }
  },
});

// All study material routes require authentication
router.use(protect);

// Material CRUD
router.post('/', validateMaterial, materialController.create);
router.post('/upload-pdf', upload.single('file'), materialController.uploadPdf);
router.get('/', materialController.getAll);
router.get('/:id', validateObjectId('id'), materialController.getById);
router.put('/:id', validateObjectId('id'), validateMaterial, materialController.update);
router.delete('/:id', validateObjectId('id'), materialController.delete);

// Status toggles
router.patch('/:id/favorite', validateObjectId('id'), materialController.toggleFavorite);
router.patch('/:id/reviewed', validateObjectId('id'), materialController.toggleReviewed);

// AI Notes Generation
router.post('/generate-notes', materialController.generateNotes);

module.exports = router;

