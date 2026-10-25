import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Target,
  Award,
  BookOpen,
  BookMarked,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  Info,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import analyticsService from '../../services/analyticsService';

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'subjects', 'topics', 'trends', 'recommendations'

  // Data states
  const [overview, setOverview] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [trends, setTrends] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ovRes, subRes, topRes, trRes, recRes] = await Promise.all([
        analyticsService.getOverview(),
        analyticsService.getSubjectPerformance(),
        analyticsService.getTopicPerformance(),
        analyticsService.getTrends(20),
        analyticsService.getRecommendations()
      ]);

      if (ovRes.success) setOverview(ovRes.data);
      if (subRes.success) setSubjects(subRes.data);
      if (topRes.success) setTopics(topRes.data);
      if (trRes.success) setTrends(trRes.data);
      if (recRes.success) setRecommendations(recRes.data);
    } catch (err) {
      console.error('[AnalyticsPage] Error loading analytics data:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-rose-100 text-rose-700 border border-rose-200">
            High Priority
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-amber-700 border border-amber-200">
            Medium Priority
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
            Reinforce
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
            Recommended
          </span>
        );
    }
  };

  const getReadinessBadge = (readiness) => {
    switch (readiness) {
      case 'Strong':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Strong
          </span>
        );
      case 'Proficient':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            Proficient
          </span>
        );
      case 'Needs Practice':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Needs Practice
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            Needs Data (&lt;3 Qs)
          </span>
        );
    }
  };

  return (
    <DashboardLayout title="Performance Analytics">
      <div className="space-y-6 pb-12">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-brand-600 rounded-3xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold tracking-wide uppercase mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Analytics & Recommendations
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Learning Performance & Smart Insights
              </h1>
              <p className="text-violet-100 text-sm mt-1 max-w-2xl leading-relaxed">
                Data-driven evaluations based on your real quiz attempts and saved mistakes. Understand your mastery levels without fabricated scores or estimates.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchAnalytics}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold backdrop-blur-xs border border-white/20 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-100 rounded-2xl border border-slate-200/80" />
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-sm">Failed to Load Performance Analytics</h3>
              <p className="text-xs text-rose-700 mt-1">{error}</p>
              <button
                onClick={fetchAnalytics}
                className="mt-3 px-3.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Content Loaded */}
        {!loading && !error && overview && (
          <>
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Card 1: Completed Quizzes */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Quiz Attempts
                  </span>
                  <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    {overview.totalAttempts}
                  </span>
                  <span className="text-xs text-slate-500">completed</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {overview.totalQuestions} questions evaluated
                </p>
              </div>

              {/* Card 2: Overall Accuracy */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Overall Accuracy
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <Target className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    {overview.overallAccuracy !== null ? `${overview.overallAccuracy}%` : 'N/A'}
                  </span>
                  <span className="text-xs text-slate-500">correct rate</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {overview.totalCorrect} / {overview.totalAnswered} answered questions
                </p>
              </div>

              {/* Card 3: Average Quiz Score */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Avg Quiz Score
                  </span>
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    {overview.averageQuizPercentage !== null ? `${overview.averageQuizPercentage}%` : 'N/A'}
                  </span>
                  <span className="text-xs text-slate-500">mean score</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Across all completed quizzes
                </p>
              </div>

              {/* Card 4: Mistakes Needing Review */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Open Mistakes
                  </span>
                  <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                    <BookMarked className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    {overview.mistakesNeedingReview}
                  </span>
                  <span className="text-xs text-rose-600 font-semibold">need review</span>
                </div>
                <Link
                  to="/mistake-book"
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 mt-1"
                >
                  Go to Mistake Book &rarr;
                </Link>
              </div>

              {/* Card 5: Assessed Subjects */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Curriculum Scope
                  </span>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    {overview.assessedSubjectsCount}
                  </span>
                  <span className="text-xs text-slate-500">subjects evaluated</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {subjects.length} total subjects registered
                </p>
              </div>
            </div>

            {/* Smart Recommendations Section */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Recommended Next Steps
                    </h2>
                    <p className="text-xs text-slate-500">
                      Personalized, explainable study recommendations calculated directly from your quiz accuracy and mistake log.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {recommendations.length} Active Recommendation{recommendations.length === 1 ? '' : 's'}
                </span>
              </div>

              {recommendations.length === 0 ? (
                <div className="py-10 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800">All Clear! No Pending Recommendations</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    You have no active mistakes needing review and all assessed topics show strong mastery. Keep taking new quizzes to challenge yourself!
                  </p>
                  <Link
                    to="/quizzes"
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition"
                  >
                    Browse Quizzes
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
                  {recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className="rounded-2xl border border-slate-200/90 p-5 bg-gradient-to-br from-white to-slate-50/50 flex flex-col justify-between hover:border-indigo-300 hover:shadow-xs transition"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            {rec.subjectName || 'Study Plan'}
                          </span>
                          {getPriorityBadge(rec.priority)}
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 leading-snug">
                          {rec.title}
                        </h3>

                        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                          {rec.description}
                        </p>

                        {/* Evidence & Explanation box */}
                        <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 flex items-start gap-2">
                          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>
                            <strong>Why this is recommended:</strong> {rec.reason}
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {rec.category.replace(/_/g, ' ')}
                        </span>
                        <Link
                          to={rec.actionUrl}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition"
                        >
                          {rec.actionLabel}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Navigation Tabs for detailed drill-downs */}
            <div className="flex items-center gap-2 border-b border-slate-200">
              <button
                onClick={() => setActiveTab('all')}
                className={`pb-3 px-4 text-xs font-bold border-b-2 transition cursor-pointer ${
                  activeTab === 'all'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                All Analytics
              </button>
              <button
                onClick={() => setActiveTab('subjects')}
                className={`pb-3 px-4 text-xs font-bold border-b-2 transition cursor-pointer ${
                  activeTab === 'subjects'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Subject-wise ({subjects.length})
              </button>
              <button
                onClick={() => setActiveTab('topics')}
                className={`pb-3 px-4 text-xs font-bold border-b-2 transition cursor-pointer ${
                  activeTab === 'topics'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Topic Performance ({topics.length})
              </button>
              <button
                onClick={() => setActiveTab('trends')}
                className={`pb-3 px-4 text-xs font-bold border-b-2 transition cursor-pointer ${
                  activeTab === 'trends'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Score Trends ({trends.length})
              </button>
            </div>

            {/* Section: Subject-wise Performance */}
            {(activeTab === 'all' || activeTab === 'subjects') && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Subject-wise Performance Breakdown
                      </h2>
                      <p className="text-xs text-slate-500">
                        Comparison of attempts, average quiz scores, accuracy, and unresolved mistakes across registered subjects.
                      </p>
                    </div>
                  </div>
                </div>

                {subjects.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No subjects registered yet. Create subjects in Subject Management.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjects.map((sub) => (
                      <div
                        key={sub.subjectId}
                        className="rounded-2xl border border-slate-200/90 p-5 bg-white hover:border-slate-300 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {sub.subjectCode || 'SUBJECT'}
                            </span>
                            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                              {sub.subjectName}
                            </h3>
                          </div>
                          {sub.isAssessed ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Assessed
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                              Not Assessed
                            </span>
                          )}
                        </div>

                        {/* Metrics Bar */}
                        <div className="mt-4 space-y-3">
                          {/* Accuracy Bar */}
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-slate-500">Question Accuracy</span>
                              <span className="font-bold text-slate-800">
                                {sub.accuracy !== null ? `${sub.accuracy}%` : 'N/A'}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  sub.accuracy === null
                                    ? 'bg-slate-300'
                                    : sub.accuracy >= 75
                                    ? 'bg-emerald-500'
                                    : sub.accuracy >= 50
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${sub.accuracy !== null ? Math.min(sub.accuracy, 100) : 0}%` }}
                              />
                            </div>
                          </div>

                          {/* Average Quiz Score */}
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-slate-500">Average Quiz Score</span>
                              <span className="font-bold text-slate-800">
                                {sub.averageScore !== null ? `${sub.averageScore}%` : 'N/A'}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-violet-600 rounded-full"
                                style={{ width: `${sub.averageScore !== null ? Math.min(sub.averageScore, 100) : 0}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Counts summary footer */}
                        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                          <div className="p-1.5 rounded-lg bg-slate-50">
                            <p className="text-[10px] text-slate-400 font-medium">Attempts</p>
                            <p className="text-xs font-bold text-slate-800">{sub.attemptsCount}</p>
                          </div>
                          <div className="p-1.5 rounded-lg bg-slate-50">
                            <p className="text-[10px] text-slate-400 font-medium">Answered</p>
                            <p className="text-xs font-bold text-slate-800">{sub.questionsAnswered}</p>
                          </div>
                          <div className="p-1.5 rounded-lg bg-slate-50">
                            <p className="text-[10px] text-slate-400 font-medium">Mistakes</p>
                            <p className={`text-xs font-bold ${sub.mistakesCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                              {sub.mistakesCount}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <Link
                            to={`/subjects/${sub.subjectId}`}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                          >
                            View Subject &rarr;
                          </Link>
                          {sub.attemptsCount === 0 && (
                            <Link
                              to="/quizzes"
                              className="text-xs font-semibold text-violet-600 hover:text-violet-800"
                            >
                              Take Quiz &rarr;
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Section: Topic Performance & Readiness Matrix */}
            {(activeTab === 'all' || activeTab === 'topics') && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Topic Performance & Readiness Matrix
                      </h2>
                      <p className="text-xs text-slate-500">
                        Objective readiness classification requiring at least 3 evaluated questions per topic to eliminate single-question bias.
                      </p>
                    </div>
                  </div>
                </div>

                {topics.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No topic performance data recorded yet. Complete quizzes to populate topic readiness.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/60">
                          <th className="py-3 px-4">Topic</th>
                          <th className="py-3 px-4">Subject</th>
                          <th className="py-3 px-4 text-center">Questions Answered</th>
                          <th className="py-3 px-4 text-center">Correct</th>
                          <th className="py-3 px-4 text-center">Accuracy</th>
                          <th className="py-3 px-4 text-center">Readiness Status</th>
                          <th className="py-3 px-4 text-center">Open Mistakes</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {topics.map((t) => (
                          <tr key={t.topicId} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4 font-bold text-slate-900">
                              {t.topicName}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {t.subjectName}
                            </td>
                            <td className="py-3 px-4 text-center text-slate-700">
                              {t.questionsAnswered}
                            </td>
                            <td className="py-3 px-4 text-center text-slate-700 font-semibold">
                              {t.correctCount}
                            </td>
                            <td className="py-3 px-4 text-center font-bold">
                              {t.accuracy !== null ? (
                                <span
                                  className={
                                    t.accuracy >= 80
                                      ? 'text-emerald-600'
                                      : t.accuracy >= 60
                                      ? 'text-blue-600'
                                      : 'text-rose-600'
                                  }
                                >
                                  {t.accuracy}%
                                </span>
                              ) : (
                                <span className="text-slate-400">N/A</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {getReadinessBadge(t.readiness)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {t.mistakesCount > 0 ? (
                                <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                  {t.mistakesCount}
                                </span>
                              ) : (
                                <span className="text-slate-400">0</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {t.mistakesCount > 0 ? (
                                <Link
                                  to="/mistake-book"
                                  className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                                >
                                  Review
                                </Link>
                              ) : t.readiness === 'Needs Practice' ? (
                                <Link
                                  to="/quizzes"
                                  className="text-xs font-semibold text-amber-600 hover:text-amber-800"
                                >
                                  Practice
                                </Link>
                              ) : (
                                <Link
                                  to="/quizzes"
                                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                                >
                                  Quiz
                                </Link>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Section: Chronological Score Trends */}
            {(activeTab === 'all' || activeTab === 'trends') && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Quiz Score History & Evaluation Trends
                      </h2>
                      <p className="text-xs text-slate-500">
                        Chronological results from your completed quiz evaluations with real timestamps and percentage scores.
                      </p>
                    </div>
                  </div>
                </div>

                {trends.length === 0 ? (
                  <div className="py-12 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                    <HelpCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-slate-800">No Quiz Attempts Recorded</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Complete a quiz to generate your historical score trend timeline.
                    </p>
                    <Link
                      to="/quizzes"
                      className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
                    >
                      Browse Quizzes
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {trends.map((item, idx) => (
                      <div
                        key={item.attemptId || idx}
                        className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                            #{idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold text-slate-900">
                                {item.quizTitle}
                              </h3>
                              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                {item.subjectName}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {item.completedAt ? new Date(item.completedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'Recently'}
                              </span>
                              <span>&bull;</span>
                              <span>
                                {item.correctAnswers} / {item.totalQuestions} questions correct
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 self-end sm:self-center">
                          {/* Visual progress mini-bar */}
                          <div className="w-24 sm:w-32 bg-slate-100 h-2.5 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className={`h-full rounded-full ${
                                item.scorePercentage >= (item.passingPercentage || 60)
                                  ? 'bg-emerald-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(item.scorePercentage, 100)}%` }}
                            />
                          </div>

                          <div className="text-right">
                            <span className="text-base font-black text-slate-900">
                              {item.scorePercentage}%
                            </span>
                            <div className="mt-0.5">
                              {item.isPassed ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  Passed
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800">
                                  Failed
                                </span>
                              )}
                            </div>
                          </div>

                          <Link
                            to={`/quiz-results/${item.attemptId}`}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                            title="View Quiz Results"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
