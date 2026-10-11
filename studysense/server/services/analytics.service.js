const mongoose = require('mongoose');
const { QuizAttempt } = require('../models/QuizAttempt');
const { Mistake } = require('../models/Mistake');
const Subject = require('../models/Subject');
const { Topic } = require('../models/Topic');

class AnalyticsService {
  /**
   * Overall performance summary
   */
  async getOverview(userId) {
    const attempts = await QuizAttempt.find({ user: userId });

    const totalAttempts = attempts.length;
    let totalQuestions = 0;
    let totalAnswered = 0;
    let totalCorrect = 0;
    let totalUnanswered = 0;
    let sumPercentages = 0;

    const subjectSet = new Set();

    attempts.forEach((att) => {
      totalQuestions += att.totalQuestions || 0;
      totalCorrect += att.correctAnswers || 0;
      totalUnanswered += att.unansweredCount || 0;
      sumPercentages += att.percentage || 0;
      if (att.subject) {
        subjectSet.add(att.subject.toString());
      }
    });

    totalAnswered = totalQuestions - totalUnanswered;

    // Accuracy: correct answers out of answered questions
    const overallAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    // Average quiz score: arithmetic mean of completed attempt percentages
    const averageQuizPercentage = totalAttempts > 0 ? Math.round(sumPercentages / totalAttempts) : 0;

    // Mistake counts from Module 6
    const [mistakesNeedingReview, mistakesCorrected] = await Promise.all([
      Mistake.countDocuments({ user: userId, status: { $in: ['needs_review', 'practicing'] } }),
      Mistake.countDocuments({ user: userId, status: 'corrected' }),
    ]);

    return {
      totalAttempts,
      totalQuestions,
      totalAnswered,
      totalCorrect,
      totalUnanswered,
      overallAccuracy,
      averageQuizPercentage,
      assessedSubjectsCount: subjectSet.size,
      mistakesNeedingReview,
      mistakesCorrected,
    };
  }

