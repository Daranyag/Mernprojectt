const mongoose = require('mongoose');
const Subject = require('../models/Subject');
const { Topic } = require('../models/Topic');

/**
 * Service handling Subject business logic and database interactions
 */
class SubjectService {
  /**
   * Helper to calculate topic completion and mastery progress
   * @param {Array} topics
   * @returns {Object} { totalTopics, completedTopics, masteredTopics, inProgressTopics, notStartedTopics, progressPercentage }
   */
  calculateProgress(topics = []) {
    const totalTopics = topics.length;
    const masteredTopics = topics.filter((t) => t.status === 'Mastered').length;
    const completedTopics = topics.filter((t) => t.status === 'Completed' || t.status === 'Mastered').length;
    const inProgressTopics = topics.filter((t) => t.status === 'In Progress').length;
    const notStartedTopics = topics.filter((t) => t.status === 'Not Started').length;
    const progressPercentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    return {
      totalTopics,
      completedTopics,
      masteredTopics,
      inProgressTopics,
      notStartedTopics,
      progressPercentage,
    };
  }

  /**
   * Create a new subject for the authenticated user
   */
  async createSubject(userId, data) {
    const { name, description = '', topicsText = '', color = '#3b82f6' } = data;

    // Check duplicate name for this specific user
    const existing = await Subject.findOne({ user: userId, name: new RegExp(`^${name.trim()}$`, 'i') });
    if (existing) {
      const error = new Error(`A subject with the name "${name.trim()}" already exists in your account.`);
      error.statusCode = 409;
      throw error;
    }

    const subject = await Subject.create({
      user: userId,
      name: name.trim(),
      description: description ? description.trim() : (topicsText ? topicsText.trim().slice(0, 500) : ''),
      color: color ? color.trim() : '#3b82f6',
    });

    // If user provided topics text (unit-wise or simply topics), parse and create them immediately
    let createdTopicsCount = 0;
    const rawTopicsInput = topicsText || description;
    if (rawTopicsInput && rawTopicsInput.trim().length > 0) {
      try {
        const topicService = require('./topic.service');
        const extracted = topicService.parseSyllabusRules(rawTopicsInput);
        if (extracted && extracted.length > 0) {
          const bulkPayload = extracted.map((item, idx) => ({
            title: item.title,
            description: item.description || '',
            priority: item.priority || 'Medium',
            unit: item.unit || '',
            subtopics: item.subtopics || [],
            order: idx + 1,
            status: 'Not Started',
          }));
          await Topic.insertMany(
            bulkPayload.map((t) => ({
              ...t,
              user: userId,
              subject: subject._id,
            }))
          );
          createdTopicsCount = bulkPayload.length;
        }
      } catch (topicErr) {
        console.error('[SubjectService] Auto-created topics from text error:', topicErr);
      }
    }

    return subject.toSafeObject({
      topicsCount: createdTopicsCount,
      completedCount: 0,
      masteredCount: 0,
      progressPercentage: 0,
    });
  }

