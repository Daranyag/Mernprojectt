import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Send,
  Loader2,
} from 'lucide-react';
import { questionService } from '../../services/quizService';
import ConfirmModal from '../../components/common/ConfirmModal';

const TakeQuizPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Answering state: { [questionId]: selectedOptionId }
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);

  // Submit confirmation modal state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuizSession = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await questionService.getQuizForTaking(quizId);
        if (res.data?.success) {
          setQuiz(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load quiz for taking:', err);
        setError(err.response?.data?.message || 'Failed to load quiz session.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizSession();
  }, [quizId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 size={36} className="text-indigo-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Preparing quiz session...</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-2xl border border-rose-100 shadow-xs text-center space-y-4">
        <AlertCircle size={40} className="text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">Quiz Unavailable</h3>
        <p className="text-sm text-slate-600">{error || 'Unable to open this quiz session.'}</p>
        <button
          onClick={() => navigate('/quizzes')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700"
        >
          Return to Quizzes
        </button>
      </div>
    );
  }

  const questions = quiz.questions || [];
  const currentQ = questions[currentIndex];
  const total = questions.length;

  const answeredCount = Object.keys(answers).filter((k) => answers[k] !== null && answers[k] !== undefined).length;
  const unansweredCount = total - answeredCount;

  const handleSelectOption = (optionId) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ._id]: optionId,
    }));
  };

  const handleClearAnswer = () => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ._id]: null,
    }));
  };

  const handleSubmitQuiz = async () => {
    try {
      setSubmitting(true);
      const submissionAnswers = questions.map((q) => ({
        questionId: q._id,
        selectedOptionId: answers[q._id] || null,
      }));

      const res = await questionService.submitQuiz(quizId, { answers: submissionAnswers });
      if (res.data?.success) {
        const attempt = res.data.data;
        setIsSubmitModalOpen(false);
        navigate(`/quiz-results/${attempt._id}`);
      }
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      alert(err.response?.data?.message || 'Quiz submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (answeredCount > 0) {
                if (window.confirm('You have answered questions in this active quiz. Are you sure you want to leave? Your current attempt will not be submitted.')) {
                  navigate('/quizzes');
                }
              } else {
                navigate('/quizzes');
              }
            }}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="Exit quiz and return to quizzes list"
            aria-label="Exit quiz"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
              Active Assessment
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-1">{quiz.title}</h1>
            <p className="text-xs text-slate-500">{quiz.subject?.name}</p>
          </div>
        </div>

        {/* Progress Tracker (Questions answered, NO timers) */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-right">
            <span className="text-xs font-bold text-slate-700">
              {answeredCount} of {total} Answered
            </span>
            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${(answeredCount / total) * 100}%` }}
              ></div>
            </div>
          </div>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            <Send size={13} />
            Submit
          </button>
        </div>
      </div>

      {/* Question Number Pills Navigation */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap items-center gap-2">
        {questions.map((q, idx) => {
          const isAnswered = answers[q._id] !== undefined && answers[q._id] !== null;
          const isCurrent = idx === currentIndex;
          return (
            <button
              key={q._id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                isCurrent
                  ? 'ring-2 ring-indigo-600 bg-indigo-600 text-white'
                  : isAnswered
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Main Question Card */}
      {currentQ && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Question {currentIndex + 1} of {total}
            </span>
            {answers[currentQ._id] && (
              <button
                onClick={handleClearAnswer}
                className="text-xs text-slate-400 hover:text-slate-600 underline"
              >
                Clear choice
              </button>
            )}
          </div>

          <h2 className="text-lg font-bold text-slate-900 leading-relaxed">
            {currentQ.questionText}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((opt, optIdx) => {
              const isSelected = answers[currentQ._id] === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => handleSelectOption(opt.id)}
                  className={`p-4 rounded-xl border flex items-center gap-3.5 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-semibold shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-slate-700'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'border border-slate-300 text-slate-500'
                    }`}
                  >
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span className="text-sm leading-snug">{opt.text}</span>
                </div>
              );
            })}
          </div>

          {/* Bottom Navigation */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ArrowLeft size={14} />
              Previous
            </button>

            {currentIndex < total - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(total - 1, prev + 1))}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Next Question
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Review & Submit
                <CheckCircle size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      <ConfirmModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirm={handleSubmitQuiz}
        title="Confirm Quiz Submission"
        message={
          unansweredCount > 0
            ? `You have ${unansweredCount} unanswered question(s) out of ${total}. Are you sure you want to finish and submit your attempt for evaluation?`
            : `You have answered all ${total} questions. Are you ready to submit your answers and see your evaluation results?`
        }
        confirmText="Confirm & Submit"
        cancelText="Continue Answering"
        isDanger={false}
        isLoading={submitting}
      />
    </div>
  );
};

export default TakeQuizPage;
