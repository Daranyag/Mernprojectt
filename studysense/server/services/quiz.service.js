const mongoose = require('mongoose');
const { Quiz } = require('../models/Quiz');
const { Question } = require('../models/Question');
const { QuizAttempt } = require('../models/QuizAttempt');
const Subject = require('../models/Subject');
const { Topic } = require('../models/Topic');

class QuizService {
  /**
   * Create a new quiz for the user
   */
  async createQuiz(userId, data) {
    const rawQuestionIds = data.questionIds || data.questions || [];
    // 1. Verify subject belongs to user
    const subject = await Subject.findOne({ _id: data.subject, user: userId });
    if (!subject) {
      const error = new Error('Subject not found or does not belong to your account');
      error.statusCode = 404;
      throw error;
    }

    // 2. Verify all questions exist, belong to this user, and belong to the selected subject
    const questions = await Question.find({
      _id: { $in: rawQuestionIds },
      user: userId,
    });

    if (questions.length !== rawQuestionIds.length) {
      const error = new Error('One or more selected questions do not exist or belong to another account');
      error.statusCode = 400;
      throw error;
    }

    // Verify all questions belong to the selected subject
    const invalidSubjectQuestion = questions.find((q) => q.subject.toString() !== data.subject.toString());
    if (invalidSubjectQuestion) {
      const error = new Error('All questions in a quiz must belong to the selected subject');
      error.statusCode = 400;
      throw error;
    }

    // 3. Verify topics if provided
    if (Array.isArray(data.topics) && data.topics.length > 0) {
      const verifiedTopics = await Topic.find({
        _id: { $in: data.topics },
        subject: data.subject,
        user: userId,
      });
      if (verifiedTopics.length !== data.topics.length) {
        const error = new Error('One or more selected topics do not belong to the selected subject');
        error.statusCode = 400;
        throw error;
      }
    }

    const quiz = new Quiz({
      user: userId,
      title: data.title.trim(),
      description: data.description ? data.description.trim() : '',
      subject: data.subject,
      topics: data.topics || [],
      questionIds: rawQuestionIds,
      settings: {
        shuffleQuestions: Boolean(data.settings?.shuffleQuestions),
        shuffleOptions: Boolean(data.settings?.shuffleOptions),
      },
      isPublished: data.isPublished !== undefined ? Boolean(data.isPublished) : true,
    });

    await quiz.save();
    return quiz.populate(['subject', 'topics']);
  }

  /**
   * List user's quizzes with summary statistics
   */
  async getQuizzes(userId, queryParams = {}) {
    const query = { user: userId };

    if (queryParams.subject) {
      query.subject = queryParams.subject;
    }

    if (queryParams.search && queryParams.search.trim()) {
      const regex = new RegExp(queryParams.search.trim(), 'i');
      query.$or = [{ title: regex }, { description: regex }];
    }

    const sortOptions = {};
    const sortBy = queryParams.sortBy || 'createdAt';
    const sortOrder = queryParams.sortOrder === 'asc' ? 1 : -1;
    sortOptions[sortBy] = sortOrder;

    const quizzes = await Quiz.find(query)
      .populate('subject', 'name color')
      .populate('topics', 'title')
      .sort(sortOptions);

    // Attach total question count and attempts summary
    return quizzes.map((q) => ({
      _id: q._id,
      title: q.title,
      description: q.description,
      subject: q.subject,
      topics: q.topics,
      questionCount: q.questionIds.length,
      settings: q.settings,
      isPublished: q.isPublished,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
    }));
  }

  /**
   * Get single quiz details (for edit view)
   */
  async getQuizById(userId, quizId) {
    const quiz = await Quiz.findOne({ _id: quizId, user: userId })
      .populate('subject', 'name color')
      .populate('topics', 'title')
      .populate({
        path: 'questionIds',
        populate: { path: 'topic', select: 'title' },
      });

    if (!quiz) {
      const error = new Error('Quiz not found');
      error.statusCode = 404;
      throw error;
    }

    return quiz;
  }

