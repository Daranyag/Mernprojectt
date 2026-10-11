const mongoose = require('mongoose');
const { Mistake } = require('../models/Mistake');
const { PracticeAttempt } = require('../models/PracticeAttempt');
const Subject = require('../models/Subject');

class MistakeService {
  /**
   * Automatically process completed quiz attempt and create or update Mistake records.
   * Policy:
   * - Only questions answered INCORRECTLY (isCorrect === false && selectedOptionId !== null) are saved as mistakes.
   * - Unanswered questions (selectedOptionId === null) are not classified as mistake misconceptions.
   * - Deduplication: If the user already has a Mistake for this question, update it (increment incorrectCount, update attempt reference, reset status to needs_review).
   */
  async processQuizAttemptMistakes(userId, attempt) {
    if (!attempt || !Array.isArray(attempt.results)) return [];

    const incorrectResults = attempt.results.filter(
      (r) => !r.isCorrect && r.selectedOptionId !== null
    );

    const savedMistakes = [];

    for (const resItem of incorrectResults) {
      // Find existing mistake for this question and user
      let existingMistake = null;
      if (resItem.questionId) {
        existingMistake = await Mistake.findOne({
          user: userId,
          question: resItem.questionId,
        });
      }

      if (existingMistake) {
        // Update existing record with latest snapshot and increment count
        existingMistake.sourceQuiz = attempt.quiz || existingMistake.sourceQuiz;
        existingMistake.sourceAttempt = attempt._id;
        existingMistake.selectedOptionId = resItem.selectedOptionId;
        existingMistake.incorrectCount += 1;
        // If it was corrected previously, an incorrect answer in a quiz moves it back to needs_review
        existingMistake.status = 'needs_review';
        await existingMistake.save();
        savedMistakes.push(existingMistake);
      } else {
        // Create new mistake entry
        const newMistake = new Mistake({
          user: userId,
          question: resItem.questionId || null,
          sourceQuiz: attempt.quiz || null,
          sourceAttempt: attempt._id,
          subject: attempt.subject,
          topic: resItem.topic || null,
          questionSnapshot: resItem.questionText,
          optionsSnapshot: resItem.options,
          selectedOptionId: resItem.selectedOptionId,
          correctOptionId: resItem.correctOptionId,
          explanationSnapshot: resItem.explanation || '',
          status: 'needs_review',
          incorrectCount: 1,
          correctPracticeCount: 0,
        });
        await newMistake.save();
        savedMistakes.push(newMistake);
      }
    }

    return savedMistakes;
  }

  /**
   * Save mistakes directly from an interactive live quiz session (AI Quiz Generator / In-browser quiz).
   * Supports topic lookup by ID or title if provided.
   */
  async recordDirectMistakes(userId, { subjectId, topicId, mistakes = [] }) {
    if (!subjectId || !Array.isArray(mistakes) || mistakes.length === 0) {
      return [];
    }

    const savedRecords = [];

    for (const item of mistakes) {
      if (!item.questionText) continue;

      // Look up existing mistake by question text & user & subject to prevent duplicates
      let existing = await Mistake.findOne({
        user: userId,
        subject: subjectId,
        questionSnapshot: item.questionText,
      });

      if (existing) {
        existing.incorrectCount += 1;
        existing.status = 'needs_review';
        if (item.selectedOptionId) existing.selectedOptionId = item.selectedOptionId;
        await existing.save();
        savedRecords.push(existing);
      } else {
        const newMistake = new Mistake({
          user: userId,
          subject: subjectId,
          topic: topicId || item.topicId || null,
          questionSnapshot: item.questionText,
          optionsSnapshot: Array.isArray(item.options) ? item.options : [],
          selectedOptionId: item.selectedOptionId || item.userAnswer || null,
          correctOptionId: item.correctOptionId || item.correctAnswer || 'A',
          explanationSnapshot: item.explanation || '',
          status: 'needs_review',
          incorrectCount: 1,
          correctPracticeCount: 0,
        });
        await newMistake.save();
        savedRecords.push(newMistake);
      }
    }

    return savedRecords;
  }

  /**
   * List user's mistakes with filtering, searching, and sorting
   */
  async getMistakes(userId, queryParams = {}) {
    const query = { user: userId };

    if (queryParams.subject) {
      query.subject = queryParams.subject;
    }

    if (queryParams.topic) {
      query.topic = queryParams.topic;
    }

    if (queryParams.status) {
      query.status = queryParams.status;
    }

    if (queryParams.isMarkedForReview !== undefined && queryParams.isMarkedForReview !== '') {
      query.isMarkedForReview = queryParams.isMarkedForReview === 'true' || queryParams.isMarkedForReview === true;
    }

    if (queryParams.search && queryParams.search.trim()) {
      const term = queryParams.search.trim();
      const regex = new RegExp(term, 'i');
      query.$or = [
        { questionSnapshot: regex },
        { personalNote: regex },
        { explanationSnapshot: regex },
      ];
    }

    const sortOptions = {};
    const sortBy = queryParams.sortBy || 'createdAt';
    const sortOrder = queryParams.sortOrder === 'asc' ? 1 : -1;
    sortOptions[sortBy] = sortOrder;

    return Mistake.find(query)
      .populate('subject', 'name color')
      .populate('topic', 'title')
      .populate('sourceQuiz', 'title')
      .sort(sortOptions);
  }

