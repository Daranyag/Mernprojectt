const materialService = require('../services/material.service');
const { sendSuccess } = require('../utils/response.utils');

/**
 * Controller for Study Materials operations
 */
class MaterialController {
  /**
   * POST /api/materials
   */
  async create(req, res, next) {
    try {
      const material = await materialService.createMaterial(req.user.id, req.body);
      return sendSuccess(res, 201, 'Study material created successfully', { material });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/materials/upload-pdf
   * Upload and parse a PDF study material
   */
  async uploadPdf(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Please select a PDF file to upload.' });
      }

      const { subject, topic, customTopic, unit, title, tags, isFavorite } = req.body;
      if (!subject) {
        return res.status(400).json({ success: false, message: 'Subject reference is required.' });
      }

      const { extractTextFromPdf, normalizeText } = require('../services/sourceIngestion.service');
      const pdfResult = await extractTextFromPdf(req.file.buffer);
      const cleanContent = normalizeText(pdfResult.text || '');

      const originalName = req.file.originalname || 'uploaded_document.pdf';
      const cleanTitle = (title && title.trim()) || originalName.replace(/\.pdf$/i, '');

      let parsedTags = [];
      if (tags) {
        if (Array.isArray(tags)) parsedTags = tags;
        else if (typeof tags === 'string') {
          parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
        }
      }

      const material = await materialService.createMaterial(req.user.id, {
        type: 'pdf',
        title: cleanTitle,
        subject,
        topic: topic || null,
        customTopic: customTopic || '',
        unit: unit || '',
        content: cleanContent.slice(0, 20000), // First 20,000 chars for study and notes
        fileName: originalName,
        fileSize: req.file.size || req.file.buffer?.length || 0,
        pageCount: pdfResult.pages || 1,
        tags: parsedTags,
        isFavorite: isFavorite === 'true' || isFavorite === true,
      });

      return sendSuccess(res, 201, 'PDF material uploaded and processed successfully', { material });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/materials
   */
  async getAll(req, res, next) {
    try {
      const result = await materialService.getMaterials(req.user.id, req.query);
      return sendSuccess(res, 200, 'Study materials retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/materials/:id
   */
  async getById(req, res, next) {
    try {
      const material = await materialService.getMaterialById(req.user.id, req.params.id);
      return sendSuccess(res, 200, 'Study material retrieved successfully', { material });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/materials/:id
   */
  async update(req, res, next) {
    try {
      const material = await materialService.updateMaterial(req.user.id, req.params.id, req.body);
      return sendSuccess(res, 200, 'Study material updated successfully', { material });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/materials/:id
   */
  async delete(req, res, next) {
    try {
      const result = await materialService.deleteMaterial(req.user.id, req.params.id);
      return sendSuccess(res, 200, 'Study material deleted successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/materials/:id/favorite
   */
  async toggleFavorite(req, res, next) {
    try {
      const result = await materialService.toggleFavorite(req.user.id, req.params.id);
      return sendSuccess(res, 200, 'Favorite status updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/materials/:id/reviewed
   */
  async toggleReviewed(req, res, next) {
    try {
      const result = await materialService.toggleReviewed(req.user.id, req.params.id);
      return sendSuccess(res, 200, 'Reviewed status updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/materials/generate-notes
   */
  async generateNotes(req, res, next) {

    try {
      const {
        subjectId,
        unit = '',
        topicIds = [],
        noteStyle = 'Quick Revision Notes',
        sourceScope = 'general_knowledge',
        materialIds = [],
        customInstructions = '',
        autoSave = false
      } = req.body;

      if (!subjectId) {
        return res.status(400).json({ success: false, message: 'Subject ID is required' });
      }

      const Subject = require('../models/Subject');
      const { Topic } = require('../models/Topic');
      const { StudyMaterial } = require('../models/StudyMaterial');
      const { generateNotesWithAI } = require('../services/notesGenerator.service');

      const subject = await Subject.findOne({ _id: subjectId, user: req.user.id });
      if (!subject) {
        return res.status(404).json({ success: false, message: 'Subject not found or unauthorized' });
      }

      // Resolve topics: selected topic, or existing subject topics, or auto curriculum
      let topicNames = [];
      if (Array.isArray(topicIds) && topicIds.length > 0) {
        const topics = await Topic.find({ _id: { $in: topicIds }, subject: subjectId, user: req.user.id });
        topicNames = topics.map((t) => t.title || t.name).filter(Boolean);
      }
      if (topicNames.length === 0) {
        const existingTopics = await Topic.find({ subject: subjectId, user: req.user.id });
        topicNames = existingTopics.map((t) => t.title || t.name).filter(Boolean);
      }
      if (topicNames.length === 0) {
        const topicService = require('../services/topic.service');
        const std = topicService.getStandardSubjectTopics(subject.name);
        topicNames = std.map((t) => t.title).slice(0, 10);
      }

      let extractedMaterials = [];
      let effectiveSourceScope = sourceScope;
      let fallbackNotice = null;

      if (Array.isArray(materialIds) && materialIds.length > 0) {
        const mats = await StudyMaterial.find({ _id: { $in: materialIds }, user: req.user.id });
        extractedMaterials = mats.map((m) => ({
          title: m.title,
          text: m.content || ''
        }));
      }

      // Check for any subject materials if none passed
      if (extractedMaterials.length === 0) {
        const anyMats = await StudyMaterial.find({ subject: subject._id, user: req.user.id });
        if (anyMats.length > 0) {
          extractedMaterials = anyMats.map((m) => ({
            title: m.title,
            text: m.content || ''
          }));
        }
      }

      if (extractedMaterials.length === 0 && (sourceScope === 'material_only' || sourceScope === 'combined')) {
        effectiveSourceScope = 'general_knowledge';
        fallbackNotice = `No uploaded study materials found for "${subject.name}". Generated comprehensive revision notes directly from university curriculum.`;
      }

      const generated = await generateNotesWithAI({
        subjectName: subject.name,
        unitName: unit,
        topicNames,
        noteStyle,
        sourceScope: effectiveSourceScope,
        extractedMaterials,
        customInstructions
      });

      let savedMaterial = null;
      if (autoSave) {
        savedMaterial = await materialService.createMaterial(req.user.id, {
          type: 'note',
          title: generated.title,
          subject: subject._id,
          topic: topicIds.length === 1 ? topicIds[0] : null,
          unit: unit || '',
          content: generated.content,
          tags: ['AI-Notes', noteStyle]
        });
      }

      return sendSuccess(res, 200, 'Notes generated successfully', {
        notes: generated,
        savedMaterial
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MaterialController();