  /**
   * Get sanitized quiz for TAKING (strips correctOptionId and explanation)
   */
  async getQuizForTaking(userId, quizId) {
    const quiz = await Quiz.findOne({ _id: quizId, user: userId })
      .populate('subject', 'name color')
      .populate('topics', 'title')
      .populate('questionIds');

    if (!quiz) {
      const error = new Error('Quiz not found');
      error.statusCode = 404;
      throw error;
    }

    let questions = quiz.questionIds.filter((q) => q && q.isActive);
    if (questions.length === 0) {
      const error = new Error('This quiz has no active questions to take');
      error.statusCode = 400;
      throw error;
    }

    // Apply shuffle settings if enabled
    if (quiz.settings?.shuffleQuestions) {
      questions = [...questions].sort(() => Math.random() - 0.5);
    }

    const sanitizedQuestions = questions.map((q) => {
      let options = q.options.map((opt) => ({ id: opt.id, text: opt.text }));
      if (quiz.settings?.shuffleOptions) {
        options = [...options].sort(() => Math.random() - 0.5);
      }
      return {
        _id: q._id,
        questionText: q.questionText,
        options,
        difficulty: q.difficulty,
        topic: q.topic,
      };
    });

    return {
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      subject: quiz.subject,
      totalQuestions: sanitizedQuestions.length,
      questions: sanitizedQuestions,
    };
  }

  /**
   * Update quiz
   */
  async updateQuiz(userId, quizId, updateData) {
    const quiz = await Quiz.findOne({ _id: quizId, user: userId });
    if (!quiz) {
      const error = new Error('Quiz not found');
      error.statusCode = 404;
      throw error;
    }

    const effectiveSubject = updateData.subject || quiz.subject;

    if (updateData.subject && updateData.subject.toString() !== quiz.subject.toString()) {
      const subject = await Subject.findOne({ _id: updateData.subject, user: userId });
      if (!subject) {
        const error = new Error('Subject not found or does not belong to your account');
        error.statusCode = 404;
        throw error;
      }
      quiz.subject = updateData.subject;
    }

    if (updateData.questionIds) {
      const questions = await Question.find({
        _id: { $in: updateData.questionIds },
        user: userId,
      });

      if (questions.length !== updateData.questionIds.length) {
        const error = new Error('One or more selected questions do not exist or belong to another account');
        error.statusCode = 400;
        throw error;
      }

      const invalidSubjectQuestion = questions.find((q) => q.subject.toString() !== effectiveSubject.toString());
      if (invalidSubjectQuestion) {
        const error = new Error('All questions in a quiz must belong to the selected subject');
        error.statusCode = 400;
        throw error;
      }

      quiz.questionIds = updateData.questionIds;
    }

    if (updateData.title) quiz.title = updateData.title.trim();
    if (updateData.description !== undefined) quiz.description = updateData.description.trim();
    if (updateData.topics !== undefined) quiz.topics = updateData.topics;
    if (updateData.settings) {
      quiz.settings = {
        shuffleQuestions: Boolean(updateData.settings.shuffleQuestions),
        shuffleOptions: Boolean(updateData.settings.shuffleOptions),
      };
    }
    if (updateData.isPublished !== undefined) quiz.isPublished = Boolean(updateData.isPublished);

    await quiz.save();
    return quiz.populate(['subject', 'topics']);
  }

  /**
   * Delete quiz while retaining historical attempt integrity
   */
  async deleteQuiz(userId, quizId) {
    const quiz = await Quiz.findOne({ _id: quizId, user: userId });
    if (!quiz) {
      const error = new Error('Quiz not found');
      error.statusCode = 404;
      throw error;
    }

    // Retain quiz attempts, unlinking quiz ID reference while preserving quizTitleSnapshot
    await QuizAttempt.updateMany({ quiz: quizId, user: userId }, { $set: { quiz: null } });

    await Quiz.deleteOne({ _id: quizId, user: userId });
    return { id: quizId, title: quiz.title };
  }

