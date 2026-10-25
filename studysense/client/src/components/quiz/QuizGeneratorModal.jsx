import React, { useState, useEffect } from 'react';
import { 
  Sparkles, X, AlertCircle, CheckCircle2, BookOpen, Layers, 
  HelpCircle, Check, ArrowRight, ArrowLeft, Award, RotateCcw, 
  XCircle, FileText, ChevronRight, BookMarked, Upload, Link2, PlusCircle, Trash2, Globe
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
  const [sourceScope, setSourceScope] = useState('outer_sources'); // 'my_materials' | 'combined' | 'outer_sources'
  const [quizTitle, setQuizTitle] = useState('');

  // Source upload states for direct PDF/URL/text attachment
  const [uploadedSources, setUploadedSources] = useState([]);
  const [sourceUrlInput, setSourceUrlInput] = useState('');
  const [sourceTextInput, setSourceTextInput] = useState('');
  const [showTextModal, setShowTextModal] = useState(false);
  const [sourceUploading, setSourceUploading] = useState(false);
  const [sourceUploadSuccess, setSourceUploadSuccess] = useState('');

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
    } else if (!selectedSubjectId && subjects.length > 0) {
      setSelectedSubjectId(subjects[0]._id || subjects[0].id || '');
    }
  }, [initialSubjectId, subjects, selectedSubjectId]);

  if (!isOpen) return null;

  const currentSubject = subjects.find((s) => (s._id || s.id) === selectedSubjectId) || subjects[0];
  const effectiveSubjectId = selectedSubjectId || (currentSubject?._id || currentSubject?.id);
  const currentTopics = currentSubject?.topics || [];
  const availableUnits = Array.from(new Set(currentTopics.map((t) => t.unit).filter(Boolean)));

  // Ingest external PDF file directly
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!selectedSubjectId) {
      setError('Please select a subject first before uploading study materials.');
      return;
    }
    setError('');
    setSourceUploadSuccess('');
    setSourceUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subjectId', selectedSubjectId);
      if (selectedTopicId) formData.append('topicId', selectedTopicId);
      formData.append('title', file.name);

      const res = await quizGeneratorService.ingestFileUpload(formData);
      if (res?.data) {
        setUploadedSources((prev) => [...prev, res.data]);
        setSourceUploadSuccess(`Uploaded "${file.name}" successfully!`);
      }
    } catch (err) {
      console.error('File upload error:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to upload document');
    } finally {
      setSourceUploading(false);
      e.target.value = '';
    }
  };

  // Ingest URL (webpage / youtube / notes)
  const handleUrlSubmit = async (e) => {
    e?.preventDefault();
    if (!sourceUrlInput.trim()) return;
    if (!selectedSubjectId) {
      setError('Please select a subject first before adding reference URL.');
      return;
    }
    setError('');
    setSourceUploadSuccess('');
    setSourceUploading(true);

    try {
      const res = await quizGeneratorService.ingestUrlSource({
        subjectId: selectedSubjectId,
        topicId: selectedTopicId || undefined,
        url: sourceUrlInput.trim(),
        title: sourceUrlInput.trim()
      });
      if (res?.data) {
        setUploadedSources((prev) => [...prev, res.data]);
        setSourceUploadSuccess(`Fetched and ingested content from URL successfully!`);
        setSourceUrlInput('');
      }
    } catch (err) {
      console.error('URL ingest error:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to extract content from URL');
    } finally {
      setSourceUploading(false);
    }
  };

  // Ingest pasted text
  const handleTextSubmit = async () => {
    if (!sourceTextInput.trim()) return;
    if (!selectedSubjectId) {
      setError('Please select a subject first before adding notes.');
      return;
    }
    setError('');
    setSourceUploadSuccess('');
    setSourceUploading(true);

    try {
      const res = await quizGeneratorService.ingestTextSource({
        subjectId: selectedSubjectId,
        topicId: selectedTopicId || undefined,
        content: sourceTextInput.trim(),
        title: `Pasted Notes (${new Date().toLocaleTimeString()})`
      });
      if (res?.data) {
        setUploadedSources((prev) => [...prev, res.data]);
        setSourceUploadSuccess('Pasted notes ingested successfully!');
        setSourceTextInput('');
        setShowTextModal(false);
      }
    } catch (err) {
      console.error('Text ingest error:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to ingest pasted text');
    } finally {
      setSourceUploading(false);
    }
  };

  const handleRemoveSource = (id) => {
    setUploadedSources((prev) => prev.filter((s) => s._id !== id));
  };

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
    const sourceIds = uploadedSources.map((s) => s._id);

    // Map sourceScope to server expectations
    let mappedScope = sourceScope;
    if (sourceScope === 'my_materials') {
      mappedScope = 'material_only';
    } else if (sourceScope === 'outer_sources') {
      mappedScope = 'general_knowledge';
    } else {
      mappedScope = 'combined';
    }

    try {
      const response = await quizGeneratorService.generateQuiz({
        subjectId: selectedSubjectId,
        topicId: selectedTopicId || undefined,
        unit: selectedUnit || undefined,
        difficulty,
        questionType: marksTier === '14m' ? 'Long Answer' : questionType,
        targetCount: Number(questionCount),
        questionCount: Number(questionCount),
        marksTier,
        marks: effectiveMarks,
        sourceScope: mappedScope,
        sourceIds: sourceIds.length > 0 ? sourceIds : undefined,
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
    try {
      let totalMarks = 0;
      let score = 0;
      let correctCount = 0;
      let wrongCount = 0;
      let unattemptedCount = 0;

      const details = (generatedQuestions || []).map((q, idx) => {
        const qMark = Number(q.marks) || (marksTier === '2m' ? 2 : marksTier === '14m' ? 14 : 1);
        totalMarks += qMark;

        const userAns = userAnswers[idx];
        let isCorrect = false;
        let earnedMark = 0;

        if (userAns === undefined || userAns === null || userAns === '') {
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

      // Transition immediately to evaluation screen
      setViewMode('evaluation');

      // Auto-record wrong questions into Mistake Book for this subject and topic asynchronously
      const wrongQuestionsToRecord = (generatedQuestions || [])
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

      const targetSubId = selectedSubjectId || effectiveSubjectId;

      if (wrongQuestionsToRecord.length > 0 && targetSubId && mistakeService?.recordDirectMistakes) {
        mistakeService.recordDirectMistakes({
          subjectId: targetSubId,
          topicId: selectedTopicId || undefined,
          mistakes: wrongQuestionsToRecord,
        }).catch(err => {
          console.warn('Could not auto-record mistakes:', err?.message);
        });
      }

      // Record this completed quiz attempt in QuizAttempt history asynchronously
      if (targetSubId && questionService?.recordDirectAttempt) {
        const attemptResults = (generatedQuestions || []).map((q, idx) => {
          const detail = details[idx];
          let correctOptId = q.correctOptionId || 'A';
          if (Array.isArray(q.options) && q.options.length > 0) {
            const cOpt = q.options.find(o => o.isCorrect || o.id === q.correctOptionId || o.text === q.correctAnswer);
            if (cOpt) correctOptId = cOpt.id || cOpt.text;
          }

          return {
            questionText: q.questionText,
            topicId: selectedTopicId || undefined,
            options: Array.isArray(q.options) ? q.options.map((opt, i) => ({
              id: opt.id || String.fromCharCode(65 + i),
              text: opt.text || String(opt),
            })) : [],
            selectedOptionId: detail?.userAnswer ? (typeof detail.userAnswer === 'string' ? detail.userAnswer : JSON.stringify(detail.userAnswer)) : null,
            correctOptionId: correctOptId,
            isCorrect: Boolean(detail?.isCorrect),
            explanation: q.explanation || q.expectedAnswer || '',
          };
        });

        questionService.recordDirectAttempt({
          quizTitle: quizTitle || `${currentSubject?.name || 'Subject'}: ${marksTier.toUpperCase()} Live Quiz`,
          subjectId: targetSubId,
          score,
          totalQuestions: generatedQuestions.length,
          correctAnswers: correctCount,
          incorrectAnswers: wrongCount,
          unansweredCount,
          percentage: accuracy,
          results: attemptResults,
        }).then(() => {
          if (onQuizCreated) onQuizCreated();
        }).catch(err => {
          console.warn('Could not auto-save quiz attempt to history:', err?.message);
        });
      }
    } catch (err) {
      console.error('Quiz evaluation error:', err);
      // Fallback basic evaluation
      setEvaluationResult({
        totalMarks: generatedQuestions.length * 2,
        score: 0,
        accuracy: 0,
        correctCount: 0,
        wrongCount: generatedQuestions.length,
        unattemptedCount: 0,
        details: []
      });
      setViewMode('evaluation');
    }
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
                  Knowledge Source Grounding *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Option 1: My Materials */}
                  <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                    sourceScope === 'my_materials'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}>
                    <input
                      type="radio"
                      name="quizSourceScope"
                      value="my_materials"
                      checked={sourceScope === 'my_materials'}
                      onChange={() => setSourceScope('my_materials')}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">My Material</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Strictly uses your uploaded topic notes and PDFs. Fallback to outer sources for missing topics.
                      </div>
                    </div>
                  </label>

                  {/* Option 2: My Material + Outer Sources */}
                  <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                    sourceScope === 'combined'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
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
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">My Material + Outer Sources</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Combines your materials with web references, URLs, uploaded PDFs, or curriculum AI.
                      </div>
                    </div>
                  </label>

                  {/* Option 3: Outer Sources */}
                  <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                    sourceScope === 'outer_sources'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}>
                    <input
                      type="radio"
                      name="quizSourceScope"
                      value="outer_sources"
                      checked={sourceScope === 'outer_sources'}
                      onChange={() => setSourceScope('outer_sources')}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">Outer Sources</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Upload custom URLs, articles, or PDFs. If no URL provided, AI automatically sources questions.
                      </div>
                    </div>
                  </label>
                </div>

                {/* Inline Upload & URL Attachment for Combined or Outer Sources */}
                {(sourceScope === 'combined' || sourceScope === 'outer_sources') && (
                  <div className="mt-4 p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                        <Globe size={14} /> Attach Outer Sources (URL, PDF, Text)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Optional • AI automatically sources if none provided
                      </span>
                    </div>

                    {/* Inputs Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* URL input */}
                      <form onSubmit={handleUrlSubmit} className="flex gap-2">
                        <div className="relative flex-1">
                          <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="url"
                            placeholder="Paste external URL (YouTube / Webpage)..."
                            value={sourceUrlInput}
                            onChange={(e) => setSourceUrlInput(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={sourceUploading || !sourceUrlInput.trim()}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition cursor-pointer shrink-0"
                        >
                          Add URL
                        </button>
                      </form>

                      {/* File upload button + Paste Text trigger */}
                      <div className="flex items-center gap-2">
                        <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer transition">
                          <Upload size={14} className="text-blue-600" />
                          <span>{sourceUploading ? 'Uploading...' : 'Upload PDF / PPTX'}</span>
                          <input
                            type="file"
                            accept=".pdf,.pptx"
                            onChange={handleFileUpload}
                            disabled={sourceUploading}
                            className="hidden"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => setShowTextModal(!showTextModal)}
                          className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
                        >
                          Paste Text
                        </button>
                      </div>
                    </div>

                    {/* Expandable text paste box */}
                    {showTextModal && (
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 animate-fade-in">
                        <textarea
                          rows={3}
                          placeholder="Paste reference text, exam notes, or syllabus content..."
                          value={sourceTextInput}
                          onChange={(e) => setSourceTextInput(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowTextModal(false)}
                            className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleTextSubmit}
                            disabled={sourceUploading || !sourceTextInput.trim()}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                          >
                            Add Text Source
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Success Notice */}
                    {sourceUploadSuccess && (
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                        <CheckCircle2 size={13} /> {sourceUploadSuccess}
                      </div>
                    )}

                    {/* List of Attached Sources */}
                    {uploadedSources.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Attached Sources ({uploadedSources.length}):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {uploadedSources.map((s) => (
                            <span
                              key={s._id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-900 text-xs font-medium text-blue-900 dark:text-blue-300"
                            >
                              <FileText size={12} className="text-blue-600 shrink-0" />
                              <span className="truncate max-w-[200px]">{s.title || s.originalFilename || 'Document'}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSource(s._id)}
                                className="text-slate-400 hover:text-rose-500 ml-1"
                                title="Remove source"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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

