const mongoose = require('mongoose');
const User = require('../models/User');
const Subject = require('../models/Subject');
const { Topic } = require('../models/Topic');

/**
 * Service for aggregating authenticated user's dashboard data.
 * Module 2 & 3: Main Dashboard with real Subject & Topic integration.
 */
class DashboardService {
  /**
   * Retrieve real dashboard overview and metrics for an authenticated student
   * @param {string} userId - Authenticated user's MongoDB ObjectId
   * @returns {Promise<Object>} Dashboard summary payload
   */
  async getDashboardSummary(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      const error = new Error('User account not found');
      error.statusCode = 404;
      throw error;
    }

    const hasQuizModel = Boolean(mongoose.models.Quiz);
    const hasRevisionModel = Boolean(mongoose.models.Revision);

    let subjectsCount = 0;
    let topicsMastered = 0;
    let quizzesCompleted = 0;
    let averageQuizScore = null;
    let notesCount = 0;
    let resourcesCount = 0;
    let favoriteMaterialsCount = 0;
    let subjectProgress = [];
    let quizPerformance = [];
    let upcomingRevisions = [];
    let recentActivity = [];

    // Query real Subject and Topic records for the authenticated user
    try {
      subjectsCount = await Subject.countDocuments({ user: userId });
      topicsMastered = await Topic.countDocuments({ user: userId, status: 'Mastered' });

      // Study materials metrics
      const { StudyMaterial } = require('../models/StudyMaterial');
      [notesCount, resourcesCount, favoriteMaterialsCount] = await Promise.all([
        StudyMaterial.countDocuments({ user: userId, type: 'note' }),
        StudyMaterial.countDocuments({ user: userId, type: 'resource' }),
        StudyMaterial.countDocuments({ user: userId, isFavorite: true }),
      ]);

      // Fetch user's subjects with calculated topic progress
      const subjects = await Subject.find({ user: userId }).sort({ createdAt: -1 }).limit(6);
      if (subjects.length > 0) {
        const subjectIds = subjects.map((s) => s._id);
        const stats = await Topic.aggregate([
          { $match: { user: new mongoose.Types.ObjectId(userId), subject: { $in: subjectIds } } },
          {
            $group: {
              _id: '$subject',
              totalTopics: { $sum: 1 },
              completedTopics: {
                $sum: { $cond: [{ $in: ['$status', ['Completed', 'Mastered']] }, 1, 0] },
              },
              masteredTopics: {
                $sum: { $cond: [{ $eq: ['$status', 'Mastered'] }, 1, 0] },
              },
            },
          },
        ]);

        const statsMap = {};
        stats.forEach((st) => {
          statsMap[st._id.toString()] = st;
        });

        subjectProgress = subjects.map((sub) => {
          const st = statsMap[sub._id.toString()] || { totalTopics: 0, completedTopics: 0, masteredTopics: 0 };
          const progressPercentage = st.totalTopics > 0 ? Math.round((st.completedTopics / st.totalTopics) * 100) : 0;
          return {
            id: sub._id.toString(),
            name: sub.name,
            color: sub.color || '#3b82f6',
            topicsCount: st.totalTopics,
            completedCount: st.completedTopics,
            masteredCount: st.masteredTopics,
            progressPercentage,
          };
        });
      }

      // Recent Activity from recent topics, subjects, and materials
      const [recentTopics, recentMaterials] = await Promise.all([
        Topic.find({ user: userId }).sort({ updatedAt: -1 }).limit(3).populate('subject', 'name'),
        StudyMaterial.find({ user: userId }).sort({ updatedAt: -1 }).limit(3).populate('subject', 'name'),
      ]);

      const activities = [];
      recentTopics.forEach((top) => {
        activities.push({
          id: `top_${top._id}`,
          title: `Topic "${top.title}" updated (${top.status}) in ${top.subject?.name || 'Subject'}`,
          timestamp: top.updatedAt,
        });
      });
      recentMaterials.forEach((mat) => {
        activities.push({
          id: `mat_${mat._id}`,
          title: `${mat.type === 'note' ? 'Study Note' : 'Resource'} "${mat.title}" saved in ${mat.subject?.name || 'Subject'}`,
          timestamp: mat.updatedAt,
        });
      });

      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      recentActivity = activities.slice(0, 5);
    } catch (err) {
      console.warn('[DashboardService] Subject/Topic/Material query warning:', err.message);
    }

    // Module 5: Real Quiz and Attempt performance calculations
    try {
      const { Quiz } = require('../models/Quiz');
      const { QuizAttempt } = require('../models/QuizAttempt');

      quizzesCompleted = await QuizAttempt.countDocuments({ user: userId });
      if (quizzesCompleted > 0) {
        const avgResult = await QuizAttempt.aggregate([
          { $match: { user: new mongoose.Types.ObjectId(userId) } },
          { $group: { _id: null, avgScore: { $avg: '$percentage' } } },
        ]);
        if (avgResult.length > 0 && typeof avgResult[0].avgScore === 'number') {
          averageQuizScore = Math.round(avgResult[0].avgScore);
        }

        // Recent quiz attempts for quizPerformance list
        const recentAttempts = await QuizAttempt.find({ user: userId })
          .sort({ completedAt: -1 })
          .limit(5)
          .populate('subject', 'name color');

        quizPerformance = recentAttempts.map((att) => ({
          id: att._id.toString(),
          quizTitle: att.quizTitleSnapshot,
          subjectName: att.subject?.name || 'General Subject',
          subjectColor: att.subject?.color || '#3b82f6',
          score: att.score,
          totalQuestions: att.totalQuestions,
          percentage: att.percentage,
          completedAt: att.completedAt,
        }));
      }
    } catch (err) {
      console.warn('[DashboardService] Quiz / QuizAttempt query warning:', err.message);
    }

    // Query Revision tasks if registered in future module
    if (hasRevisionModel) {
      try {
        const Revision = mongoose.models.Revision;
        upcomingRevisions = await Revision.find({
          user: userId,
          completed: false,
        })
          .sort({ scheduledDate: 1 })
          .limit(5)
          .lean();
      } catch (err) {
        console.warn('[DashboardService] Revision query warning:', err.message);
      }
    }

    // Module 6: Real Mistake Book metrics
    let mistakesNeedingReview = 0;
    let mistakesCorrected = 0;
    try {
      const { Mistake } = require('../models/Mistake');
      [mistakesNeedingReview, mistakesCorrected] = await Promise.all([
        Mistake.countDocuments({ user: userId, status: { $in: ['needs_review', 'practicing'] } }),
        Mistake.countDocuments({ user: userId, status: 'corrected' }),
      ]);
    } catch (err) {
      console.warn('[DashboardService] Mistake query warning:', err.message);
    }

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        memberSince: user.createdAt,
      },
      summary: {
        subjectsCount,
        topicsMastered,
        quizzesCompleted,
        averageQuizScore,
        notesCount,
        resourcesCount,
        favoriteMaterialsCount,
        mistakesNeedingReview,
        mistakesCorrected,
      },
      subjectProgress,
      quizPerformance,
      upcomingRevisions,
      recentActivity,
      meta: {
        modulesImplemented: {
          module1_auth: true,
          module2_dashboard: true,
          module3_subjects_topics: true,
          module4_quizzes: false,
          module4_study_materials: true,
          module5_quizzes: true,
          module5_mistakes: false,
          module6_revisions: hasRevisionModel,
        },
      },
    };
  }
}

module.exports = new DashboardService();
