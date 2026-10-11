import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  HelpCircle,
  Folder,
  Trash2,
  Edit3,
  RotateCcw,
  CheckCircle,
  Tag,
  AlertCircle,
  ArrowUpDown,
} from 'lucide-react';
import { questionService } from '../../services/quizService';
import { subjectService } from '../../services/subjectService';
import QuestionModal from '../../components/quiz/QuestionModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import DashboardLayout from '../../components/layouts/DashboardLayout';

const QuestionBankPage = () => {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [deletingQuestion, setDeletingQuestion] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load subjects
  const loadSubjects = useCallback(async () => {
    try {
      const res = await subjectService.getAllSubjects();
      if (res.data?.success) {
        setSubjects(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  }, []);

  // Fetch questions
  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedSubject) params.subject = selectedSubject;
      if (selectedTopic) params.topic = selectedTopic;
      if (selectedDifficulty) params.difficulty = selectedDifficulty;
      if (sortBy) params.sortBy = sortBy;
      if (sortOrder) params.sortOrder = sortOrder;

      const res = await questionService.getAllQuestions(params);
      if (res.data?.success) {
        setQuestions(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError(err.response?.data?.message || 'Failed to load question bank.');
    } finally {
      setLoading(false);
    }
  }, [search, selectedSubject, selectedTopic, selectedDifficulty, sortBy, sortOrder]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const currentSubjectObj = subjects.find((s) => s._id === selectedSubject);
  const availableTopics = currentSubjectObj?.topics || [];

  const handleResetFilters = () => {
    setSearch('');
    setSelectedSubject('');
    setSelectedTopic('');
    setSelectedDifficulty('');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const handleDeleteConfirm = async () => {
    if (!deletingQuestion) return;
    try {
      setDeleteLoading(true);
      await questionService.deleteQuestion(deletingQuestion._id);
      setQuestions((prev) => prev.filter((q) => q._id !== deletingQuestion._id));
      setDeletingQuestion(null);
    } catch (err) {
      console.error('Failed to delete question:', err);
      alert(err.response?.data?.message || 'Failed to delete question');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSaved = () => {
    fetchQuestions();
  };

  const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Hard':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Medium':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <DashboardLayout title="Question Bank">
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Top Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Question Bank</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              Module 5
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Build and manage reusable multiple-choice questions organized by subject and topic.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingQuestion(null);
            setIsFormModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm shadow-indigo-100 transition-all cursor-pointer shrink-0"
        >
          <Plus size={18} />
          <span>Add Question</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search questions by text, tag, or explanation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 placeholder:text-slate-400"
            />
          </div>

          <div className="w-full lg:w-48">
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedTopic('');
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full lg:w-48">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              disabled={!selectedSubject || availableTopics.length === 0}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">All Topics</option>
              {availableTopics.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full lg:w-36">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
            >
              <option value="">All Difficulty</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Secondary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              {questions.length} Question{questions.length !== 1 ? 's' : ''} in Bank
            </span>
            {(search || selectedSubject || selectedTopic || selectedDifficulty) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 transition-colors"
              >
                <RotateCcw size={12} />
                Reset Filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <ArrowUpDown size={12} />
              Sort:
            </span>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="difficulty-asc">Difficulty</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <p>{error}</p>
        </div>
      )}

      {/* Questions List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3 animate-pulse">
              <div className="w-1/4 h-5 bg-slate-200 rounded"></div>
              <div className="w-3/4 h-4 bg-slate-100 rounded"></div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="h-8 bg-slate-100 rounded-lg"></div>
                <div className="h-8 bg-slate-100 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      ) : questions.length > 0 ? (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div
              key={q._id}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs hover:shadow-sm transition-all space-y-4"
            >
              {/* Question Card Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Q{idx + 1}.</span>
                  {q.subject && (
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium text-white shadow-xs"
                      style={{ backgroundColor: q.subject.color || '#6366F1' }}
                    >
                      <Folder size={11} />
                      {q.subject.name}
                    </span>
                  )}
                  {q.topic && (
                    <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      Topic: {q.topic.title}
                    </span>
                  )}
                  <span
                    className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-md border ${getDifficultyBadge(
                      q.difficulty
                    )}`}
                  >
                    {q.difficulty}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setEditingQuestion(q);
                      setIsFormModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition-colors"
                    title="Edit Question"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => setDeletingQuestion(q)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition-colors"
                    title="Delete Question"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <p className="text-base font-semibold text-slate-900 leading-snug">{q.questionText}</p>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {q.options.map((opt) => {
                  const isCorrect = opt.id === q.correctOptionId;
                  return (
                    <div
                      key={opt.id}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border text-sm transition-all ${
                        isCorrect
                          ? 'border-emerald-300 bg-emerald-50/40 text-emerald-950 font-medium'
                          : 'border-slate-200/80 bg-slate-50/40 text-slate-700'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                          isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isCorrect ? <Check size={12} strokeWidth={3} /> : '•'}
                      </span>
                      <span className="flex-1">{opt.text}</span>
                    </div>
                  );
                })}
              </div>

              {/* Explanation & Tags Footer */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                {q.explanation ? (
                  <p className="text-xs text-slate-600 italic">
                    <strong className="text-slate-700 not-italic">Explanation:</strong> {q.explanation}
                  </p>
                ) : (
                  <div></div>
                )}

                {q.tags && q.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {q.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-medium"
                      >
                        <Tag size={10} />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4">
            <HelpCircle size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No questions found</h3>
          <p className="text-sm text-slate-500 mb-6">
            {search || selectedSubject || selectedTopic || selectedDifficulty
              ? 'Try adjusting your search criteria or resetting filters.'
              : 'Add questions to build your question bank for subject quizzes.'}
          </p>

          <button
            onClick={() => {
              setEditingQuestion(null);
              setIsFormModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-all"
          >
            <Plus size={18} />
            Create First Question
          </button>
        </div>
      )}

      {/* Modal */}
      <QuestionModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingQuestion(null);
        }}
        onSaved={handleSaved}
        editingQuestion={editingQuestion}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deletingQuestion}
        onClose={() => setDeletingQuestion(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Question"
        message="Are you sure you want to delete this question? It will be removed from your Question Bank and unlinked from future quizzes."
        confirmText="Delete Question"
        cancelText="Cancel"
        isDanger={true}
        isLoading={deleteLoading}
      />
      </div>
    </DashboardLayout>
  );
};

export default QuestionBankPage;
