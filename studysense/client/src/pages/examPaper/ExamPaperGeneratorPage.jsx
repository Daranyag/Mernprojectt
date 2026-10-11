import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  BookOpen,
  Layers,
  Settings,
  Printer,
  Copy,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Eye,
  ArrowRight,
  HelpCircle,
  Download,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { subjectService } from '../../services/subjectService';
import examPaperService from '../../services/examPaperService';

const DEFAULT_SECTIONS = [
  {
    sectionId: 'Part A',
    title: 'Part A: Very Short Answer Questions',
    totalQuestions: 5,
    questionsToAnswer: 5,
    marksPerQuestion: 2,
    questionType: 'very_short_answer',
    instructions: 'Answer all 5 questions. Each carries 2 marks.'
  },
  {
    sectionId: 'Part B',
    title: 'Part B: Short Answer Questions',
    totalQuestions: 4,
    questionsToAnswer: 4,
    marksPerQuestion: 5,
    questionType: 'short_answer',
    instructions: 'Answer all 4 questions. Each carries 5 marks.'
  },
  {
    sectionId: 'Part C',
    title: 'Part C: Essay & Analytical Questions',
    totalQuestions: 3,
    questionsToAnswer: 2,
    marksPerQuestion: 10,
    questionType: 'long_answer',
    instructions: 'Answer any 2 out of 3 questions. Each carries 10 marks.'
  }
];