  /**
   * Get all subjects for the authenticated user with real aggregated topic metrics
   */
  async getSubjects(userId) {
    const subjects = await Subject.find({ user: userId }).sort({ createdAt: -1 });

    if (subjects.length === 0) {
      return [];
    }

    const subjectIds = subjects.map((s) => s._id);

    // Aggregate topics for all user subjects in one query
    const [topicStats, allTopics] = await Promise.all([
      Topic.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), subject: { $in: subjectIds } } },
      {
        $group: {
          _id: '$subject',
          totalTopics: { $sum: 1 },
          completedTopics: {
            $sum: {
              $cond: [{ $in: ['$status', ['Completed', 'Mastered']] }, 1, 0],
            },
          },
          masteredTopics: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Mastered'] }, 1, 0],
            },
          },
          inProgressTopics: {
            $sum: {
              $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0],
            },
          },
        },
      },
    ]),
    Topic.find({ user: userId, subject: { $in: subjectIds } }).sort({ order: 1, createdAt: 1 }),
  ]);

    const statsMap = {};
    topicStats.forEach((stat) => {
      statsMap[stat._id.toString()] = stat;
    });

    const topicsBySubject = {};
    allTopics.forEach((t) => {
      const sId = t.subject.toString();
      if (!topicsBySubject[sId]) topicsBySubject[sId] = [];
      topicsBySubject[sId].push(t.toSafeObject());
    });

    return subjects.map((subj) => {
      const stats = statsMap[subj._id.toString()] || {
        totalTopics: 0,
        completedTopics: 0,
        masteredTopics: 0,
        inProgressTopics: 0,
      };

      const progressPercentage =
        stats.totalTopics > 0 ? Math.round((stats.completedTopics / stats.totalTopics) * 100) : 0;

      return subj.toSafeObject({
        topicsCount: stats.totalTopics,
        completedCount: stats.completedTopics,
        masteredCount: stats.masteredTopics,
        inProgressCount: stats.inProgressTopics,
        progressPercentage,
        topics: topicsBySubject[subj._id.toString()] || [],
      });
    });
  }

  /**
   * Get single subject by ID ensuring ownership, including full topic list and progress
   */
  async getSubjectById(userId, subjectId) {
    const subject = await Subject.findOne({ _id: subjectId, user: userId });
    if (!subject) {
      const error = new Error('Subject not found');
      error.statusCode = 404;
      throw error;
    }

    const topics = await Topic.find({ subject: subjectId, user: userId }).sort({ order: 1, createdAt: 1 });
    const progress = this.calculateProgress(topics);

    return {
      ...subject.toSafeObject(),
      progress,
      topics: topics.map((t) => t.toSafeObject()),
    };
  }

  /**
   * Update an owned subject
   */
  async updateSubject(userId, subjectId, updateData) {
    const subject = await Subject.findOne({ _id: subjectId, user: userId });
    if (!subject) {
      const error = new Error('Subject not found');
      error.statusCode = 404;
      throw error;
    }

    if (updateData.name && updateData.name.trim() !== subject.name) {
      const existing = await Subject.findOne({
        user: userId,
        _id: { $ne: subjectId },
        name: new RegExp(`^${updateData.name.trim()}$`, 'i'),
      });
      if (existing) {
        const error = new Error(`A subject with the name "${updateData.name.trim()}" already exists in your account.`);
        error.statusCode = 409;
        throw error;
      }
      subject.name = updateData.name.trim();
    }

    if (updateData.description !== undefined) {
      subject.description = updateData.description.trim();
    }

    if (updateData.color !== undefined) {
      subject.color = updateData.color.trim();
    }

    await subject.save();

    // Fetch topics count to return accurate summary
    const topics = await Topic.find({ subject: subjectId, user: userId });
    const progress = this.calculateProgress(topics);

    return subject.toSafeObject({
      topicsCount: progress.totalTopics,
      completedCount: progress.completedTopics,
      masteredCount: progress.masteredTopics,
      progressPercentage: progress.progressPercentage,
    });
  }

  /**
   * Delete an owned subject and cascade delete all its child topics
   */
  async deleteSubject(userId, subjectId) {
    const subject = await Subject.findOne({ _id: subjectId, user: userId });
    if (!subject) {
      const error = new Error('Subject not found');
      error.statusCode = 404;
      throw error;
    }

    // Delete all child topics belonging to this subject
    const deletedTopicsResult = await Topic.deleteMany({ subject: subjectId, user: userId });
    
    // Delete all study materials belonging to this subject
    const { StudyMaterial } = require('../models/StudyMaterial');
    const deletedMaterialsResult = await StudyMaterial.deleteMany({ subject: subjectId, user: userId });

    // Delete questions and quizzes belonging to this subject
    const { Question } = require('../models/Question');
    const { Quiz } = require('../models/Quiz');
    const deletedQuestionsResult = await Question.deleteMany({ subject: subjectId, user: userId });
    const deletedQuizzesResult = await Quiz.deleteMany({ subject: subjectId, user: userId });

    await Subject.deleteOne({ _id: subjectId, user: userId });

    return {
      id: subjectId,
      name: subject.name,
      deletedTopicsCount: deletedTopicsResult.deletedCount || 0,
      deletedMaterialsCount: deletedMaterialsResult.deletedCount || 0,
      deletedQuestionsCount: deletedQuestionsResult.deletedCount || 0,
      deletedQuizzesCount: deletedQuizzesResult.deletedCount || 0,
    };
  }
}

module.exports = new SubjectService();
