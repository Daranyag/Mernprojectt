const mongoose = require('mongoose');
const { Question } = require('../models/Question');
const Subject = require('../models/Subject');
const { Topic } = require('../models/Topic');

class QuestionService {
  /**
   * Verify that subject belongs to user, and if topic is specified, that topic belongs to subject & user.
   */
  async verifySubjectAndTopic(userId, subjectId, topicId) {
    const subject = await Subject.findOne({ _id: subjectId, user: userId });
    if (!subject) {
      const error = new Error('Subject not found or does not belong to your account');
      error.statusCode = 404;
      throw error;
    }

    if (topicId) {
      const topic = await Topic.findOne({ _id: topicId, subject: subjectId, user: userId });
      if (!topic) {
        const error = new Error('Topic not found or does not belong to the selected subject');
        error.statusCode = 400;
        throw error;
      }
    }

    return subject;
  }

  /**
   * Create question in question bank
   */
  async createQuestion(userId, data) {
    await this.verifySubjectAndTopic(userId, data.subject, data.topic);

    const question = new Question({
      user: userId,
      subject: data.subject,
      topic: data.topic || null,
      questionText: data.questionText.trim(),
      questionType: data.questionType || 'single_choice',
      options: data.options.map((opt) => ({
        id: opt.id.trim(),
        text: opt.text.trim(),
      })),
      correctOptionId: data.correctOptionId.trim(),
      explanation: data.explanation ? data.explanation.trim() : '',
      difficulty: data.difficulty || 'Medium',
      tags: Array.isArray(data.tags)
        ? data.tags.map((t) => t.trim().toLowerCase()).filter(Boolean)
        : [],
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    });

    await question.save();
    return question.populate(['subject', 'topic']);
  }

  /**
   * List user's questions with filtering, search, and sorting
   */
  async getQuestions(userId, queryParams = {}) {
    const query = { user: userId };

    if (queryParams.subject) {
      query.subject = queryParams.subject;
    }

    if (queryParams.topic) {
      query.topic = queryParams.topic;
    }

    if (queryParams.difficulty) {
      query.difficulty = queryParams.difficulty;
    }

    if (queryParams.isActive !== undefined && queryParams.isActive !== '') {
      query.isActive = queryParams.isActive === 'true' || queryParams.isActive === true;
    }

    if (queryParams.search && queryParams.search.trim()) {
      const term = queryParams.search.trim();
      const regex = new RegExp(term, 'i');
      query.$or = [{ questionText: regex }, { tags: regex }, { explanation: regex }];
    }

    const sortOptions = {};
    const sortBy = queryParams.sortBy || 'createdAt';
    const sortOrder = queryParams.sortOrder === 'asc' ? 1 : -1;
    sortOptions[sortBy] = sortOrder;

    return Question.find(query)
      .populate('subject', 'name color')
      .populate('topic', 'title')
      .sort(sortOptions);
  }

  /**
   * Get single question owned by user (with correctOptionId and explanation for creator)
   */
  async getQuestionById(userId, questionId) {
    const question = await Question.findOne({ _id: questionId, user: userId })
      .populate('subject', 'name color')
      .populate('topic', 'title');

    if (!question) {
      const error = new Error('Question not found');
      error.statusCode = 404;
      throw error;
    }

    return question;
  }

  /**
   * Update question owned by user
   */
  async updateQuestion(userId, questionId, updateData) {
    const question = await Question.findOne({ _id: questionId, user: userId });
    if (!question) {
      const error = new Error('Question not found');
      error.statusCode = 404;
      throw error;
    }

    const effectiveSubject = updateData.subject || question.subject;
    const effectiveTopic = updateData.topic !== undefined ? updateData.topic : question.topic;

    if (updateData.subject || updateData.topic !== undefined) {
      await this.verifySubjectAndTopic(userId, effectiveSubject, effectiveTopic);
    }

    if (updateData.subject) question.subject = updateData.subject;
    if (updateData.topic !== undefined) question.topic = updateData.topic || null;
    if (updateData.questionText) question.questionText = updateData.questionText.trim();
    if (updateData.options) {
      question.options = updateData.options.map((opt) => ({
        id: opt.id.trim(),
        text: opt.text.trim(),
      }));
    }
    if (updateData.correctOptionId) {
      question.correctOptionId = updateData.correctOptionId.trim();
    }
    if (updateData.explanation !== undefined) {
      question.explanation = updateData.explanation.trim();
    }
    if (updateData.difficulty) {
      question.difficulty = updateData.difficulty;
    }
    if (updateData.tags !== undefined) {
      question.tags = Array.isArray(updateData.tags)
        ? updateData.tags.map((t) => t.trim().toLowerCase()).filter(Boolean)
        : [];
    }
    if (updateData.isActive !== undefined) {
      question.isActive = Boolean(updateData.isActive);
    }

    await question.save();
    return question.populate(['subject', 'topic']);
  }

  /**
   * Delete question owned by user
   */
  async deleteQuestion(userId, questionId) {
    const question = await Question.findOne({ _id: questionId, user: userId });
    if (!question) {
      const error = new Error('Question not found');
      error.statusCode = 404;
      throw error;
    }

    // Pull from any quizzes where this question is referenced
    const { Quiz } = require('../models/Quiz');
    await Quiz.updateMany({ questionIds: questionId, user: userId }, { $pull: { questionIds: questionId } });

    await Question.deleteOne({ _id: questionId, user: userId });
    return { id: questionId, questionText: question.questionText };
  }
}

module.exports = new QuestionService();