  /**
   * Get single mistake by ID
   */
  async getMistakeById(userId, mistakeId) {
    const mistake = await Mistake.findOne({ _id: mistakeId, user: userId })
      .populate('subject', 'name color')
      .populate('topic', 'title')
      .populate('sourceQuiz', 'title');

    if (!mistake) {
      const error = new Error('Mistake not found');
      error.statusCode = 404;
      throw error;
    }

    return mistake;
  }

  /**
   * Update mistake permitted fields (personalNote, isMarkedForReview, status)
   */
  async updateMistake(userId, mistakeId, updateData) {
    const mistake = await Mistake.findOne({ _id: mistakeId, user: userId });
    if (!mistake) {
      const error = new Error('Mistake not found');
      error.statusCode = 404;
      throw error;
    }

    if (updateData.personalNote !== undefined) {
      mistake.personalNote = updateData.personalNote ? updateData.personalNote.trim() : '';
    }

    if (updateData.isMarkedForReview !== undefined) {
      mistake.isMarkedForReview = Boolean(updateData.isMarkedForReview);
    }

    if (updateData.status && ['needs_review', 'practicing', 'corrected'].includes(updateData.status)) {
      mistake.status = updateData.status;
    }

    await mistake.save();
    return mistake.populate(['subject', 'topic', 'sourceQuiz']);
  }

  /**
   * Toggle marked for review
   */
  async toggleMarkedForReview(userId, mistakeId) {
    const mistake = await Mistake.findOne({ _id: mistakeId, user: userId });
    if (!mistake) {
      const error = new Error('Mistake not found');
      error.statusCode = 404;
      throw error;
    }

    mistake.isMarkedForReview = !mistake.isMarkedForReview;
    await mistake.save();
    return mistake.populate(['subject', 'topic']);
  }

  /**
   * Delete mistake from Mistake Book
   */
  async deleteMistake(userId, mistakeId) {
    const mistake = await Mistake.findOne({ _id: mistakeId, user: userId });
    if (!mistake) {
      const error = new Error('Mistake not found');
      error.statusCode = 404;
      throw error;
    }

    await PracticeAttempt.deleteMany({ mistake: mistakeId, user: userId });
    await Mistake.deleteOne({ _id: mistakeId, user: userId });

    return { id: mistakeId };
  }

  /**
   * Fetch sanitized questions for a Practice Session
   * Zero Answer Leakage: correctOptionId and explanation are completely stripped!
   */
  async getPracticeSession(userId, filterParams = {}) {
    const query = { user: userId };

    if (filterParams.subject) {
      query.subject = filterParams.subject;
    }

    if (filterParams.topic) {
      query.topic = filterParams.topic;
    }

    if (filterParams.status) {
      query.status = filterParams.status;
    }

    if (filterParams.onlyMarked === 'true' || filterParams.onlyMarked === true) {
      query.isMarkedForReview = true;
    }

    const mistakes = await Mistake.find(query)
      .populate('subject', 'name color')
      .populate('topic', 'title')
      .sort({ updatedAt: -1 });

    const practiceQuestions = mistakes.map((m) => m.toPracticeView());

    return {
      totalQuestions: practiceQuestions.length,
      questions: practiceQuestions,
    };
  }

  /**
   * Submit and evaluate a practice answer for a mistake
   * Server evaluates correctness, ignores client-forged scores, records PracticeAttempt,
   * and updates Mistake status (needs_review -> practicing -> corrected).
   */
  async submitPracticeAnswer(userId, mistakeId, { selectedOptionId }) {
    const mistake = await Mistake.findOne({ _id: mistakeId, user: userId });
    if (!mistake) {
      const error = new Error('Mistake not found or access denied');
      error.statusCode = 404;
      throw error;
    }

    if (!selectedOptionId || typeof selectedOptionId !== 'string') {
      const error = new Error('A valid selected option ID is required');
      error.statusCode = 400;
      throw error;
    }

    const isValidOption = mistake.optionsSnapshot.some((opt) => opt.id === selectedOptionId);
    if (!isValidOption) {
      const error = new Error('Selected option does not belong to this question');
      error.statusCode = 400;
      throw error;
    }

    const isCorrect = selectedOptionId === mistake.correctOptionId;

    // Update mistake progress
    mistake.lastPracticedAt = new Date();
    if (isCorrect) {
      mistake.correctPracticeCount += 1;
      // Mark as corrected if answered correctly in practice
      mistake.status = 'corrected';
    } else {
      // If wrong again in practice, set to practicing or needs_review
      mistake.incorrectCount += 1;
      mistake.status = 'needs_review';
    }

    await mistake.save();

    // Record practice attempt for history
    const practiceRecord = new PracticeAttempt({
      user: userId,
      mistake: mistake._id,
      questionSnapshot: mistake.questionSnapshot,
      selectedOptionId,
      correctOptionId: mistake.correctOptionId,
      isCorrect,
      explanationSnapshot: mistake.explanationSnapshot,
      practicedAt: new Date(),
    });
    await practiceRecord.save();

    return {
      mistakeId: mistake._id,
      isCorrect,
      selectedOptionId,
      correctOptionId: mistake.correctOptionId,
      explanation: mistake.explanationSnapshot,
      status: mistake.status,
      correctPracticeCount: mistake.correctPracticeCount,
      incorrectCount: mistake.incorrectCount,
    };
  }

  /**
   * Get user's practice history
   */
  async getPracticeHistory(userId) {
    return PracticeAttempt.find({ user: userId })
      .populate({
        path: 'mistake',
        select: 'subject topic status',
        populate: [
          { path: 'subject', select: 'name color' },
          { path: 'topic', select: 'title' },
        ],
      })
      .sort({ practicedAt: -1 })
      .limit(50);
  }
}

module.exports = new MistakeService();
