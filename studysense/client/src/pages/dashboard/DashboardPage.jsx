import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, CheckCircle2, HelpCircle, Award, FileText, Bookmark, Link as LinkIcon, BookMarked, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import dashboardService from '../../services/dashboardService';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import WelcomeSection from '../../components/dashboard/WelcomeSection';
import SummaryCard from '../../components/dashboard/SummaryCard';
import SubjectOverviewSection from '../../components/dashboard/SubjectOverviewSection';
import QuizPerformanceSection from '../../components/dashboard/QuizPerformanceSection';
import RevisionOverviewSection from '../../components/dashboard/RevisionOverviewSection';
import RecentActivitySection from '../../components/dashboard/RecentActivitySection';
import DashboardSkeleton from '../../components/dashboard/DashboardSkeleton';
import DashboardError from '../../components/dashboard/DashboardError';

const DashboardPage = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const fetchDashboardData = useCallback(async (isRetry = false) => {
    if (isRetry) {
      setIsRetrying(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await dashboardService.getSummary();
      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
        throw new Error(response.message || 'Failed to retrieve dashboard metrics');
      }
    } catch (err) {
      console.error('[DashboardPage] Error fetching dashboard data:', err);
      setError(err);
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const summary = dashboardData?.summary || {};

  return (
    <DashboardLayout title="Dashboard">
      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <DashboardError
          error={error}
          onRetry={() => fetchDashboardData(true)}
          isRetrying={isRetrying}
        />
      ) : (
        <div className="space-y-6">
          {/* Welcome Greeting Banner */}
          <WelcomeSection user={dashboardData?.user || user} />

          {/* 4 Summary Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              title="Total Subjects"
              value={summary.subjectsCount ?? 0}
              subtitle="Enrolled curriculum"
              icon={BookOpen}
              accentColor="brand"
              statusBadge={summary.subjectsCount > 0 ? `${summary.subjectsCount} Active` : 'Module 3'}
            />

            <SummaryCard
              title="Topics Mastered"
              value={summary.topicsMastered ?? 0}
              subtitle="Verified competencies"
              icon={CheckCircle2}
              accentColor="emerald"
              statusBadge={summary.topicsMastered > 0 ? 'Mastered' : 'Curriculum Ready'}
            />

            <SummaryCard
              title="Quizzes Completed"
              value={summary.quizzesCompleted ?? 0}
              subtitle="Topic assessments"
              icon={HelpCircle}
              accentColor="amber"
              statusBadge={summary.quizzesCompleted > 0 ? `${summary.quizzesCompleted} Taken` : 'Module 5 Active'}
            />

            <SummaryCard
              title="Average Quiz Score"
              value={summary.averageQuizScore}
              displayValue={summary.averageQuizScore !== null ? summary.averageQuizScore : 'N/A'}
              unit="%"
              subtitle="Knowledge accuracy"
              icon={Award}
              accentColor="violet"
              statusBadge={summary.averageQuizScore !== null ? 'Evaluated' : 'Awaiting Quizzes'}
            />
          </div>

          {/* Module 4: Study Materials & Quick Notes Banner */}
          <div className="bg-gradient-to-r from-indigo-50 via-white to-indigo-50/30 p-5 rounded-2xl border border-indigo-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
                <FileText size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">Study Materials & Notes</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Module 4</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Organize lecture notes and learning references across your enrolled subjects.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 font-medium bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  <FileText size={13} className="text-indigo-600" />
                  <strong>{summary.notesCount ?? 0}</strong> Notes
                </span>
                <span className="inline-flex items-center gap-1 font-medium bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  <LinkIcon size={13} className="text-emerald-600" />
                  <strong>{summary.resourcesCount ?? 0}</strong> Links
                </span>
                <span className="inline-flex items-center gap-1 font-medium bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  <Bookmark size={13} className="text-amber-500" />
                  <strong>{summary.favoriteMaterialsCount ?? 0}</strong> Starred
                </span>
              </div>

              <Link
                to="/materials"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
              >
                Open Materials
              </Link>
            </div>
          </div>

          {/* Module 6: Mistake Book Callout (when student has saved mistakes) */}
          {(summary.mistakesNeedingReview > 0 || summary.mistakesCorrected > 0) && (
            <div className="bg-gradient-to-r from-rose-50 via-white to-rose-50/30 p-5 rounded-2xl border border-rose-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-sm shrink-0">
                  <BookMarked size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">Mistake Book & Practice</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">Module 6</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Target missed quiz questions, write personal notes, and test yourself with the Practice Engine.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1 font-medium bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <strong>{summary.mistakesNeedingReview ?? 0}</strong> Need Review
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <strong>{summary.mistakesCorrected ?? 0}</strong> Corrected
                  </span>
                </div>

                <Link
                  to="/mistake-book"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
                >
                  Review Mistakes
                </Link>
              </div>
            </div>
          )}

          {/* Module 7: Performance Analytics Callout Banner */}
          <div className="bg-gradient-to-r from-violet-50 via-white to-violet-50/30 p-5 rounded-2xl border border-violet-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-sm shrink-0">
                <BarChart3 size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">Performance Analytics & Recommendations</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">Module 7</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Track topic mastery, evaluation accuracy, and data-driven recommendations tailored to your quiz results.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 font-medium bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  <Award size={13} className="text-violet-600" />
                  Avg Score: <strong>{summary.averageQuizScore !== null ? `${summary.averageQuizScore}%` : 'N/A'}</strong>
                </span>
                <span className="inline-flex items-center gap-1 font-medium bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  <HelpCircle size={13} className="text-blue-600" />
                  <strong>{summary.quizzesCompleted ?? 0}</strong> Evaluated
                </span>
              </div>

              <Link
                to="/analytics"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
              >
                View Analytics
              </Link>
            </div>
          </div>

          {/* Subjects & Quiz Performance 2-Column Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SubjectOverviewSection subjects={dashboardData?.subjectProgress || []} />
            <QuizPerformanceSection
              quizData={dashboardData?.quizPerformance || []}
              quizzesCompleted={summary.quizzesCompleted ?? 0}
              averageScore={summary.averageQuizScore}
            />
          </div>

          {/* Revisions & Recent Activity 2-Column Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevisionOverviewSection revisions={dashboardData?.upcomingRevisions || []} />
            <RecentActivitySection activities={dashboardData?.recentActivity || []} />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DashboardPage;