  /**
   * Secure server-side quiz evaluation
   * Authoritative scoring: verifies each answer, calculates score & percentage on the server,
   * ignores any client-supplied scores, and records the QuizAttempt.
   */
  async submitQuiz(userId, quizId, submissionData) {
    const quiz = await Quiz.findOne({ _id: quizId, user: userId }).populate('questionIds');
    if (!quiz) {
      const error = new Error('Quiz not found or access denied');
      error.statusCode = 404;
      throw error;
    }

    const { answers } = submissionData;
    const authorativeQuestions = quiz.questionIds.filter((q) => q && q.isActive);

    if (authorativeQuestions.length === 0) {
      const error = new Error('This quiz contains no active questions to evaluate');
      error.statusCode = 400;
      throw error;
    }

    const qMap = new Map();
    authorativeQuestions.forEach((q) => {
      qMap.set(q._id.toString(), q);
    });

    // Map client answers by questionId
    const submittedAnswerMap = new Map();
    answers.forEach((ans) => {
      submittedAnswerMap.set(ans.questionId.toString(), ans.selectedOptionId);
    });

    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let unansweredCount = 0;
    const results = [];

    // Evaluate each authoritative question from DB
    for (const q of authorativeQuestions) {
      const qIdStr = q._id.toString();
      const selectedOptionId = submittedAnswerMap.get(qIdStr) || null;

      // Validate option ID if supplied
      let isValidOption = false;
      if (selectedOptionId) {
        isValidOption = q.options.some((opt) => opt.id === selectedOptionId);
      }

      const effectiveSelectedId = isValidOption ? selectedOptionId : null;
      const isCorrect = Boolean(effectiveSelectedId && effectiveSelectedId === q.correctOptionId);

      if (!effectiveSelectedId) {
        unansweredCount++;
      } else if (isCorrect) {
        correctAnswers++;
      } else {
        incorrectAnswers++;
      }

      results.push({
        questionId: q._id,
        questionText: q.questionText,
        topic: q.topic || null,
        options: q.options.map((opt) => ({ id: opt.id, text: opt.text })),
        selectedOptionId: effectiveSelectedId,
        correctOptionId: q.correctOptionId,
        isCorrect,
        explanation: q.explanation || '',
      });
    }

    const totalQuestions = authorativeQuestions.length;
    const score = correctAnswers;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    const attempt = new QuizAttempt({
      user: userId,
      quiz: quiz._id,
      quizTitleSnapshot: quiz.title,
      subject: quiz.subject,
      score,
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      unansweredCount,
      percentage,
      results,
      completedAt: new Date(),
    });

    await attempt.save();

    // Module 6: Automatically populate Mistake Book from incorrect answers
    try {
      const mistakeService = require('./mistake.service');
      await mistakeService.processQuizAttemptMistakes(userId, attempt);
    } catch (mistakeErr) {
      console.warn('[QuizService] Failed to auto-process mistake book:', mistakeErr.message);
    }

    return attempt.populate(['subject']);
  }

  /**
   * List authenticated user's quiz attempts
   */
  async getAttempts(userId, queryParams = {}) {
    const query = { user: userId };

    if (queryParams.subject) {
      query.subject = queryParams.subject;
    }

    if (queryParams.quiz) {
      query.quiz = queryParams.quiz;
    }

    const sortOptions = { completedAt: -1 };

    return QuizAttempt.find(query)
      .populate('subject', 'name color')
      .populate('quiz', 'title')
      .select('-results') // omit per-question results in list for performance
      .sort(sortOptions);
  }

  /**
   * Get single attempt with full question review
   */
  async getAttemptById(userId, attemptId) {
    const attempt = await QuizAttempt.findOne({ _id: attemptId, user: userId })
      .populate('subject', 'name color')
      .populate('quiz', 'title');

    if (!attempt) {
      const error = new Error('Quiz attempt not found');
      error.statusCode = 404;
      throw error;
    }

    return attempt;
  }

  /**
   * Record direct attempt (e.g. from AI Quiz Generator platform)
   */
  async recordDirectAttempt(userId, data) {
    const {
      quizId,
      quizTitle,
      subjectId,
      score,
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      unansweredCount,
      percentage,
      results = []
    } = data;

    const subject = await Subject.findOne({ _id: subjectId, user: userId });
    if (!subject) {
      const error = new Error('Subject not found or access denied');
      error.statusCode = 404;
      throw error;
    }

    const attempt = new QuizAttempt({
      user: userId,
      quiz: quizId || null,
      quizTitleSnapshot: quizTitle?.trim() || `${subject.name} Live Quiz`,
      subject: subject._id,
      score: Number(score) || 0,
      totalQuestions: Number(totalQuestions) || 1,
      correctAnswers: Number(correctAnswers) || 0,
      incorrectAnswers: Number(incorrectAnswers) || 0,
      unansweredCount: Number(unansweredCount) || 0,
      percentage: Math.min(100, Math.max(0, Math.round(Number(percentage) || 0))),
      results: results.map((r) => ({
        questionId: r.questionId || null,
        questionText: r.questionText || '',
        topic: r.topicId || r.topic || null,
        options: Array.isArray(r.options) ? r.options : [],
        selectedOptionId: r.selectedOptionId || null,
        correctOptionId: r.correctOptionId || 'A',
        isCorrect: Boolean(r.isCorrect),
        explanation: r.explanation || '',
      })),
      completedAt: new Date(),
    });

    await attempt.save();

    // Auto-populate Mistake Book from incorrect answers
    try {
      const mistakeService = require('./mistake.service');
      await mistakeService.processQuizAttemptMistakes(userId, attempt);
    } catch (mistakeErr) {
      console.warn('[QuizService] Failed to auto-process mistake book:', mistakeErr.message);
    }

    return attempt.populate(['subject', 'quiz']);
  }
}


module.exports = new QuizService();
