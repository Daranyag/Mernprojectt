import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Award,
  CheckCircle,
  XCircle,
  HelpCircle,
  ArrowLeft,
  RotateCcw,
  History,
  Folder,
  Loader2,
  AlertCircle,
  BookMarked,
} from 'lucide-react';
import { questionService } from '../../services/quizService';

const QuizResultsPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await questionService.getAttemptById(attemptId);
        if (res.data?.success) {
          setAttempt(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load quiz results:', err);
        setError(err.response?.data?.message || 'Failed to retrieve quiz evaluation results.');
      } finally {
        setLoading(false);
      }
    };

    fetchAttempt();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 size={36} className="text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading evaluation results...</p>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-2xl border border-rose-100 shadow-xs text-center space-y-4">
        <AlertCircle size={40} className="text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">Results Unavailable</h3>
        <p className="text-sm text-slate-600">{error || 'Could not find this assessment attempt.'}</p>
        <button
          onClick={() => navigate('/quizzes')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"
        >
          Return to Quizzes
        </button>
      </div>
    );
  }

  const scorePercentage = attempt.percentage;
  const isPassed = scorePercentage >= 60;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/quizzes')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          title="Back to Quizzes"
        >
          <ArrowLeft size={14} />
          <span>Back to Quizzes</span>
        </button>
        <Link
          to="/dashboard"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>

      {/* Top Banner with Score */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Evaluation Complete
              </span>
              {attempt.subject && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium text-white shadow-2xs"
                  style={{ backgroundColor: attempt.subject.color || '#6366F1' }}
                >
                  <Folder size={11} />
                  {attempt.subject.name}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-2">{attempt.quizTitleSnapshot}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Completed on{' '}
              {new Date(attempt.completedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {attempt.incorrectAnswers > 0 && (
              <Link
                to="/mistake-book"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-colors"
              >
                <BookMarked size={14} />
                Mistake Book ({attempt.incorrectAnswers})
              </Link>
            )}

            <Link
              to="/quizzes"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <History size={14} />
              Quizzes & History
            </Link>

            {attempt.quiz && (
              <button
                onClick={() => navigate(`/quizzes/${attempt.quiz._id || attempt.quiz}/take`)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <RotateCcw size={14} />
                Retry Quiz
              </button>
            )}
          </div>
        </div>

        {/* Score Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-xs font-medium text-slate-500">Score Percentage</span>
            <div
              className={`text-2xl font-black mt-1 ${
                isPassed ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {attempt.percentage}%
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-xs font-medium text-slate-500">Correct Answers</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {attempt.correctAnswers} / {attempt.totalQuestions}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-xs font-medium text-slate-500">Incorrect</span>
            <div className="text-2xl font-bold text-rose-600 mt-1">{attempt.incorrectAnswers}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
            <span className="text-xs font-medium text-slate-500">Unanswered</span>
            <div className="text-2xl font-bold text-slate-600 mt-1">{attempt.unansweredCount}</div>
          </div>
        </div>
      </div>

      {/* Per-Question Detailed Review */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 px-1">Detailed Question Review</h2>

        {attempt.results?.map((resItem, idx) => {
          const isCorrect = resItem.isCorrect;
          const isUnanswered = !resItem.selectedOptionId;

          return (
            <div
              key={idx}
              className={`p-6 bg-white rounded-2xl border transition-all space-y-4 ${
                isCorrect
                  ? 'border-emerald-200 shadow-2xs'
                  : isUnanswered
                  ? 'border-slate-200'
                  : 'border-rose-200 shadow-2xs'
              }`}
            >
              {/* Question Header Status */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Question {idx + 1}</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isCorrect
                      ? 'bg-emerald-100 text-emerald-800'
                      : isUnanswered
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {isCorrect ? (
                    <>
                      <CheckCircle size={13} /> Correct
                    </>
                  ) : isUnanswered ? (
                    <>
                      <HelpCircle size={13} /> Unanswered
                    </>
                  ) : (
                    <>
                      <XCircle size={13} /> Incorrect
                    </>
                  )}
                </span>
              </div>

              {/* Question Text */}
              <p className="text-base font-semibold text-slate-900">{resItem.questionText}</p>

              {/* Options Review List */}
              <div className="space-y-2">
                {resItem.options?.map((opt) => {
                  const isUserSelection = opt.id === resItem.selectedOptionId;
                  const isTheCorrectAnswer = opt.id === resItem.correctOptionId;

                  let borderClass = 'border-slate-200 bg-white text-slate-700';
                  if (isTheCorrectAnswer) {
                    borderClass = 'border-emerald-500 bg-emerald-50/60 text-emerald-950 font-semibold';
                  } else if (isUserSelection && !isCorrect) {
                    borderClass = 'border-rose-400 bg-rose-50/60 text-rose-950 font-semibold';
                  }

                  return (
                    <div
                      key={opt.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-sm ${borderClass}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isTheCorrectAnswer
                              ? 'bg-emerald-600 text-white'
                              : isUserSelection
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {isTheCorrectAnswer ? '✓' : isUserSelection ? '✗' : '•'}
                        </span>
                        <span>{opt.text}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs shrink-0">
                        {isUserSelection && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-white/80 border border-slate-200 text-slate-600">
                            Your Choice
                          </span>
                        )}
                        {isTheCorrectAnswer && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-600 text-white">
                            Correct Answer
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Authoritative Explanation */}
              {resItem.explanation && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed">
                  <strong className="text-slate-900">Explanation: </strong>
                  {resItem.explanation}
                </div>
              )}

              {/* Remedial Teaching & Mistake Practice for Incorrect Answers */}
              {!isCorrect && (
                <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                      <BookMarked size={14} className="text-amber-600" />
                      Topic Remediation & Concept Teaching
                    </span>
                    <Link
                      to="/mistakes"
                      className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-400 underline underline-offset-2"
                    >
                      View in Mistake Book →
                    </Link>
                  </div>
                  <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                    This mistake was saved to your <strong>Mistake Book</strong>. Review this topic or practice targeted questions to reinforce your understanding.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Link
                      to="/mistakes"
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-2xs transition"
                    >
                      Practice in Mistake Book
                    </Link>
                    {attempt.subject?._id && (
                      <Link
                        to={`/subjects/${attempt.subject._id}`}
                        className="px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-xs font-medium hover:bg-amber-100/50 transition"
                      >
                        Review Subject Syllabus
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

      </div>
    </div>
  );
};

export default QuizResultsPage;
