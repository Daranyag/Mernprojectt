const { ExamPaper } = require('../models/ExamPaper');
const Subject = require('../models/Subject');
const { Topic } = require('../models/Topic');
const { QuizSource } = require('../models/QuizSource');
const StudyMaterial = require('../models/StudyMaterial');
const { calculatePaperMarks, generateExamPaperWithAI } = require('../services/examPaper.service');
const { getApiKey, getModelName } = require('../services/quizGenerator.service');

const examPaperController = {
  /**
   * List saved exam papers for authenticated user.
   * GET /api/exam-papers
   */
  getExamPapers: async (req, res) => {
    try {
      const { subjectId, status } = req.query;
      const filter = { user: req.user._id };
      if (subjectId) filter.subject = subjectId;
      if (status) filter.status = status;

      const papers = await ExamPaper.find(filter)
        .populate('subject', 'name color')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        data: papers
      });
    } catch (err) {
      console.error('[ExamPaper] Get papers error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Get single saved exam paper.
   * GET /api/exam-papers/:id
   */
  getExamPaperById: async (req, res) => {
    try {
      const paper = await ExamPaper.findOne({
        _id: req.params.id,
        user: req.user._id
      }).populate('subject', 'name color');

      if (!paper) {
        return res.status(404).json({ success: false, message: 'Exam paper not found.' });
      }

      return res.status(200).json({
        success: true,
        data: paper
      });
    } catch (err) {
      console.error('[ExamPaper] Get paper by id error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Generate an examination paper.
   * POST /api/exam-papers/generate
   */
  generateExamPaper: async (req, res) => {
    try {
      const {
        subjectId,
        title,
        institutionName,
        courseCode,
        examDuration = '3 Hours',
        sourceScope = 'material_only', // 'material_only', 'general_knowledge', 'combined'
        sourceIds = [],
        topicIds = [],
        difficulty = 'Medium',
        sections = [],
        hasAnswerKey = true,
        hasMarkingScheme = true
      } = req.body;

      if (!subjectId) {
        return res.status(400).json({ success: false, message: 'Subject reference is required.' });
      }

      const subject = await Subject.findOne({ _id: subjectId, user: req.user._id });
      if (!subject) {
        return res.status(404).json({ success: false, message: 'Subject not found.' });
      }

      if (!Array.isArray(sections) || sections.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one examination section (Part A, Part B, etc.) is required.'
        });
      }

      // Calculate blueprint marks
      const marksBlueprint = calculatePaperMarks(sections);

      // Resolve topic names: use provided topicIds, or existing subject topics, or auto-extract standard topics
      let topicNames = [];
      if (Array.isArray(topicIds) && topicIds.length > 0) {
        const topics = await Topic.find({ _id: { $in: topicIds }, subject: subject._id });
        topicNames = topics.map((t) => t.title || t.name).filter(Boolean);
      }
      if (topicNames.length === 0) {
        const existingTopics = await Topic.find({ subject: subject._id });
        topicNames = existingTopics.map((t) => t.title || t.name).filter(Boolean);
      }
      if (topicNames.length === 0) {
        const topicService = require('../services/topic.service');
        const stdTopics = topicService.getStandardSubjectTopics(subject.name);
        topicNames = stdTopics.map((t) => t.title).slice(0, 15);
      }

      // Gather source materials
      let extractedMaterials = [];
      let effectiveSourceScope = sourceScope;
      let fallbackNotice = null;

      if (sourceScope === 'material_only' || sourceScope === 'combined') {
        if (Array.isArray(sourceIds) && sourceIds.length > 0) {
          const sources = await QuizSource.find({
            _id: { $in: sourceIds },
            user: req.user._id
          });
          extractedMaterials.push(
            ...sources.map((s) => ({
              id: s._id,
              title: s.title,
              text: s.extractedText
            }))
          );

          // Also check StudyMaterials
          const materials = await StudyMaterial.find({
            _id: { $in: sourceIds },
            user: req.user._id
          });
          extractedMaterials.push(
            ...materials.map((m) => ({
              id: m._id,
              title: m.title,
              text: m.content || ''
            }))
          );
        }

        // If no materials were specifically passed, check if user uploaded ANY materials for this subject
        if (extractedMaterials.length === 0) {
          const anyMaterials = await StudyMaterial.find({
            subject: subject._id,
            user: req.user._id
          });
          if (anyMaterials.length > 0) {
            extractedMaterials.push(
              ...anyMaterials.map((m) => ({
                id: m._id,
                title: m.title,
                text: m.content || ''
              }))
            );
          }
          const anySources = await QuizSource.find({
            subject: subject._id,
            user: req.user._id
          });
          if (anySources.length > 0) {
            extractedMaterials.push(
              ...anySources.map((s) => ({
                id: s._id,
                title: s.title,
                text: s.extractedText
              }))
            );
          }
        }

        // If STILL no materials found and user selected material_only:
        // Gracefully fallback to general curriculum so generation NEVER fails!
        if (extractedMaterials.length === 0) {
          effectiveSourceScope = 'general_knowledge';
          fallbackNotice = `No uploaded study materials found for "${subject.name}". Generated questions automatically from general university curriculum and key exam topics.`;
        }
      }

      // Resolve includeAnswerKey & includeMarkingScheme parameters
      const includeAnswerKey =
        req.body.includeAnswerKey !== undefined
          ? Boolean(req.body.includeAnswerKey)
          : req.body.hasAnswerKey !== undefined
          ? Boolean(req.body.hasAnswerKey)
          : true;

      const includeMarkingScheme =
        req.body.includeMarkingScheme !== undefined
          ? Boolean(req.body.includeMarkingScheme)
          : req.body.hasMarkingScheme !== undefined
          ? Boolean(req.body.hasMarkingScheme)
          : true;

      // Call AI generation service
      const generatedSections = await generateExamPaperWithAI({
        subjectName: subject.name,
        topicNames,
        sourceScope: effectiveSourceScope,
        extractedMaterials,
        difficulty,
        sections: marksBlueprint.sections,
        includeAnswerKey,
        includeMarkingScheme
      });

      // Construct ExamPaper draft document
      const paperDoc = new ExamPaper({
        user: req.user._id,
        subject: subject._id,
        title: title?.trim() || `${subject.name} - University Examination Paper`,
        institutionName: institutionName?.trim() || '',
        courseCode: courseCode?.trim() || '',
        examDuration,
        sourceScope: effectiveSourceScope,
        sourceReferences: sourceIds,
        selectedTopics: topicIds,
        difficulty,
        sections: generatedSections,
        hasAnswerKey: includeAnswerKey,
        hasMarkingScheme: includeMarkingScheme,
        status: 'draft'
      });

      paperDoc.recalculateMarks();
      await paperDoc.save();

      return res.status(201).json({
        success: true,
        message: fallbackNotice || 'Examination paper generated successfully.',
        fallbackNotice,
        data: paperDoc
      });
    } catch (err) {
      console.error('[ExamPaper] Generate paper error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Save or update an exam paper draft.
   * PUT /api/exam-papers/:id
   */
  updateExamPaper: async (req, res) => {
    try {
      const paper = await ExamPaper.findOne({
        _id: req.params.id,
        user: req.user._id
      });

      if (!paper) {
        return res.status(404).json({ success: false, message: 'Exam paper not found.' });
      }

      const {
        title,
        institutionName,
        courseCode,
        examDuration,
        generalInstructions,
        sections,
        hasAnswerKey,
        hasMarkingScheme,
        status
      } = req.body;

      if (title) paper.title = title.trim();
      if (institutionName !== undefined) paper.institutionName = institutionName;
      if (courseCode !== undefined) paper.courseCode = courseCode;
      if (examDuration !== undefined) paper.examDuration = examDuration;
      if (Array.isArray(generalInstructions)) paper.generalInstructions = generalInstructions;
      if (Array.isArray(sections)) paper.sections = sections;
      if (hasAnswerKey !== undefined) paper.hasAnswerKey = hasAnswerKey;
      if (hasMarkingScheme !== undefined) paper.hasMarkingScheme = hasMarkingScheme;
      if (status && ['draft', 'finalized'].includes(status)) paper.status = status;

      paper.recalculateMarks();
      await paper.save();

      return res.status(200).json({
        success: true,
        message: 'Exam paper updated successfully.',
        data: paper
      });
    } catch (err) {
      console.error('[ExamPaper] Update paper error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Finalize exam paper.
   * POST /api/exam-papers/:id/finalize
   */
  finalizeExamPaper: async (req, res) => {
    try {
      const paper = await ExamPaper.findOne({
        _id: req.params.id,
        user: req.user._id
      });

      if (!paper) {
        return res.status(404).json({ success: false, message: 'Exam paper not found.' });
      }

      paper.status = 'finalized';
      paper.recalculateMarks();
      await paper.save();

      return res.status(200).json({
        success: true,
        message: 'Exam paper finalized successfully.',
        data: paper
      });
    } catch (err) {
      console.error('[ExamPaper] Finalize paper error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Duplicate an exam paper.
   * POST /api/exam-papers/:id/duplicate
   */
  duplicateExamPaper: async (req, res) => {
    try {
      const original = await ExamPaper.findOne({
        _id: req.params.id,
        user: req.user._id
      });

      if (!original) {
        return res.status(404).json({ success: false, message: 'Exam paper not found.' });
      }

      const duplicate = new ExamPaper({
        user: req.user._id,
        subject: original.subject,
        title: `${original.title} (Copy)`,
        institutionName: original.institutionName,
        courseCode: original.courseCode,
        examDuration: original.examDuration,
        generalInstructions: original.generalInstructions,
        sourceScope: original.sourceScope,
        sourceReferences: original.sourceReferences,
        selectedTopics: original.selectedTopics,
        difficulty: original.difficulty,
        sections: original.sections,
        hasAnswerKey: original.hasAnswerKey,
        hasMarkingScheme: original.hasMarkingScheme,
        status: 'draft'
      });

      duplicate.recalculateMarks();
      await duplicate.save();

      return res.status(201).json({
        success: true,
        message: 'Exam paper duplicated successfully.',
        data: duplicate
      });
    } catch (err) {
      console.error('[ExamPaper] Duplicate paper error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Regenerate a single question via AI.
   * POST /api/exam-papers/:id/regenerate-question
   */
  regenerateQuestion: async (req, res) => {
    try {
      const { sectionId, questionIndex } = req.body;
      const paper = await ExamPaper.findOne({
        _id: req.params.id,
        user: req.user._id
      }).populate('subject', 'name');

      if (!paper) {
        return res.status(404).json({ success: false, message: 'Exam paper not found.' });
      }

      const section = paper.sections.find((s) => s.sectionId === sectionId);
      if (!section || !section.questions[questionIndex]) {
        return res.status(400).json({ success: false, message: 'Question not found in paper.' });
      }

      const oldQ = section.questions[questionIndex];
      const singleSectionConfig = [
        {
          sectionId: section.sectionId,
          title: section.title,
          totalQuestions: 1,
          questionsToAnswer: 1,
          marksPerQuestion: oldQ.marks,
          questionType: oldQ.questionType
        }
      ];

      // Fetch source texts if any
      let extractedMaterials = [];
      if (paper.sourceReferences && paper.sourceReferences.length > 0) {
        const sources = await QuizSource.find({
          _id: { $in: paper.sourceReferences },
          user: req.user._id
        });
        extractedMaterials = sources.map((s) => ({ title: s.title, text: s.extractedText }));
      }

      const [newSec] = await generateExamPaperWithAI({
        subjectName: paper.subject.name,
        sourceScope: paper.sourceScope,
        extractedMaterials,
        difficulty: oldQ.difficulty,
        sections: singleSectionConfig
      });

      if (newSec && newSec.questions && newSec.questions[0]) {
        const replacement = newSec.questions[0];
        replacement.questionNumber = oldQ.questionNumber;
        section.questions[questionIndex] = replacement;

        paper.recalculateMarks();
        await paper.save();

        return res.status(200).json({
          success: true,
          message: 'Question regenerated successfully.',
          data: {
            question: replacement,
            paper
          }
        });
      }

      return res.status(500).json({ success: false, message: 'Failed to regenerate question.' });
    } catch (err) {
      console.error('[ExamPaper] Regenerate question error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Delete an exam paper.
   * DELETE /api/exam-papers/:id
   */
  deleteExamPaper: async (req, res) => {
    try {
      const paper = await ExamPaper.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id
      });

      if (!paper) {
        return res.status(404).json({ success: false, message: 'Exam paper not found.' });
      }

      return res.status(200).json({
        success: true,
        message: 'Exam paper deleted successfully.'
      });
    } catch (err) {
      console.error('[ExamPaper] Delete paper error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = examPaperController;