const ExamPaperGeneratorPage = () => {
  const [searchParams] = useSearchParams();
  const urlSubjectId = searchParams.get('subjectId') || '';
  const [subjects, setSubjects] = useState([]);
  const [savedPapers, setSavedPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'history', 'preview'

  // Step 1: Subject & Scope
  const [selectedSubjectId, setSelectedSubjectId] = useState(urlSubjectId);
  const [sourceScope, setSourceScope] = useState('general_knowledge'); // 'material_only', 'general_knowledge', 'combined'
  const [pastedSyllabus, setPastedSyllabus] = useState('');

  // Step 2: Configuration
  const [paperTitle, setPaperTitle] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [examDuration, setExamDuration] = useState('3 Hours');
  const [difficulty, setDifficulty] = useState('Medium');
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true);
  const [includeMarkingScheme, setIncludeMarkingScheme] = useState(true);

  // Preview & View mode
  const [currentPaper, setCurrentPaper] = useState(null);
  const [printMode, setPrintMode] = useState('all'); // 'paper_only', 'key_only', 'all'
  const [editingQuestion, setEditingQuestion] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [subRes, papersRes] = await Promise.all([
        subjectService.getAllSubjects(),
        examPaperService.getExamPapers()
      ]);

      if (subRes.data?.success) {
        const subs = subRes.data.data || [];
        setSubjects(subs);
        const targetId = urlSubjectId || selectedSubjectId;
        const matchingSub = subs.find(s => s._id === targetId) || (subs.length > 0 ? subs[0] : null);
        if (matchingSub && (!selectedSubjectId || urlSubjectId)) {
          setSelectedSubjectId(matchingSub._id);
          setPaperTitle(`${matchingSub.name} - University Examination Paper`);
        }
      }

      if (papersRes.success) {
        setSavedPapers(papersRes.data || []);
      }
    } catch (err) {
      console.error('[ExamPaperPage] Load error:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load initial data');
    } finally {
      setLoading(false);
    }
  }, [selectedSubjectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle subject change
  const handleSubjectChange = (e) => {
    const subId = e.target.value;
    setSelectedSubjectId(subId);
    const sub = subjects.find((s) => s._id === subId);
    if (sub) {
      setPaperTitle(`${sub.name} - University Examination Paper`);
    }
  };

  // Section config handler
  const updateSection = (idx, field, value) => {
    const updated = [...sections];
    updated[idx][field] = value;

    // Recalculate instruction if questions or marks changed
    if (['totalQuestions', 'questionsToAnswer', 'marksPerQuestion'].includes(field)) {
      const total = Number(updated[idx].totalQuestions) || 1;
      const toAnswer = Number(updated[idx].questionsToAnswer) || total;
      const marks = Number(updated[idx].marksPerQuestion) || 1;
      updated[idx].instructions =
        toAnswer < total
          ? `Answer any ${toAnswer} out of ${total} questions. Each carries ${marks} mark(s).`
          : `Answer all ${total} questions. Each carries ${marks} mark(s).`;
    }
    setSections(updated);
  };

  const addSection = () => {
    const nextLetter = String.fromCharCode(65 + sections.length);
    setSections([
      ...sections,
      {
        sectionId: `Part ${nextLetter}`,
        title: `Part ${nextLetter}: Questions`,
        totalQuestions: 3,
        questionsToAnswer: 3,
        marksPerQuestion: 5,
        questionType: 'short_answer',
        instructions: 'Answer all 3 questions. Each carries 5 marks.'
      }
    ]);
  };

  const removeSection = (idx) => {
    if (sections.length <= 1) return;
    setSections(sections.filter((_, i) => i !== idx));
  };

  // Calculate live total marks summary
  const totalAvailableMarks = sections.reduce(
    (sum, s) => sum + (Number(s.totalQuestions) || 0) * (Number(s.marksPerQuestion) || 0),
    0
  );
  const totalAttemptedMarks = sections.reduce(
    (sum, s) => sum + (Number(s.questionsToAnswer) || 0) * (Number(s.marksPerQuestion) || 0),
    0
  );
  const totalQuestionsCount = sections.reduce((sum, s) => sum + (Number(s.totalQuestions) || 0), 0);

  // Generate Paper
  const handleGeneratePaper = async () => {
    const targetSubId = selectedSubjectId || (subjects[0]?._id || subjects[0]?.id);
    if (!targetSubId) {
      alert('Please select a subject.');
      return;
    }

    setGenerating(true);
    setError(null);
    setNotice(null);
    try {
      const payload = {
        subjectId: targetSubId,
        title: paperTitle,
        institutionName,
        courseCode,
        examDuration,
        sourceScope,
        difficulty,
        sections,
        hasAnswerKey: includeAnswerKey,
        hasMarkingScheme: includeMarkingScheme,
        includeAnswerKey,
        includeMarkingScheme
      };

      const res = await examPaperService.generateExamPaper(payload);
      if (res.success && res.data) {
        if (res.fallbackNotice) {
          setNotice(res.fallbackNotice);
        }
        setCurrentPaper(res.data);
        setActiveTab('preview');
        loadData();
      }
    } catch (err) {
      console.error('[ExamPaperPage] Generation error:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to generate exam paper');
    } finally {
      setGenerating(false);
    }
  };

  // Regenerate single question
  const handleRegenerateQuestion = async (sectionId, qIndex) => {
    if (!currentPaper) return;
    try {
      const res = await examPaperService.regenerateQuestion(currentPaper._id, sectionId, qIndex);
      if (res.success && res.data) {
        setCurrentPaper(res.data.paper);
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to regenerate question');
    }
  };

  // Duplicate paper
  const handleDuplicate = async (id) => {
    try {
      const res = await examPaperService.duplicateExamPaper(id);
      if (res.success) {
        loadData();
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to duplicate paper');
    }
  };

  // Delete paper
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this exam paper?')) return;
    try {
      const res = await examPaperService.deleteExamPaper(id);
      if (res.success) {
        if (currentPaper?._id === id) setCurrentPaper(null);
        loadData();
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete paper');
    }
  };

  // Finalize paper
  const handleFinalize = async (id) => {
    try {
      const res = await examPaperService.finalizeExamPaper(id);
      if (res.success) {
        setCurrentPaper(res.data);
        loadData();
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to finalize paper');
    }
  };

  return (
    <DashboardLayout title="Exam Paper Generator">
      <div className="space-y-6 pb-16 print:p-0 print:m-0">
        {/* Top Header Banner - Hidden when printing */}
        <div className="bg-gradient-to-r from-teal-600 via-indigo-600 to-brand-600 rounded-3xl p-6 md:p-8 text-white shadow-md relative overflow-hidden print:hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold tracking-wide uppercase mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Module 9: Exam Paper Generator
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                University Examination Paper Creator
              </h1>
              <p className="text-teal-100 text-sm mt-1 max-w-2xl leading-relaxed">
                Configure exam structures, set section-wise marks, generate model answer keys with marking rubrics, and export print-ready papers.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'create'
                    ? 'bg-white text-teal-800 shadow-sm'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Create Paper
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-white text-teal-800 shadow-sm'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Paper History ({savedPapers.length})
              </button>
              {currentPaper && (
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'preview'
                      ? 'bg-white text-teal-800 shadow-sm'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  Paper Preview
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 print:hidden">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <strong>Error: </strong> {error}
            </div>
          </div>
        )}

        {/* Informative Fallback Notice */}
        {notice && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 print:hidden">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <strong>Curriculum Notice: </strong> {notice}
            </div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-xs text-amber-700 hover:text-amber-900 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* TAB 1: CREATE PAPER WORKFLOW */}
        {activeTab === 'create' && (
          <div className="space-y-6">
            {/* Step A: Subject & Paper Basics */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-4 border-b border-slate-100">
                <BookOpen className="w-5 h-5 text-teal-600" />
                Step 1: Select Subject & Examination Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
                {/* Subject Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Course / Subject *
                  </label>
                  {subjects.length === 0 ? (
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs">
                      No subjects enrolled. <Link to="/subjects" className="font-bold underline">Create a Subject</Link> first.
                    </div>
                  ) : (
                    <select
                      value={selectedSubjectId || (subjects[0]?._id || subjects[0]?.id || '')}
                      onChange={handleSubjectChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Select a Subject</option>
                      {subjects.map((s) => (
                        <option key={s._id || s.id} value={s._id || s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Paper Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Examination Paper Title *
                  </label>
                  <input
                    type="text"
                    value={paperTitle}
                    onChange={(e) => setPaperTitle(e.target.value)}
                    placeholder="e.g. End Semester Theory Examination"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Institution Name (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Institution / University Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder="e.g. Department of Computer Applications"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Course Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Course / Subject Code
                  </label>
                  <input
                    type="text"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    placeholder="e.g. MCA-401"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Exam Duration
                  </label>
                  <select
                    value={examDuration}
                    onChange={(e) => setExamDuration(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="1.5 Hours">1.5 Hours (Internal Assessment)</option>
                    <option value="2 Hours">2 Hours</option>
                    <option value="3 Hours">3 Hours (University End-Sem)</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Overall Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Easy">Easy (Foundation / Definitions)</option>
                    <option value="Medium">Medium (Balanced University Exam)</option>
                    <option value="Hard">Hard (Analytical / Competitive)</option>
                    <option value="Mixed">Mixed (Bloom's Taxonomy Spectrum)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step B: Source Scope */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-4 border-b border-slate-100">
                <Layers className="w-5 h-5 text-indigo-600" />
                Step 2: Knowledge Source Scope
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                <div
                  onClick={() => setSourceScope('general_knowledge')}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer ${
                    sourceScope === 'general_knowledge'
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-900">Subject Curriculum</span>
                    {sourceScope === 'general_knowledge' && <Check className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Generates comprehensive questions reflecting official MCA syllabus standards for this subject.
                  </p>
                </div>

                <div
                  onClick={() => setSourceScope('material_only')}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer ${
                    sourceScope === 'material_only'
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-900">Uploaded Materials Only</span>
                    {sourceScope === 'material_only' && <Check className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Strictly grounded in your uploaded PDFs, PPTX slides, or pasted notes without external knowledge.
                  </p>
                </div>

                <div
                  onClick={() => setSourceScope('combined')}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer ${
                    sourceScope === 'combined'
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-900">Combined Scope</span>
                    {sourceScope === 'combined' && <Check className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Prioritizes your materials while supplementing standard university questions where needed.
                  </p>
                </div>
              </div>
            </div>

            {/* Step C: Examination Structure Blueprint */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-brand-600" />
                    Step 3: Section Structure & Marks Blueprint
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure parts, choice rules (e.g. answer 2 out of 3), and individual question marks.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-3.5 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
                    Attempted: <strong>{totalAttemptedMarks}</strong> / Available: <strong>{totalAvailableMarks}</strong> Marks
                  </div>
                  <button
                    onClick={addSection}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Section
                  </button>
                </div>
              </div>

              {/* Sections List */}
              <div className="space-y-4 mt-5">
                {sections.map((sec, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {sec.sectionId.replace('Part ', '')}
                        </span>
                        <input
                          type="text"
                          value={sec.title}
                          onChange={(e) => updateSection(idx, 'title', e.target.value)}
                          className="font-bold text-sm text-slate-900 bg-transparent border-b border-slate-300 focus:outline-none focus:border-teal-600 flex-1"
                        />
                      </div>
                      {sections.length > 1 && (
                        <button
                          onClick={() => removeSection(idx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Remove section"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Total Questions</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={sec.totalQuestions}
                          onChange={(e) => updateSection(idx, 'totalQuestions', parseInt(e.target.value, 10) || 1)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Answer Count</label>
                        <input
                          type="number"
                          min="1"
                          max={sec.totalQuestions}
                          value={sec.questionsToAnswer}
                          onChange={(e) => updateSection(idx, 'questionsToAnswer', parseInt(e.target.value, 10) || 1)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Marks Each</label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={sec.marksPerQuestion}
                          onChange={(e) => updateSection(idx, 'marksPerQuestion', parseInt(e.target.value, 10) || 1)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Question Type</label>
                        <select
                          value={sec.questionType}
                          onChange={(e) => updateSection(idx, 'questionType', e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                        >
                          <option value="very_short_answer">Very Short (1-2 Marks)</option>
                          <option value="short_answer">Short Answer (3-5 Marks)</option>
                          <option value="long_answer">Long / Essay (10-14 Marks)</option>
                          <option value="single_choice">Multiple Choice (MCQ)</option>
                        </select>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 italic">
                      Instructions: {sec.instructions}
                    </p>
                  </div>
                ))}
              </div>

              {/* Options */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={includeAnswerKey}
                    onChange={(e) => setIncludeAnswerKey(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                  Generate Complete Model Answer Key
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={includeMarkingScheme}
                    onChange={(e) => setIncludeMarkingScheme(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                  />
                  Generate Descriptive Marking Rubrics
                </label>
              </div>

              {/* Generate Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleGeneratePaper}
                  disabled={generating || subjects.length === 0}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-sm shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                  {generating ? 'Generating Examination Paper...' : `Generate Exam Paper (${totalAttemptedMarks} Marks)`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PAPER HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 pb-4 border-b border-slate-100">
              Examination Paper History
            </h2>

            {savedPapers.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No examination papers generated yet. Click "Create Paper" to get started.
              </div>
            ) : (
              <div className="space-y-4 mt-5">
                {savedPapers.map((paper) => (
                  <div
                    key={paper._id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-teal-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {paper.subject?.name || 'Subject'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            paper.status === 'finalized'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {paper.status === 'finalized' ? 'Finalized' : 'Draft'}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900">{paper.title}</h3>
                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                        <span>Attempted: {paper.requiredAttemptedMarks} Marks</span>
                        <span>&bull;</span>
                        <span>{paper.totalQuestionsPresented} Questions</span>
                        <span>&bull;</span>
                        <span>{new Date(paper.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setCurrentPaper(paper);
                          setActiveTab('preview');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview & Print
                      </button>
                      <button
                        onClick={() => handleDuplicate(paper._id)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                        title="Duplicate Paper"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(paper._id)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                        title="Delete Paper"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PREVIEW & PRINTABLE VIEW */}
        {activeTab === 'preview' && currentPaper && (
          <div className="space-y-6">
            {/* Action Bar - Hidden when printing */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700">Print View:</span>
                <select
                  value={printMode}
                  onChange={(e) => setPrintMode(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-800"
                >
                  <option value="all">Full Document (Paper + Answer Key)</option>
                  <option value="paper_only">Question Paper Only (Student View)</option>
                  <option value="key_only">Answer Key & Marking Scheme Only</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                {currentPaper.status === 'draft' && (
                  <button
                    onClick={() => handleFinalize(currentPaper._id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Finalize Paper
                  </button>
                )}
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Export to PDF
                </button>
              </div>
            </div>

            {/* PRINTABLE PAPER CONTAINER */}
            <div className="bg-white rounded-3xl border border-slate-300 p-8 md:p-12 shadow-sm print:shadow-none print:border-none print:p-0 print:m-0 text-slate-900">
              {/* Paper Header */}
              {(printMode === 'all' || printMode === 'paper_only') && (
                <div className="border-b-2 border-slate-900 pb-6 mb-8 text-center space-y-2">
                  {currentPaper.institutionName && (
                    <h2 className="text-base font-bold uppercase tracking-widest text-slate-700">
                      {currentPaper.institutionName}
                    </h2>
                  )}
                  <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">
                    {currentPaper.title}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-800">
                    {currentPaper.courseCode && <span>Code: {currentPaper.courseCode}</span>}
                    <span>Course: {currentPaper.subject?.name}</span>
                    <span>Duration: {currentPaper.examDuration}</span>
                    <span>Max Marks: {currentPaper.requiredAttemptedMarks}</span>
                  </div>

                  {/* Student Candidate Identification box for printable view */}
                  <div className="mt-4 pt-3 border-t border-dashed border-slate-300 flex justify-between text-xs text-slate-600 px-4">
                    <span>Candidate Name: _________________________________</span>
                    <span>Register No: ____________________</span>
                  </div>
                </div>
              )}

              {/* Instructions */}
              {(printMode === 'all' || printMode === 'paper_only') && (
                <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 print:bg-transparent print:border-none print:p-0">
                  <h3 className="font-bold uppercase tracking-wider mb-1">General Instructions:</h3>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {currentPaper.generalInstructions?.map((inst, i) => (
                      <li key={i}>{inst}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sections & Questions */}
              {(printMode === 'all' || printMode === 'paper_only') && (
                <div className="space-y-8">
                  {currentPaper.sections?.map((section, sIdx) => (
                    <div key={section._id || sIdx} className="space-y-4">
                      {/* Section Heading */}
                      <div className="border-b border-slate-300 pb-2 flex items-baseline justify-between">
                        <div>
                          <h3 className="font-bold text-sm uppercase tracking-wider text-slate-900">
                            {section.title}
                          </h3>
                          <p className="text-xs text-slate-500 italic mt-0.5">
                            {section.instructions}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-slate-700">
                          [{section.attemptedSectionMarks} Marks]
                        </span>
                      </div>

                      {/* Questions List */}
                      <div className="space-y-5">
                        {section.questions?.map((q, qIdx) => (
                          <div key={q._id || qIdx} className="flex items-start justify-between gap-4 text-xs">
                            <div className="flex-1 space-y-2">
                              <p className="font-semibold text-slate-900 leading-relaxed">
                                <span className="font-bold mr-2">{q.questionNumber}.</span>
                                {q.questionText}
                              </p>

                              {/* MCQ Options if single_choice */}
                              {q.questionType === 'single_choice' && q.options && (
                                <div className="grid grid-cols-2 gap-2 pl-6 mt-1 text-slate-700">
                                  {q.options.map((opt) => (
                                    <div key={opt.id}>
                                      <span className="font-bold mr-1">({opt.id})</span> {opt.text}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className="font-bold text-slate-700 text-xs">
                                ({q.marks})
                              </span>

                              {/* Regenerate Question Button - Hidden in Print */}
                              <button
                                onClick={() => handleRegenerateQuestion(section.sectionId, qIdx)}
                                className="p-1 rounded text-slate-400 hover:text-teal-600 transition print:hidden cursor-pointer"
                                title="Regenerate this question with AI"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* SEPARATE ANSWER KEY & MARKING SCHEME SECTION */}
              {(printMode === 'all' || printMode === 'key_only') && (
                <div className={`mt-12 pt-8 border-t-2 border-slate-900 ${printMode === 'all' ? 'print:break-before-page' : ''}`}>
                  <div className="text-center mb-6">
                    <h2 className="text-lg font-black uppercase tracking-wider text-slate-900">
                      Authoritative Answer Key & Marking Scheme
                    </h2>
                    <p className="text-xs text-slate-500">
                      Confidential &bull; {currentPaper.title}
                    </p>
                  </div>

                  <div className="space-y-6">
                    {currentPaper.sections?.map((section) => (
                      <div key={section.sectionId} className="space-y-4">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200">
                          {section.title}
                        </h4>

                        <div className="space-y-4 pl-2">
                          {section.questions?.map((q) => (
                            <div key={q.questionNumber} className="border-b border-slate-100 pb-3 text-xs space-y-1.5">
                              <p className="font-bold text-slate-900">
                                Q{q.questionNumber}. {q.questionText} <span className="text-slate-500">({q.marks} Marks)</span>
                              </p>

                              {q.correctAnswer && (
                                <p className="text-slate-700">
                                  <strong>Correct Answer / Solution:</strong> {q.correctAnswer}
                                </p>
                              )}

                              {q.modelAnswer && q.modelAnswer !== q.correctAnswer && (
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 whitespace-pre-line">
                                  <strong>Model Answer:</strong>
                                  <br />
                                  {q.modelAnswer}
                                </div>
                              )}

                              {/* Marking Rubric Breakdown */}
                              {q.rubric && q.rubric.length > 0 && (
                                <div className="mt-2 text-[11px] text-slate-600 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                                  <strong className="text-amber-900">Marking Rubric Breakdown:</strong>
                                  <ul className="list-disc pl-4 mt-1 space-y-0.5">
                                    {q.rubric.map((r, rIdx) => (
                                      <li key={rIdx}>
                                        {r.criterion}: <strong>{r.allocatedMarks} Mark(s)</strong>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ExamPaperGeneratorPage;
