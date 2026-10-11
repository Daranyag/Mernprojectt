const { ImportantTopicAnalysis } = require('../models/ImportantTopicAnalysis');
const Subject = require('../models/Subject');
const { Topic } = require('../models/Topic');
const { QuizSource } = require('../models/QuizSource');
const StudyMaterial = require('../models/StudyMaterial');
const { generateImportantTopicsWithAI } = require('../services/importantTopics.service');

const importantTopicsController = {
  /**
   * Run AI analysis to identify important topics.
   * POST /api/important-topics/analyze
   */
  analyzeTopics: async (req, res) => {
    try {
      const {
        subjectId,
        title,
        topicIds = [],
        sourceScope = 'general_knowledge', // 'material_only', 'general_knowledge', 'combined'
        sourceIds = [],
        targetTopicCount = 15,
        depthOfAnalysis = 'Standard'
      } = req.body;

      if (!subjectId) {
        return res.status(400).json({ success: false, message: 'Subject is required.' });
      }

      const subject = await Subject.findOne({ _id: subjectId, user: req.user._id });
      if (!subject) {
        return res.status(404).json({ success: false, message: 'Subject not found.' });
      }

      // Resolve topic names: user selected, or existing subject topics, or auto-extracted curriculum topics
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
        topicNames = stdTopics.map((t) => t.title).slice(0, 20);
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

        // Check if any materials exist for this subject
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
        }

        // If STILL no materials found and user chose material_only:
        // Gracefully fallback to general curriculum so analysis NEVER fails!
        if (extractedMaterials.length === 0) {
          effectiveSourceScope = 'general_knowledge';
          fallbackNotice = `No uploaded study materials found for "${subject.name}". High-yield examination topics were analyzed automatically from standard university syllabus.`;
        }
      }

      const count = Math.min(Math.max(parseInt(targetTopicCount, 10) || 15, 5), 40);

      // Call AI generation service
      const analysisResult = await generateImportantTopicsWithAI({
        subjectName: subject.name,
        topicNames,
        sourceScope: effectiveSourceScope,
        extractedMaterials,
        targetCount: count,
        depthOfAnalysis
      });

      const analysisDoc = await ImportantTopicAnalysis.create({
        user: req.user._id,
        subject: subject._id,
        title: title?.trim() || `Important Topics - ${subject.name}`,
        sourceScope: effectiveSourceScope,
        sourceReferences: sourceIds,
        selectedTopics: topicIds,
        targetTopicCount: count,
        depthOfAnalysis,
        summaryNote: fallbackNotice ? `${fallbackNotice} ${analysisResult.summaryNote || ''}` : analysisResult.summaryNote,
        topics: analysisResult.topics
      });

      return res.status(201).json({
        success: true,
        message: fallbackNotice || 'Important topics analyzed successfully.',
        fallbackNotice,
        data: analysisDoc
      });
    } catch (err) {
      console.error('[ImportantTopics] Analysis error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * List saved important topic analyses.
   * GET /api/important-topics
   */
  getAnalyses: async (req, res) => {
    try {
      const { subjectId } = req.query;
      const filter = { user: req.user._id };
      if (subjectId) filter.subject = subjectId;

      const analyses = await ImportantTopicAnalysis.find(filter)
        .populate('subject', 'name color')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        data: analyses
      });
    } catch (err) {
      console.error('[ImportantTopics] Get analyses error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Get single analysis by ID.
   * GET /api/important-topics/:id
   */
  getAnalysisById: async (req, res) => {
    try {
      const analysis = await ImportantTopicAnalysis.findOne({
        _id: req.params.id,
        user: req.user._id
      }).populate('subject', 'name color');

      if (!analysis) {
        return res.status(404).json({ success: false, message: 'Analysis not found.' });
      }

      return res.status(200).json({
        success: true,
        data: analysis
      });
    } catch (err) {
      console.error('[ImportantTopics] Get analysis by id error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Update revision status of an individual topic item.
   * PATCH /api/important-topics/:id/topics/:topicId/status
   */
  updateRevisionStatus: async (req, res) => {
    try {
      const { revisionStatus } = req.body;
      const validStatuses = ['Not Reviewed', 'Need More Practice', 'Revised', 'Understood'];

      if (!validStatuses.includes(revisionStatus)) {
        return res.status(400).json({
          success: false,
          message: `Invalid revision status. Allowed: ${validStatuses.join(', ')}`
        });
      }

      const analysis = await ImportantTopicAnalysis.findOne({
        _id: req.params.id,
        user: req.user._id
      });

      if (!analysis) {
        return res.status(404).json({ success: false, message: 'Analysis not found.' });
      }

      const topicItem = analysis.topics.id(req.params.topicId);
      if (!topicItem) {
        return res.status(404).json({ success: false, message: 'Topic item not found in analysis.' });
      }

      topicItem.revisionStatus = revisionStatus;
      await analysis.save();

      return res.status(200).json({
        success: true,
        message: 'Topic revision status updated.',
        data: {
          topicId: topicItem._id,
          revisionStatus: topicItem.revisionStatus
        }
      });
    } catch (err) {
      console.error('[ImportantTopics] Update revision status error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Regenerate analysis using existing parameters.
   * POST /api/important-topics/:id/regenerate
   */
  regenerateAnalysis: async (req, res) => {
    try {
      const analysis = await ImportantTopicAnalysis.findOne({
        _id: req.params.id,
        user: req.user._id
      }).populate('subject', 'name');

      if (!analysis) {
        return res.status(404).json({ success: false, message: 'Analysis not found.' });
      }

      // Fetch topic names
      let topicNames = [];
      if (analysis.selectedTopics && analysis.selectedTopics.length > 0) {
        const topics = await Topic.find({ _id: { $in: analysis.selectedTopics } });
        topicNames = topics.map((t) => t.name);
      }

      // Fetch materials
      let extractedMaterials = [];
      if (analysis.sourceReferences && analysis.sourceReferences.length > 0) {
        const sources = await QuizSource.find({
          _id: { $in: analysis.sourceReferences },
          user: req.user._id
        });
        extractedMaterials = sources.map((s) => ({ title: s.title, text: s.extractedText }));
      }

      const newResult = await generateImportantTopicsWithAI({
        subjectName: analysis.subject.name,
        topicNames,
        sourceScope: analysis.sourceScope,
        extractedMaterials,
        targetCount: analysis.targetTopicCount,
        depthOfAnalysis: analysis.depthOfAnalysis
      });

      analysis.summaryNote = newResult.summaryNote;
      analysis.topics = newResult.topics;
      await analysis.save();

      return res.status(200).json({
        success: true,
        message: 'Important topics regenerated successfully.',
        data: analysis
      });
    } catch (err) {
      console.error('[ImportantTopics] Regenerate analysis error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Delete saved analysis.
   * DELETE /api/important-topics/:id
   */
  deleteAnalysis: async (req, res) => {
    try {
      const analysis = await ImportantTopicAnalysis.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id
      });

      if (!analysis) {
        return res.status(404).json({ success: false, message: 'Analysis not found.' });
      }

      return res.status(200).json({
        success: true,
        message: 'Analysis deleted successfully.'
      });
    } catch (err) {
      console.error('[ImportantTopics] Delete analysis error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = importantTopicsController;