  /**
   * Subject-wise performance aggregation
   */
  async getSubjectPerformance(userId) {
    const subjects = await Subject.find({ user: userId }).select('name color');
    const attempts = await QuizAttempt.find({ user: userId }).populate('subject', 'name color');

    // Aggregate attempts by subject
    const subjectStatsMap = {};

    attempts.forEach((att) => {
      const subId = att.subject?._id ? att.subject._id.toString() : att.subject?.toString();
      if (!subId) return;

      if (!subjectStatsMap[subId]) {
        subjectStatsMap[subId] = {
          subjectId: subId,
          subjectName: att.subject?.name || 'Unknown Subject',
          subjectColor: att.subject?.color || '#6366f1',
          attemptsCount: 0,
          totalQuestions: 0,
          answeredQuestions: 0,
          correctAnswers: 0,
          sumPercentages: 0,
        };
      }

      const st = subjectStatsMap[subId];
      st.attemptsCount += 1;
      st.totalQuestions += att.totalQuestions || 0;
      const answered = (att.totalQuestions || 0) - (att.unansweredCount || 0);
      st.answeredQuestions += answered;
      st.correctAnswers += att.correctAnswers || 0;
      st.sumPercentages += att.percentage || 0;
    });

    // Query mistake counts by subject
    const mistakeCountsBySubject = await Mistake.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), status: { $in: ['needs_review', 'practicing'] } } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
    ]);

    const mistakeMap = {};
    mistakeCountsBySubject.forEach((m) => {
      mistakeMap[m._id.toString()] = m.count;
    });

    // Format all user subjects, distinguishing assessed vs unassessed
    const results = subjects.map((sub) => {
      const subIdStr = sub._id.toString();
      const stat = subjectStatsMap[subIdStr];

      if (stat && stat.attemptsCount > 0) {
        const accuracy = stat.answeredQuestions > 0 ? Math.round((stat.correctAnswers / stat.answeredQuestions) * 100) : 0;
        const averagePercentage = Math.round(stat.sumPercentages / stat.attemptsCount);

        return {
          subjectId: subIdStr,
          subjectName: sub.name,
          subjectColor: sub.color || '#6366f1',
          isAssessed: true,
          attemptsCount: stat.attemptsCount,
          totalQuestions: stat.totalQuestions,
          answeredQuestions: stat.answeredQuestions,
          correctAnswers: stat.correctAnswers,
          accuracy,
          averagePercentage,
          mistakesNeedingReview: mistakeMap[subIdStr] || 0,
        };
      } else {
        return {
          subjectId: subIdStr,
          subjectName: sub.name,
          subjectColor: sub.color || '#6366f1',
          isAssessed: false,
          attemptsCount: 0,
          totalQuestions: 0,
          answeredQuestions: 0,
          correctAnswers: 0,
          accuracy: null,
          averagePercentage: null,
          mistakesNeedingReview: mistakeMap[subIdStr] || 0,
        };
      }
    });

    return results;
  }

  /**
   * Topic-wise performance aggregation
   */
  async getTopicPerformance(userId) {
    const attempts = await QuizAttempt.find({ user: userId })
      .populate('subject', 'name color')
      .select('subject results');

    const topicStatsMap = {};

    attempts.forEach((att) => {
      if (!Array.isArray(att.results)) return;

      att.results.forEach((resItem) => {
        if (!resItem.topic) return;
        const topicIdStr = resItem.topic.toString();

        if (!topicStatsMap[topicIdStr]) {
          topicStatsMap[topicIdStr] = {
            topicId: topicIdStr,
            subjectId: att.subject?._id ? att.subject._id.toString() : null,
            subjectName: att.subject?.name || 'Curriculum Subject',
            subjectColor: att.subject?.color || '#6366f1',
            questionsAnswered: 0,
            correctAnswers: 0,
          };
        }

        const stat = topicStatsMap[topicIdStr];
        // Only count if answered
        if (resItem.selectedOptionId !== null) {
          stat.questionsAnswered += 1;
          if (resItem.isCorrect) {
            stat.correctAnswers += 1;
          }
        }
      });
    });

    // Populate real topic names
    const topicIds = Object.keys(topicStatsMap);
    const topics = await Topic.find({ _id: { $in: topicIds }, user: userId }).select('title status');
    const topicTitleMap = {};
    topics.forEach((t) => {
      topicTitleMap[t._id.toString()] = { title: t.title, status: t.status };
    });

    // Count open mistakes per topic
    const mistakeCountsByTopic = await Mistake.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), status: { $in: ['needs_review', 'practicing'] } } },
      { $group: { _id: '$topic', count: { $sum: 1 } } },
    ]);
    const mistakeTopicMap = {};
    mistakeCountsByTopic.forEach((m) => {
      if (m._id) mistakeTopicMap[m._id.toString()] = m.count;
    });

    const topicResults = [];

    for (const topicId of topicIds) {
      const st = topicStatsMap[topicId];
      const topicInfo = topicTitleMap[topicId] || { title: 'Unknown Topic', status: 'In Progress' };
      const accuracy = st.questionsAnswered > 0 ? Math.round((st.correctAnswers / st.questionsAnswered) * 100) : 0;
      const mistakesCount = mistakeTopicMap[topicId] || 0;

      // Classify readiness / mastery based on questions answered and accuracy
      let readiness = 'Needs Data';
      if (st.questionsAnswered >= 3) {
        if (accuracy >= 80) readiness = 'Strong';
        else if (accuracy >= 60) readiness = 'Proficient';
        else readiness = 'Needs Practice';
      }

      topicResults.push({
        topicId,
        topicTitle: topicInfo.title,
        subjectId: st.subjectId,
        subjectName: st.subjectName,
        subjectColor: st.subjectColor,
        questionsAnswered: st.questionsAnswered,
        correctAnswers: st.correctAnswers,
        accuracy,
        readiness,
        mistakesNeedingReview: mistakesCount,
      });
    }

    // Sort by accuracy ascending (weakest topics first)
    topicResults.sort((a, b) => a.accuracy - b.accuracy);
    return topicResults;
  }

  /**
   * Chronological score trends
   */
  async getTrends(userId, limit = 15) {
    const attempts = await QuizAttempt.find({ user: userId })
      .populate('subject', 'name color')
      .sort({ completedAt: 1 }) // Chronological order
      .limit(limit);

    return attempts.map((att) => ({
      attemptId: att._id.toString(),
      quizTitle: att.quizTitleSnapshot,
      subjectName: att.subject?.name || 'General Subject',
      subjectColor: att.subject?.color || '#6366f1',
      percentage: att.percentage,
      score: att.score,
      totalQuestions: att.totalQuestions,
      completedAt: att.completedAt,
    }));
  }

  /**
   * Smart Explainable Recommendations Engine
   * Deterministic rule-based engine using real persisted data.
   */
  async getRecommendations(userId) {
    const recommendations = [];

    // 1. Revisit mistakes needing review (Module 6)
    const mistakesNeedingReview = await Mistake.find({
      user: userId,
      status: { $in: ['needs_review', 'practicing'] },
    }).populate('subject', 'name');

    if (mistakesNeedingReview.length > 0) {
      // Group by subject
      const subCountMap = {};
      mistakesNeedingReview.forEach((m) => {
        const subName = m.subject?.name || 'General';
        subCountMap[subName] = (subCountMap[subName] || 0) + 1;
      });

      const topSub = Object.keys(subCountMap)[0];
      recommendations.push({
        id: 'rec_mistakes',
        category: 'Review Mistakes',
        priority: 'high',
        title: `Clear ${mistakesNeedingReview.length} Question Misconceptions`,
        description: `You have ${mistakesNeedingReview.length} question(s) marked for review, especially in ${topSub}. Re-testing incorrect answers builds retention.`,
        supportedBy: `${mistakesNeedingReview.length} uncorrected mistake(s) in Mistake Book`,
        actionText: 'Open Mistake Book',
        actionUrl: '/mistake-book',
      });
    }

    // 2. Identify weak topics (accuracy < 60% with at least 3 answered questions)
    const topicPerformance = await this.getTopicPerformance(userId);
    const weakTopics = topicPerformance.filter((t) => t.questionsAnswered >= 3 && t.accuracy < 60);

    if (weakTopics.length > 0) {
      const weakest = weakTopics[0];
      recommendations.push({
        id: `rec_weak_${weakest.topicId}`,
        category: 'Practice Weak Topic',
        priority: 'high',
        title: `Reinforce ${weakest.topicTitle}`,
        description: `Your accuracy in ${weakest.topicTitle} is currently ${weakest.accuracy}% across ${weakest.questionsAnswered} questions. Review notes and take a practice quiz.`,
        supportedBy: `${weakest.accuracy}% accuracy in ${weakest.questionsAnswered} assessment questions`,
        actionText: 'Review Notes & Practice',
        actionUrl: '/quizzes',
      });
    }

    // 3. Revisit unassessed subjects
    const subjectPerformance = await this.getSubjectPerformance(userId);
    const unassessedSubjects = subjectPerformance.filter((s) => !s.isAssessed);

    if (unassessedSubjects.length > 0) {
      const nextSub = unassessedSubjects[0];
      recommendations.push({
        id: `rec_unassessed_${nextSub.subjectId}`,
        category: 'Take Assessment',
        priority: 'medium',
        title: `Test Knowledge in ${nextSub.subjectName}`,
        description: `You have enrolled in ${nextSub.subjectName} but haven't taken any quizzes for it yet. Build a quiz from your question bank to assess your baseline.`,
        supportedBy: `0 quiz attempts recorded for ${nextSub.subjectName}`,
        actionText: 'Go to Quizzes',
        actionUrl: '/quizzes',
      });
    }

    // 4. Recognize improvement or strong areas
    const strongTopics = topicPerformance.filter((t) => t.questionsAnswered >= 3 && t.accuracy >= 80);
    if (strongTopics.length > 0) {
      const best = strongTopics[0];
      recommendations.push({
        id: `rec_strong_${best.topicId}`,
        category: 'High Proficiency',
        priority: 'low',
        title: `Strong Proficiency in ${best.topicTitle}`,
        description: `You achieved ${best.accuracy}% accuracy in ${best.topicTitle}. Maintain this momentum by expanding into more advanced topics.`,
        supportedBy: `${best.accuracy}% accuracy verified across ${best.questionsAnswered} questions`,
        actionText: 'View Subjects',
        actionUrl: '/subjects',
      });
    }

    // 5. Empty-data guidance
    if (recommendations.length === 0) {
      recommendations.push({
        id: 'rec_empty',
        category: 'Getting Started',
        priority: 'medium',
        title: 'Start Assessing to Unlock Performance Insights',
        description: 'Complete quizzes and test yourself on your question bank to receive personalized, data-driven learning recommendations.',
        supportedBy: 'No quiz attempts recorded yet',
        actionText: 'Create or Take Quiz',
        actionUrl: '/quizzes',
      });
    }

    return recommendations;
  }
}

module.exports = new AnalyticsService();
