import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  BookMarked,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Folder,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { mistakeService } from '../../services/mistakeService';

const PracticeEnginePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active question index
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null);

  // Evaluation response state for current question
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  // Session summary counters
  const [sessionResults, setSessionResults] = useState([]);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setLoading(true);
        setError(null);

        const singleId = searchParams.get('singleId');
        if (singleId) {
          const res = await mistakeService.getMistakeById(singleId);
          if (res.data?.success) {
            const m = res.data.data;
            setQuestions([
              {
                _id: m._id,
                subject: m.subject,
                topic: m.topic,
                questionSnapshot: m.questionSnapshot,
                optionsSnapshot: m.optionsSnapshot,
                personalNote: m.personalNote,
              },
            ]);
          }
        } else {
          const params = {};
          if (searchParams.get('subject')) params.subject = searchParams.get('subject');
          if (searchParams.get('topic')) params.topic = searchParams.get('topic');
          if (searchParams.get('status')) params.status = searchParams.get('status');
          if (searchParams.get('onlyMarked')) params.onlyMarked = searchParams.get('onlyMarked');

          const res = await mistakeService.getPracticeSession(params);
          if (res.data?.success) {
            setQuestions(res.data.data.questions || []);
          }
        }
      } catch (err) {
        console.error('Failed to load practice questions:', err);
        setError(err.response?.data?.message || 'Failed to prepare practice session.');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 size={36} className="text-rose-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">Preparing Practice Engine session...</p>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-2xl border border-rose-100 shadow-xs text-center space-y-4">
        <AlertCircle size={40} className="text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">No Questions for Practice</h3>
        <p className="text-sm text-slate-600">
          {error || 'There are no saved mistakes matching your selected practice filter.'}
        </p>
        <button
          onClick={() => navigate('/mistake-book')}
          className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700"
        >
          Return to Mistake Book
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const total = questions.length;

  const handleSubmitAnswer = async () => {
    if (!selectedOptionId) return;

    try {
      setEvaluating(true);
      const res = await mistakeService.submitPracticeAnswer(currentQ._id, {
        selectedOptionId,
      });

      if (res.data?.success) {
        const result = res.data.data;
        setEvaluationResult(result);
        setSessionResults((prev) => [
          ...prev,
          {
            mistakeId: currentQ._id,
            isCorrect: result.isCorrect,
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to evaluate practice answer:', err);
      alert(err.response?.data?.message || 'Evaluation failed. Please try again.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setEvaluationResult(null);
    } else {
      setIsFinished(true);
    }
  };

  // Practice Summary View
  if (isFinished) {
    const correctCount = sessionResults.filter((r) => r.isCorrect).length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xs text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle size={36} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">Practice Session Complete!</h1>
            <p className="text-sm text-slate-500 mt-1">
              You reviewed and re-tested your saved question misconceptions.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-500">Attempted</span>
              <div className="text-2xl font-bold text-slate-900 mt-1">{total}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-500">Corrected</span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{correctCount}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-500">Accuracy</span>
              <div className="text-2xl font-bold text-indigo-600 mt-1">{accuracy}%</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4">
            <Link
              to="/mistake-book"
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors"
            >
              Back to Mistake Book
            </Link>

            <button
              onClick={() => {
                setIsFinished(false);
                setCurrentIndex(0);
                setSelectedOptionId(null);
                setEvaluationResult(null);
                setSessionResults([]);
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-xs transition-colors"
            >
              <RotateCcw size={15} />
              Practice Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/mistake-book')}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="Exit practice session and return to Mistake Book"
            aria-label="Exit practice session"
          >
            <ArrowRight className="rotate-180" size={16} />
          </button>
          <div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700">
              Practice Engine
            </span>
            <h1 className="text-lg font-bold text-slate-900 mt-1">
              Question {currentIndex + 1} of {total}
            </h1>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-bold text-slate-700">
            {currentIndex + 1} / {total}
          </div>
          <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-rose-600 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {currentQ.subject && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-medium text-white shadow-2xs"
              style={{ backgroundColor: currentQ.subject.color || '#6366F1' }}
            >
              <Folder size={11} />
              {currentQ.subject.name}
            </span>
          )}
          {currentQ.topic && (
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              Topic: {currentQ.topic.title}
            </span>
          )}
        </div>

        <h2 className="text-lg font-bold text-slate-900 leading-relaxed">
          {currentQ.questionSnapshot}
        </h2>

        {/* Personal Note reminder if present */}
        {currentQ.personalNote && !evaluationResult && (
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900">
            <strong>Your Note: </strong>
            {currentQ.personalNote}
          </div>
        )}

        {/* Options List */}
        <div className="space-y-3">
          {currentQ.optionsSnapshot?.map((opt, optIdx) => {
            const isSelected = selectedOptionId === opt.id;
            const isEvaluated = Boolean(evaluationResult);

            let optionClass = 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-slate-700';

            if (isEvaluated) {
              const isCorrectAnswer = opt.id === evaluationResult.correctOptionId;
              const wasSelected = opt.id === evaluationResult.selectedOptionId;

              if (isCorrectAnswer) {
                optionClass = 'border-emerald-500 bg-emerald-50/60 text-emerald-950 font-semibold';
              } else if (wasSelected && !evaluationResult.isCorrect) {
                optionClass = 'border-rose-400 bg-rose-50/60 text-rose-950 font-semibold';
              }
            } else if (isSelected) {
              optionClass = 'border-rose-600 bg-rose-50/40 text-rose-950 font-semibold shadow-2xs';
            }

            return (
              <div
                key={opt.id}
                onClick={() => !isEvaluated && setSelectedOptionId(opt.id)}
                className={`p-4 rounded-xl border flex items-center justify-between gap-3.5 transition-all ${
                  isEvaluated ? 'cursor-default' : 'cursor-pointer'
                } ${optionClass}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      isSelected && !isEvaluated
                        ? 'bg-rose-600 text-white'
                        : isEvaluated && opt.id === evaluationResult.correctOptionId
                        ? 'bg-emerald-600 text-white'
                        : 'border border-slate-300 text-slate-500'
                    }`}
                  >
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span className="text-sm leading-snug">{opt.text}</span>
                </div>

                {isEvaluated && opt.id === evaluationResult.correctOptionId && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-600 text-white shrink-0">
                    Correct
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Immediate Post-Submit Feedback Banner */}
        {evaluationResult && (
          <div
            className={`p-4 rounded-xl border space-y-2 animate-in fade-in duration-200 ${
              evaluationResult.isCorrect
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {evaluationResult.isCorrect ? (
                <>
                  <CheckCircle size={18} className="text-emerald-600" />
                  <span>Correct! You mastered this question.</span>
                </>
              ) : (
                <>
                  <XCircle size={18} className="text-rose-600" />
                  <span>Still incorrect. Review the explanation below.</span>
                </>
              )}
            </div>

            {evaluationResult.explanation && (
              <p className="text-xs leading-relaxed">{evaluationResult.explanation}</p>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <Link
            to="/mistake-book"
            className="text-xs font-semibold text-slate-400 hover:text-slate-600"
          >
            Exit Practice
          </Link>

          {!evaluationResult ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedOptionId || evaluating}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-40"
            >
              {evaluating ? 'Checking...' : 'Check Answer'}
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              {currentIndex < total - 1 ? 'Next Question' : 'Finish Session'}
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticeEnginePage;
