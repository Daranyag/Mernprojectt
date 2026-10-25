const { QuizSource } = require('../models/QuizSource');
const Subject = require('../models/Subject');
const { Topic } = require('../models/Topic');
const { Question } = require('../models/Question');
const { Quiz } = require('../models/Quiz');
const { StudyMaterial } = require('../models/StudyMaterial');
const {
  normalizeText,
  extractTextFromPdf,
  extractTextFromPptx,
  extractWebpageContent,
  getYouTubeVideoId,
  extractYouTubeTranscript
} = require('../services/sourceIngestion.service');
const { generateQuestionsWithAI } = require('../services/quizGenerator.service');

const quizGeneratorController = {
  /**
   * Ingest pasted study text or syllabus.
   * POST /api/quiz-generator/sources/text
   */
  ingestTextSource: async (req, res) => {
    try {
      const { subjectId, topicId, title, content, sourceType } = req.body;

      if (!subjectId) {
        return res.status(400).json({ success: false, message: 'Subject reference is required.' });
      }

      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, message: 'Pasted content cannot be empty.' });
      }

      const subject = await Subject.findOne({ _id: subjectId, user: req.user._id });
      if (!subject) {
        return res.status(404).json({ success: false, message: 'Subject not found.' });
      }

      const cleanText = normalizeText(content);
      const words = cleanText.split(/\s+/).filter(Boolean).length;

      const source = await QuizSource.create({
        user: req.user._id,
        subject: subject._id,
        topic: topicId || null,
        sourceType: sourceType === 'syllabus' ? 'syllabus' : 'text',
        title: title?.trim() || `${sourceType === 'syllabus' ? 'Syllabus' : 'Pasted Notes'} - ${subject.name}`,
        rawContent: cleanText,
        extractedText: cleanText,
        charCount: cleanText.length,
        wordCount: words,
        status: 'completed'
      });

      return res.status(201).json({
        success: true,
        message: 'Text source ingested successfully.',
        data: source
      });
    } catch (err) {
      console.error('[QuizGen] Ingest text error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Ingest file upload (PDF or PPTX).
   * POST /api/quiz-generator/sources/upload
   */
  ingestFileUpload: async (req, res) => {
    try {
      const { subjectId, topicId, title } = req.body;

      if (!subjectId) {
        return res.status(400).json({ success: false, message: 'Subject reference is required.' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
      }

      const subject = await Subject.findOne({ _id: subjectId, user: req.user._id });
      if (!subject) {
        return res.status(404).json({ success: false, message: 'Subject not found.' });
      }

      const originalName = req.file.originalname || 'uploaded_document';
      const ext = originalName.split('.').pop().toLowerCase();

      let extractedResult;
      let detectedType = 'pdf';

      if (ext === 'pdf' || req.file.mimetype === 'application/pdf') {
        detectedType = 'pdf';
        extractedResult = await extractTextFromPdf(req.file.buffer);
      } else if (
        ext === 'pptx' ||
        req.file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ) {
        detectedType = 'pptx';
        extractedResult = await extractTextFromPptx(req.file.buffer);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Unsupported file type. Only PDF (.pdf) and PowerPoint (.pptx) documents are supported.'
        });
      }

      const cleanText = normalizeText(extractedResult.text);
      const words = cleanText.split(/\s+/).filter(Boolean).length;

      const source = await QuizSource.create({
        user: req.user._id,
        subject: subject._id,
        topic: topicId || null,
        sourceType: detectedType,
        title: title?.trim() || originalName,
        originalFilename: originalName,
        rawContent: '', // avoid keeping giant raw binary in Mongo
        extractedText: cleanText,
        charCount: cleanText.length,
        wordCount: words,
        metadata: extractedResult.info || { slidesCount: extractedResult.slidesCount },
        status: 'completed'
      });

      return res.status(201).json({
        success: true,
        message: 'File uploaded and parsed successfully.',
        data: source
      });
    } catch (err) {
      console.error('[QuizGen] Ingest file upload error:', err);
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  /**
   * Ingest external URL (YouTube transcript, ChatGPT share, Webpage article).
   * POST /api/quiz-generator/sources/url
   */
  ingestUrlSource: async (req, res) => {
    try {
      const { subjectId, topicId, url: rawUrl, title } = req.body;

      if (!subjectId) {
        return res.status(400).json({ success: false, message: 'Subject reference is required.' });
      }

      if (!rawUrl || !rawUrl.trim()) {
        return res.status(400).json({ success: false, message: 'URL is required.' });
      }

      const subject = await Subject.findOne({ _id: subjectId, user: req.user._id });
      if (!subject) {
        return res.status(404).json({ success: false, message: 'Subject not found.' });
      }

      const videoId = getYouTubeVideoId(rawUrl);
      let extractedText = '';
      let detectedType = 'webpage';
      let pageTitle = title || '';

      if (videoId) {
        detectedType = 'youtube';
        extractedText = await extractYouTubeTranscript(videoId);
        pageTitle = pageTitle || `YouTube Video (${videoId})`;
      } else {
        const webpageResult = await extractWebpageContent(rawUrl);
        extractedText = webpageResult.text;
        pageTitle = pageTitle || webpageResult.title;
        detectedType = rawUrl.includes('chatgpt.com/share') ? 'chatgpt' : 'webpage';
      }

      const cleanText = normalizeText(extractedText);
      const words = cleanText.split(/\s+/).filter(Boolean).length;

      const source = await QuizSource.create({
        user: req.user._id,
        subject: subject._id,
        topic: topicId || null,
        sourceType: detectedType,
        title: pageTitle || 'Webpage Reference',
        sourceUrl: rawUrl.trim(),
        rawContent: '',
        extractedText: cleanText,
        charCount: cleanText.length,
        wordCount: words,
        status: 'completed'
      });

      return res.status(201).json({
        success: true,
        message: 'URL content retrieved and extracted successfully.',
        data: source
      });
    } catch (err) {
      console.error('[QuizGen] Ingest URL error:', err);
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  /**
   * List user's ingested sources for a subject.
   * GET /api/quiz-generator/sources
   */
  getSources: async (req, res) => {
    try {
      const { subjectId } = req.query;
      const filter = { user: req.user._id };
      if (subjectId) filter.subject = subjectId;

      const sources = await QuizSource.find(filter)
        .populate('subject', 'name')
        .populate('topic', 'name')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        data: sources
      });
    } catch (err) {
      console.error('[QuizGen] Get sources error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Delete an ingested source.
   * DELETE /api/quiz-generator/sources/:id
   */
  deleteSource: async (req, res) => {
    try {
      const source = await QuizSource.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id
      });

      if (!source) {
        return res.status(404).json({ success: false, message: 'Source not found.' });
      }

      return res.status(200).json({
        success: true,
        message: 'Source deleted successfully.'
      });
    } catch (err) {
      console.error('[QuizGen] Delete source error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Generates questions using Google Gemini AI.
   * POST /api/quiz-generator/generate
   */
  generateQuiz: async (req, res) => {
    try {
      const {
        subjectId,
        topicId,
        sourceScope = 'material_only', // 'material_only', 'general_knowledge', 'combined'
        sourceIds = [],
        difficulty = 'Medium',
        marks = '1',
        marksTier = '',
        questionFormat = 'single_choice',
        questionType = '',
        questionCount = 5,
        targetCount
      } = req.body;

      if (!subjectId) {
        return res.status(400).json({ success: false, message: 'Subject reference is required.' });
      }

      const subject = await Subject.findOne({ _id: subjectId, user: req.user._id });
      if (!subject) {
        return res.status(404).json({ success: false, message: 'Subject not found.' });
      }

      let topicName = '';
      if (topicId) {
        const topic = await Topic.findOne({ _id: topicId, subject: subject._id });
        if (topic) topicName = topic.title || topic.name || '';
      }

      // If no topic selected, check if subject has any topics
      if (!topicName) {
        const anyTopic = await Topic.findOne({ subject: subject._id });
        if (anyTopic) {
          topicName = anyTopic.title || anyTopic.name || '';
        } else {
          // Subject has no topics in DB: auto-derive from curriculum
          const topicService = require('../services/topic.service');
          const std = topicService.getStandardSubjectTopics(subject.name);
          topicName = std[0]?.title || 'Core Foundations';
        }
      }

      // Gather source materials if scope involves materials
      let extractedMaterials = [];
      let effectiveSourceScope = sourceScope;
      let fallbackNotice = null;

      if (sourceScope === 'material_only' || sourceScope === 'combined') {
        if (Array.isArray(sourceIds) && sourceIds.length > 0) {
          const sources = await QuizSource.find({
            _id: { $in: sourceIds },
            user: req.user._id
          });
          extractedMaterials = sources.map((s) => ({
            id: s._id,
            title: s.title,
            text: s.extractedText
          }));

          const materialNotes = await StudyMaterial.find({
            _id: { $in: sourceIds },
            user: req.user._id
          });
          for (const note of materialNotes) {
            extractedMaterials.push({
              id: note._id,
              title: note.title,
              text: note.content || ''
            });
          }
        }

        // If no sources passed, check if any materials exist for this subject
        if (extractedMaterials.length === 0) {
          const anyMats = await StudyMaterial.find({ subject: subject._id, user: req.user._id });
          for (const note of anyMats) {
            extractedMaterials.push({
              id: note._id,
              title: note.title,
              text: note.content || ''
            });
          }
          const anySrc = await QuizSource.find({ subject: subject._id, user: req.user._id });
          for (const s of anySrc) {
            extractedMaterials.push({
              id: s._id,
              title: s.title,
              text: s.extractedText
            });
          }
        }

        // If STILL no materials found and user chose material_only:
        // Gracefully fallback to general curriculum so questions are generated!
        if (extractedMaterials.length === 0) {
          effectiveSourceScope = 'general_knowledge';
          fallbackNotice = `No uploaded study materials found for "${subject.name}". Generated quiz questions automatically from standard course curriculum and topics.`;
        }
      }

      // Support both targetCount and questionCount from frontend
      const rawCount = targetCount !== undefined ? targetCount : questionCount;
      const count = Math.min(Math.max(parseInt(rawCount, 10) || 5, 1), 50);

      // Map outer_sources / general_knowledge
      if (effectiveSourceScope === 'outer_sources') {
        effectiveSourceScope = 'general_knowledge';
      }

      // Call AI generation service
      const generatedQuestions = await generateQuestionsWithAI({
        subjectName: subject.name,
        topicName,
        sourceScope: effectiveSourceScope,
        extractedMaterials,
        difficulty,
        marks,
        questionFormat,
        questionCount: count
      });

      return res.status(200).json({
        success: true,
        message: fallbackNotice || `Successfully generated ${generatedQuestions.length} questions.`,
        fallbackNotice,
        data: {
          subject: { id: subject._id, name: subject.name },
          topic: topicId ? { id: topicId, name: topicName } : { name: topicName },
          sourceScope: effectiveSourceScope,
          difficulty,
          marks,
          questionFormat,
          questions: generatedQuestions
        }
      });
    } catch (err) {
      console.error('[QuizGen] Generate quiz error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Save selected generated questions to Question Bank and/or create a Quiz.
   * POST /api/quiz-generator/save
   */
  saveGeneratedQuestions: async (req, res) => {
    try {
      const {
        subjectId,
        topicId,
        questions = [],
        createQuiz = false,
        quizTitle = ''
      } = req.body;

      if (!subjectId) {
        return res.status(400).json({ success: false, message: 'Subject reference is required.' });
      }

      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ success: false, message: 'No questions provided to save.' });
      }

      const subject = await Subject.findOne({ _id: subjectId, user: req.user._id });
      if (!subject) {
        return res.status(404).json({ success: false, message: 'Subject not found.' });
      }

      const savedQuestionDocs = [];

      for (const q of questions) {
        const questionDoc = await Question.create({
          user: req.user._id,
          subject: subject._id,
          topic: topicId || null,
          questionText: q.questionText,
          questionType: q.questionType || 'single_choice',
          options: q.options || [],
          correctOptionId: q.correctOptionId || '',
          explanation: q.explanation || '',
          difficulty: q.difficulty || 'Medium',
          marks: q.marks || 1,
          expectedAnswer: q.expectedAnswer || '',
          rubric: q.rubric || [],
          sourceReference: q.sourceReference || '',
          tags: q.tags || []
        });
        savedQuestionDocs.push(questionDoc);
      }

      let createdQuizDoc = null;
      if (createQuiz) {
        const title = quizTitle?.trim() || `AI Generated Quiz - ${subject.name}`;
        createdQuizDoc = await Quiz.create({
          user: req.user._id,
          title,
          description: `Generated on ${new Date().toLocaleDateString()} from study materials.`,
          subject: subject._id,
          topics: topicId ? [topicId] : [],
          questionIds: savedQuestionDocs.map((doc) => doc._id),
          isPublished: true
        });
      }

      return res.status(201).json({
        success: true,
        message: `Saved ${savedQuestionDocs.length} questions to Question Bank.${
          createdQuizDoc ? ' Quiz created successfully.' : ''
        }`,
        data: {
          savedQuestionsCount: savedQuestionDocs.length,
          questionIds: savedQuestionDocs.map((doc) => doc._id),
          quiz: createdQuizDoc
        }
      });
    } catch (err) {
      console.error('[QuizGen] Save generated questions error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = quizGeneratorController;
