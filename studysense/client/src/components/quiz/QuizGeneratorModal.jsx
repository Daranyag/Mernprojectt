import React, { useState, useEffect } from 'react';
import { 
  Sparkles, X, AlertCircle, CheckCircle2, BookOpen, Layers, 
  HelpCircle, Check, ArrowRight, ArrowLeft, Award, RotateCcw, 
  XCircle, FileText, ChevronRight, BookMarked
} from 'lucide-react';
import quizGeneratorService from '../../services/quizGeneratorService';
import { questionService } from '../../services/quizService';
import { mistakeService } from '../../services/mistakeService';

export const QuizGeneratorModal = ({
  isOpen,
  onClose,
  subjects = [],
  initialSubjectId = '',
  onQuizCreated
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubjectId || (subjects[0]?._id || ''));
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [difficulty, setDifficulty] = useState('Medium'); // 'Easy' | 'Medium' | 'Hard' | 'Mixed'
  const [questionType, setQuestionType] = useState('MCQ'); // 'MCQ' | 'Short Answer' | 'Long Answer' | 'Mixed'
  const [questionCount, setQuestionCount] = useState(5);
  const [marksTier, setMarksTier] = useState('2m'); // '1m' | '2m' | '14m' | 'mixed'
  const [sourceScope, setSourceScope] = useState('general_knowledge'); // 'general_knowledge' | 'material_only' | 'combined'
  const [quizTitle, setQuizTitle] = useState('');

  // Workflow states: 'config' | 'quiz' | 'evaluation' | 'review'
  const [viewMode, setViewMode] = useState('config');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notice, setNotice] = useState('');

  // Interactive Quiz Platform states
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [index]: selectedOptionIdOrText }
  const [evaluationResult, setEvaluationResult] = useState(null);

  useEffect(() => {
    if (initialSubjectId) {
      setSelectedSubjectId(initialSubjectId);
    }
  }, [initialSubjectId]);

  if (!isOpen) return null;

  const currentSubject = subjects.find((s) => s._id === selectedSubjectId);
  const currentTopics = currentSubject?.topics || [];
  const availableUnits = Array.from(new Set(currentTopics.map((t) => t.unit).filter(Boolean)));

  const handleGenerate = async () => {
    if (!selectedSubjectId) {
      setError('Please select a subject');
      return;
    }
    setError('');
    setNotice('');
    setGenerating(true);
    setGeneratedQuestions([]);
    setSaveSuccess(false);
    setUserAnswers({});
    setCurrentQIndex(0);
    setEvaluationResult(null);

    const effectiveMarks = marksTier === '2m' ? 2 : marksTier === '14m' ? 14 : marksTier === 'mixed' ? 'mixed' : 1;

    try {
      const response = await quizGeneratorService.generateQuiz({
        subjectId: selectedSubjectId,
        topicId: selectedTopicId || undefined,
        unit: selectedUnit || undefined,
        difficulty,
        questionType: marksTier === '14m' ? 'Long Answer' : questionType,
        targetCount: Number(questionCount),
        marksTier,
        marks: effectiveMarks,
        sourceScope,
        title: quizTitle || `${currentSubject?.name || 'Subject'} ${marksTier.toUpperCase()} Quiz`
      });

      if (response?.fallbackNotice || response?.data?.fallbackNotice) {
        setNotice(response?.fallbackNotice || response?.data?.fallbackNotice);
      }

      const questions = response?.data?.questions || response?.questions || [];
      if (questions.length > 0) {
        setGeneratedQuestions(questions);
        setViewMode('quiz'); // Direct to live quiz platform mode
      } else {
        setError('No questions were generated. Please try again with general subject knowledge or broader scope.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to generate quiz');
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectOption = (qIndex, optionIdOrText) => {
    setUserAnswers(prev => ({
      ...prev,
      [qIndex]: optionIdOrText
    }));
  };

  const handleSubmitQuiz = () => {
    let totalMarks = 0;
    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unattemptedCount = 0;

    const details = generatedQuestions.map((q, idx) => {
      const qMark = Number(q.marks) || (marksTier === '2m' ? 2 : marksTier === '14m' ? 14 : 1);
      totalMarks += qMark;

      const userAns = userAnswers[idx];
      let isCorrect = false;
      let earnedMark = 0;

      if (!userAns) {
        unattemptedCount++;
      } else if (Array.isArray(q.options) && q.options.length > 0) {
        // Find correct option
        const correctOpt = q.options.find(o => o.isCorrect || o.id === q.correctOptionId || o.text === q.correctAnswer);
        const userOpt = q.options.find(o => o.id === userAns || o.text === userAns);
        
        if (correctOpt && userOpt && (correctOpt.id === userOpt.id || correctOpt.text === userOpt.text)) {
          isCorrect = true;
          earnedMark = qMark;
          correctCount++;
        } else {
          wrongCount++;
        }
      } else {
        // Descriptive 2M / 14M answer
        if (typeof userAns === 'string' && userAns.trim().length >= 10) {
          isCorrect = true; // Attempted descriptive response
          earnedMark = qMark;
          correctCount++;
        } else {
          wrongCount++;
        }
      }

      score += earnedMark;

      return {
        questionIndex: idx,
        isCorrect,
        earnedMark,
        totalMark: qMark,
        userAnswer: userAns
      };
    });

    const accuracy = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

    setEvaluationResult({
      totalMarks,
      score,
      accuracy,
      correctCount,
      wrongCount,
      unattemptedCount,
      details
    });

    // Auto-record wrong questions into Mistake Book for this subject and topic
    const wrongQuestionsToRecord = generatedQuestions
      .map((q, idx) => ({ q, detail: details[idx] }))
      .filter(({ detail }) => detail && !detail.isCorrect && detail.userAnswer)
      .map(({ q, detail }) => {
        let correctOptId = q.correctOptionId || 'A';
        if (Array.isArray(q.options) && q.options.length > 0) {
          const cOpt = q.options.find(o => o.isCorrect || o.id === q.correctOptionId || o.text === q.correctAnswer);
          if (cOpt) correctOptId = cOpt.id || cOpt.text;
        }

        return {
          questionText: q.questionText,
          options: Array.isArray(q.options) ? q.options.map((opt, i) => ({
            id: opt.id || String.fromCharCode(65 + i),
            text: opt.text || String(opt),
          })) : [],
          selectedOptionId: typeof detail.userAnswer === 'string' ? detail.userAnswer : JSON.stringify(detail.userAnswer),
          correctOptionId: correctOptId,
          explanation: q.explanation || q.expectedAnswer || '',
          topicId: selectedTopicId || undefined,
        };
      });

    if (wrongQuestionsToRecord.length > 0 && selectedSubjectId) {
      mistakeService.recordDirectMistakes({
        subjectId: selectedSubjectId,
        topicId: selectedTopicId || undefined,
        mistakes: wrongQuestionsToRecord,
      }).catch(err => {
        console.warn('Could not auto-record mistakes:', err?.message);
      });
    }

    setViewMode('evaluation');
  };

  const handleRetakeQuiz = () => {
    setUserAnswers({});
    setCurrentQIndex(0);
    setEvaluationResult(null);
    setViewMode('quiz');
  };

  const handleSaveAsQuiz = async () => {
    if (generatedQuestions.length === 0) return;
    setSavingQuiz(true);
    setError('');

    try {
      // 1. Save generated questions into Question Bank
      const savedRes = await quizGeneratorService.saveGeneratedQuestions({
        subjectId: selectedSubjectId,
        topicId: selectedTopicId || undefined,
        questions: generatedQuestions
      });

      const savedQuestions = savedRes?.data?.questions || [];
      const questionIds = savedQuestions.map((q) => q._id || q.id);

      // 2. Create the Quiz in the quiz system
      const finalTitle = quizTitle || `${currentSubject?.name}: ${marksTier.toUpperCase()} Quiz`;
      const quizRes = await questionService.createQuiz({
        title: finalTitle,
        subject: selectedSubjectId,
        topic: selectedTopicId || null,
        description: `AI-generated ${difficulty} ${marksTier.toUpperCase()} quiz with ${questionIds.length} questions.`,
        questionIds: questionIds,
        questions: questionIds,
        timeLimit: Math.max(5, questionIds.length * (marksTier === '14m' ? 15 : 2)),
        passingPercentage: 60
      });

      setSaveSuccess(true);
      if (onQuizCreated) {
        onQuizCreated(quizRes.data);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save generated quiz');
    } finally {
      setSavingQuiz(false);
    }
  };

  const activeQuestion = generatedQuestions[currentQIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-800/80 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {viewMode === 'config' && 'AI Quiz Generator & Platform'}
                  {viewMode === 'quiz' && 'Interactive Live Quiz'}
                  {viewMode === 'evaluation' && 'Quiz Evaluation & Results'}
                  {viewMode === 'review' && 'Quiz Review & Detailed Solutions'}
                </h2>
                {viewMode !== 'config' && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    {marksTier.toUpperCase()} • {generatedQuestions.length} Questions
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {viewMode === 'config' && 'Configure syllabus, select 2M or 14M questions, and generate your live exam'}
                {viewMode === 'quiz' && 'Answer questions, navigate freely, and click submit for instant evaluation'}
                {viewMode === 'evaluation' && 'Performance analysis, score breakdown, and accuracy metrics'}
                {viewMode === 'review' && 'Review your answers against model keys, rubric points, and explanations'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {notice && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-sm">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong>Notice: </strong> {notice}
              </div>
              <button
                type="button"
                onClick={() => setNotice('')}
                className="text-xs text-amber-700 hover:text-amber-900 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* MODE 1: CONFIGURATION */}
          {viewMode === 'config' && (
            <div className="space-y-5">
              {/* Quiz Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Quiz Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Unit 1 Operating Systems Practice Test"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Subject & Topic Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Subject *
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => {
                      setSelectedSubjectId(e.target.value);
                      setSelectedUnit('');
                      setSelectedTopicId('');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Select a subject...</option>
                    {subjects.map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Unit / Module (Optional)
                  </label>
                  {availableUnits.length > 0 ? (
                    <select
                      value={selectedUnit}
                      onChange={(e) => setSelectedUnit(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">All Units</option>
                      {availableUnits.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Unit 1"
                      value={selectedUnit}
                      onChange={(e) => setSelectedUnit(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Topic Focus (Optional)
                  </label>
                  <select
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">All Topics in Subject/Unit</option>
                    {currentTopics.map((top) => (
                      <option key={top._id} value={top._id}>
                        {top.unit ? `[${top.unit}] ` : ''}{top.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* MARKS TIER SELECTION (User Choice: 2m, 14m, 1m, mixed) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Question Marks Tier (University Standard) *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => setMarksTier('2m')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      marksTier === '2m'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">2 Marks</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                        Part A
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Definitions, short answers, core concepts & differences.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMarksTier('14m')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      marksTier === '14m'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">14 Marks</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                        Part B / C
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Detailed essays, system architectures, algorithms & rubrics.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMarksTier('1m')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      marksTier === '1m'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">1 Mark</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                        MCQs
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Objective multiple choice testing speed & key facts.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMarksTier('mixed')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      marksTier === 'mixed'
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 ring-2 ring-purple-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">Mixed Tier</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
                        Full Exam
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Balanced combination of 2-mark and 14-mark questions.
                    </div>
                  </button>
                </div>
              </div>

              {/* Number of Questions & Difficulty */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Number of Questions *
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                    >
                      <option value={3}>3 Questions (Quick Test)</option>
                      <option value={5}>5 Questions (Standard)</option>
                      <option value={7}>7 Questions</option>
                      <option value={10}>10 Questions (Comprehensive)</option>
                      <option value={14}>14 Questions (Semester Model)</option>
                      <option value={20}>20 Questions (Full Mock)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="Easy">Easy (Recall & Fundamentals)</option>
                    <option value="Medium">Medium (Application & Analysis)</option>
                    <option value="Hard">Hard (In-depth University Exam)</option>
                    <option value="Mixed">Mixed Difficulty</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Question Format
                  </label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="MCQ">Multiple Choice (MCQ)</option>
                    <option value="Short Answer">Short Answer / Definitions</option>
                    <option value="Long Answer">Essay / Rubrics</option>
                    <option value="Mixed">Mixed Types</option>
                  </select>
                </div>
              </div>

              {/* Knowledge Source Grounding */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Knowledge Source Grounding
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                    sourceScope === 'material_only'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}>
                    <input
                      type="radio"
                      name="quizSourceScope"
                      value="material_only"
                      checked={sourceScope === 'material_only'}
                      onChange={() => setSourceScope('material_only')}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">Use My Materials Only</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Strictly grounds questions in your uploaded PDFs and notes.</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                    sourceScope === 'general_knowledge'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}>
                    <input
                      type="radio"
                      name="quizSourceScope"
                      value="general_knowledge"
                      checked={sourceScope === 'general_knowledge'}
                      onChange={() => setSourceScope('general_knowledge')}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">Curriculum & Syllabus Knowledge</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Generates questions from university curriculum benchmarks.</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                    sourceScope === 'combined'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}>
                    <input
                      type="radio"
                      name="quizSourceScope"
                      value="combined"
                      checked={sourceScope === 'combined'}
                      onChange={() => setSourceScope('combined')}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">Combined Materials + Curriculum</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Combines uploaded documents and core syllabus topics.</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: INTERACTIVE LIVE QUIZ PLATFORM */}
          {viewMode === 'quiz' && activeQuestion && (
            <div className="space-y-6">
              {notice && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200 text-sm animate-fade-in shadow-sm">
                  <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <strong className="font-semibold">Automatic Fallback Notice: </strong> {notice}
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotice('')}
                    className="text-xs text-amber-700 dark:text-amber-300 hover:text-amber-900 font-bold px-1"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Question Navigation Bar & Progress */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Question {currentQIndex + 1} of {generatedQuestions.length}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                    {activeQuestion.marks || (marksTier === '2m' ? 2 : marksTier === '14m' ? 14 : 1)} Marks
                  </span>
                </div>

                {/* Question Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  {generatedQuestions.map((_, idx) => {
                    const isAnswered = userAnswers[idx] !== undefined && userAnswers[idx] !== '';
                    const isCurrent = currentQIndex === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => setCurrentQIndex(idx)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center shrink-0 ${
                          isCurrent
                            ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-1'
                            : isAnswered
                            ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Question Box */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/30 shadow-sm space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-relaxed">
                    <span className="text-blue-600 font-bold mr-2">Q{currentQIndex + 1}.</span>
                    {activeQuestion.questionText}
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                    {activeQuestion.difficulty || difficulty}
                  </span>
                </div>

                {/* Options (MCQ) or Textarea (Descriptive / 2M / 14M) */}
                {Array.isArray(activeQuestion.options) && activeQuestion.options.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {activeQuestion.options.map((opt, optIdx) => {
                      const isSelected = userAnswers[currentQIndex] === opt.id || userAnswers[currentQIndex] === opt.text;
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(currentQIndex, opt.id || opt.text)}
                          className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/20 shadow-sm'
                              : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 hover:border-blue-300 hover:bg-blue-50/30'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
                          }`}>
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="text-sm font-medium pt-0.5">{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                      Type your answer / key points for this {activeQuestion.marks || (marksTier === '2m' ? 2 : 14)}-mark question:
                    </label>
                    <textarea
                      rows={marksTier === '14m' ? 8 : 4}
                      value={userAnswers[currentQIndex] || ''}
                      onChange={(e) => handleSelectOption(currentQIndex, e.target.value)}
                      placeholder={marksTier === '14m' 
                        ? 'Write comprehensive response: Architecture, working principle, diagrams description, and detailed explanations...' 
                        : 'Write concise conceptual answer or definition...'}
                      className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQIndex === 0}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
                >
                  <ArrowLeft className="w-4 h-4" /> Previous
                </button>

                <div className="flex items-center gap-3">
                  {currentQIndex < generatedQuestions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentQIndex(prev => Math.min(generatedQuestions.length - 1, prev + 1))}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-md shadow-blue-600/20 transition"
                    >
                      Next <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleSubmitQuiz}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Submit Quiz & Evaluate
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODE 3: EVALUATION & MARKS DASHBOARD */}
          {viewMode === 'evaluation' && evaluationResult && (
            <div className="space-y-6 animate-fade-in">
              {/* Score Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">Quiz Completed</span>
                    <h3 className="text-2xl sm:text-3xl font-extrabold mt-1">
                      Score: {evaluationResult.score} / {evaluationResult.totalMarks} Marks
                    </h3>
                    <p className="text-blue-100 text-sm mt-1">
                      {evaluationResult.accuracy >= 75 ? '🎉 Excellent performance! Strong conceptual mastery.' :
                       evaluationResult.accuracy >= 50 ? '👍 Good attempt! Review weak areas to boost accuracy.' :
                       '📚 Keep practicing! Check the solution explanations below.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-center px-5 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                      <div className="text-3xl font-black">{evaluationResult.accuracy}%</div>
                      <div className="text-[11px] text-blue-200 font-semibold uppercase">Accuracy</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-center">
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                    {evaluationResult.correctCount}
                  </div>
                  <div className="text-xs font-medium text-emerald-800 dark:text-emerald-300 mt-0.5">
                    Correct Answers
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-center">
                  <div className="text-2xl font-bold text-rose-700 dark:text-rose-400">
                    {evaluationResult.wrongCount}
                  </div>
                  <div className="text-xs font-medium text-rose-800 dark:text-rose-300 mt-0.5">
                    Wrong / Incomplete
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center">
                  <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                    {evaluationResult.unattemptedCount}
                  </div>
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                    Unanswered
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRetakeQuiz}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <RotateCcw className="w-4 h-4" /> Retake Quiz
                </button>

                <div className="flex items-center gap-3">
                  {evaluationResult.wrongCount > 0 && (
                    <a
                      href={`/mistake-book${selectedSubjectId ? `?subject=${selectedSubjectId}` : ''}${selectedTopicId ? `&topic=${selectedTopicId}` : ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-sm font-bold border border-rose-200 dark:border-rose-800 transition"
                      title="Repractice wrong questions in Mistake Book"
                    >
                      <BookMarked className="w-4 h-4" /> Practice Mistakes ({evaluationResult.wrongCount})
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setViewMode('review')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-600/20 transition"
                  >
                    <BookOpen className="w-4 h-4" /> Review Quiz & Solutions <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAsQuiz}
                    disabled={savingQuiz || saveSuccess}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 shadow-md shadow-purple-600/20 transition disabled:opacity-50"
                  >
                    {saveSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Saved!
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        {savingQuiz ? 'Saving...' : 'Save & Publish'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODE 4: REVIEW QUIZ & DETAILED SOLUTIONS */}
          {viewMode === 'review' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                    Quiz Solutions & Evaluation Review
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Compare your chosen answers with model keys, awarded marks, and comprehensive explanations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveAsQuiz}
                  disabled={savingQuiz || saveSuccess}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold shadow-md shadow-blue-600/20 transition disabled:opacity-50"
                >
                  {saveSuccess ? 'Quiz Saved!' : savingQuiz ? 'Saving...' : 'Save to Library'}
                </button>
              </div>

              {/* Review Question Cards */}
              <div className="space-y-5 max-h-[55vh] overflow-y-auto pr-1">
                {generatedQuestions.map((q, idx) => {
                  const evalDetail = evaluationResult?.details?.find(d => d.questionIndex === idx);
                  const isCorrect = evalDetail?.isCorrect;
                  const earnedMark = evalDetail?.earnedMark ?? 0;
                  const totalMark = evalDetail?.totalMark ?? (q.marks || (marksTier === '2m' ? 2 : marksTier === '14m' ? 14 : 1));
                  const userAns = userAnswers[idx];

                  return (
                    <div
                      key={idx}
                      className={`p-5 rounded-2xl border space-y-3.5 transition ${
                        isCorrect
                          ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/10'
                          : userAns
                          ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40'
                      }`}
                    >
                      {/* Question Header & Marks Awarded */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {idx + 1}. {q.questionText}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isCorrect ? (
                            <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5" /> +{earnedMark} / {totalMark} Marks
                            </span>
                          ) : userAns ? (
                            <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300">
                              <XCircle className="w-3.5 h-3.5" /> 0 / {totalMark} Marks
                            </span>
                          ) : (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                              Unanswered • 0 / {totalMark}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* MCQ Options with user choice & correct answers highlighted */}
                      {Array.isArray(q.options) && q.options.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt, optIdx) => {
                            const isSelected = userAns === opt.id || userAns === opt.text;
                            const isModelCorrect = opt.isCorrect || opt.id === q.correctOptionId || opt.text === q.correctAnswer;

                            let cardStyle = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300';
                            if (isModelCorrect) {
                              cardStyle = 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-400';
                            } else if (isSelected && !isModelCorrect) {
                              cardStyle = 'border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 line-through';
                            }

                            return (
                              <div
                                key={optIdx}
                                className={`p-3 rounded-xl text-xs border flex items-center justify-between ${cardStyle}`}
                              >
                                <div>
                                  <span className="font-bold mr-1.5">{String.fromCharCode(65 + optIdx)}.</span>
                                  {opt.text}
                                </div>
                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                  {isSelected && (
                                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700">
                                      Your Choice
                                    </span>
                                  )}
                                  {isModelCorrect && (
                                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200">
                                      ✓ Correct
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* Descriptive 2M / 14M Answer Review */
                        <div className="space-y-2 pt-1">
                          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
                            <span className="font-bold text-slate-700 dark:text-slate-300">Your Response: </span>
                            <span className="text-slate-600 dark:text-slate-400 italic">
                              {userAns || '(No response provided)'}
                            </span>
                          </div>

                          {q.expectedAnswer && (
                            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
                              <span className="font-bold">Model Answer / Key Points: </span>
                              {q.expectedAnswer}
                            </div>
                          )}

                          {q.rubric && (
                            <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200">
                              <span className="font-bold">University Rubric Breakdown: </span>
                              {q.rubric}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="text-xs text-slate-600 dark:text-slate-300 italic pt-2 border-t border-slate-200 dark:border-slate-800">
                          <strong>Explanation: </strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Review Footer Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setViewMode('evaluation')}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Evaluation Scorecard
                </button>
                <button
                  type="button"
                  onClick={handleRetakeQuiz}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <RotateCcw className="w-4 h-4" /> Retake Quiz
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          {viewMode !== 'config' ? (
            <button
              onClick={() => {
                setViewMode('config');
                setGeneratedQuestions([]);
                setUserAnswers({});
                setEvaluationResult(null);
              }}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition"
            >
              ← Quiz Settings & Generator
            </button>
          ) : (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Interactive Quiz Platform • Select 2M / 14M questions to begin.
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition"
            >
              {saveSuccess ? 'Done' : 'Close'}
            </button>

            {viewMode === 'config' && (
              <button
                onClick={handleGenerate}
                disabled={generating || !selectedSubjectId}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating {marksTier.toUpperCase()} Quiz...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate & Start Live Quiz
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizGeneratorModal;

