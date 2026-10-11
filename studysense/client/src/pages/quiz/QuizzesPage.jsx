import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  GraduationCap,
  Folder,
  Trash2,
  Edit3,
  Play,
  History,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { questionService } from '../../services/quizService';
import { subjectService } from '../../services/subjectService';
import QuizModal from '../../components/quiz/QuizModal';
import QuizGeneratorModal from '../../components/quiz/QuizGeneratorModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import DashboardLayout from '../../components/layouts/DashboardLayout';


const QuizzesPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlSubjectId = searchParams.get('subjectId') || '';
  const autoGenerate = searchParams.get('generate') === 'true';

  const [quizzes, setQuizzes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [activeTab, setActiveTab] = useState('quizzes'); // 'quizzes' or 'history'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(urlSubjectId);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isAIQuizModalOpen, setIsAIQuizModalOpen] = useState(autoGenerate);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [deletingQuiz, setDeletingQuiz] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);


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

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedSubject) params.subject = selectedSubject;

      const res = await questionService.getAllQuizzes(params);
      if (res.data?.success) {
        setQuizzes(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError(err.response?.data?.message || 'Failed to load quizzes.');
    } finally {
      setLoading(false);
    }
  }, [search, selectedSubject]);

  const fetchAttempts = useCallback(async () => {
    try {
      const res = await questionService.getAllAttempts();
      if (res.data?.success) {
        setAttempts(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching attempts:', err);
    }
  }, []);

  useEffect(() => {
    loadSubjects();
    fetchAttempts();
  }, [loadSubjects, fetchAttempts]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const handleDeleteConfirm = async () => {
    if (!deletingQuiz) return;
    try {
      setDeleteLoading(true);
      await questionService.deleteQuiz(deletingQuiz._id);
      setQuizzes((prev) => prev.filter((q) => q._id !== deletingQuiz._id));
      setDeletingQuiz(null);
    } catch (err) {
      console.error('Failed to delete quiz:', err);
      alert(err.response?.data?.message || 'Failed to delete quiz');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <DashboardLayout title="Quizzes & Assessments">
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Top Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quizzes & Assessments</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              Module 5
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Build custom quizzes from your question bank, take assessments, and review evaluations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/question-bank"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors shrink-0"
          >
            <HelpCircle size={15} />
            Question Bank
          </Link>

          <button
            onClick={() => setIsAIQuizModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-sm shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Sparkles size={18} />
            <span>AI Quiz Generator</span>
          </button>

          <button
            onClick={() => {
              setEditingQuiz(null);
              setIsFormModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm shadow-indigo-100 transition-all cursor-pointer shrink-0"
          >
            <Plus size={18} />
            <span>Create Quiz</span>
          </button>
        </div>
      </div>


      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`flex items-center gap-2 px-4 py-2 font-semibold text-sm rounded-xl transition-colors ${
            activeTab === 'quizzes'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <GraduationCap size={16} />
          <span>Saved Quizzes ({quizzes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 font-semibold text-sm rounded-xl transition-colors ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History size={16} />
          <span>Attempt History ({attempts.length})</span>
        </button>
      </div>

      {activeTab === 'quizzes' ? (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search quizzes by title or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="w-full sm:w-56">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
              <AlertCircle size={18} className="shrink-0 text-rose-600" />
              <p>{error}</p>
            </div>
          )}

          {/* Quizzes Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3 animate-pulse">
                  <div className="w-20 h-5 bg-slate-200 rounded"></div>
                  <div className="w-3/4 h-5 bg-slate-200 rounded"></div>
                  <div className="w-full h-8 bg-slate-100 rounded"></div>
                </div>
              ))}
            </div>
          ) : quizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {quizzes.map((quiz) => (
                <div
                  key={quiz._id}
                  className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      {quiz.subject && (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold text-white shadow-2xs"
                          style={{ backgroundColor: quiz.subject.color || '#6366F1' }}
                        >
                          <Folder size={11} />
                          {quiz.subject.name}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {quiz.questionCount} Questions
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 line-clamp-1">{quiz.title}</h3>

                    {quiz.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">{quiz.description}</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingQuiz(quiz);
                          setIsFormModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50"
                        title="Edit Quiz"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => setDeletingQuiz(quiz)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50"
                        title="Delete Quiz"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <button
                      onClick={() => navigate(`/quizzes/${quiz._id}/take`)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <Play size={13} fill="currentColor" />
                      Take Quiz
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center max-w-lg mx-auto shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4">
                <GraduationCap size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">No quizzes available</h3>
              <p className="text-sm text-slate-500 mb-6">
                Create a quiz from your question bank to assess knowledge in your curriculum subjects.
              </p>
              <button
                onClick={() => {
                  setEditingQuiz(null);
                  setIsFormModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-all"
              >
                <Plus size={18} />
                Create First Quiz
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Attempt History Tab */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
          {attempts.length > 0 ? (
            <div className="divide-y divide-slate-100">
              <div className="grid grid-cols-12 px-6 py-3 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <div className="col-span-5">Quiz Title</div>
                <div className="col-span-3">Subject</div>
                <div className="col-span-2 text-center">Score</div>
                <div className="col-span-2 text-right">Review</div>
              </div>

              {attempts.map((att) => (
                <div
                  key={att._id}
                  className="grid grid-cols-12 px-6 py-4 items-center hover:bg-slate-50/60 transition-colors"
                >
                  <div className="col-span-5">
                    <p className="text-sm font-bold text-slate-900">{att.quizTitleSnapshot}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(att.completedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <div className="col-span-3">
                    {att.subject && (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold text-white"
                        style={{ backgroundColor: att.subject.color || '#6366F1' }}
                      >
                        <Folder size={11} />
                        {att.subject.name}
                      </span>
                    )}
                  </div>

                  <div className="col-span-2 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                        att.percentage >= 75
                          ? 'bg-emerald-100 text-emerald-800'
                          : att.percentage >= 50
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {att.score}/{att.totalQuestions} ({att.percentage}%)
                    </span>
                  </div>

                  <div className="col-span-2 text-right">
                    <Link
                      to={`/quiz-results/${att._id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      View Results
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <History size={36} className="mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">No attempts yet</p>
              <p className="text-xs text-slate-400 mt-1">Take a quiz to see your evaluated results here.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <QuizModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingQuiz(null);
        }}
        onSaved={fetchQuizzes}
        editingQuiz={editingQuiz}
        onOpenAIGenerator={(subId) => {
          if (subId) setSelectedSubject(subId);
          setIsAIQuizModalOpen(true);
        }}
      />

      {/* AI Quiz Generator Modal */}
      <QuizGeneratorModal
        isOpen={isAIQuizModalOpen}
        onClose={() => setIsAIQuizModalOpen(false)}
        subjects={subjects}
        initialSubjectId={selectedSubject}
        onQuizCreated={() => {
          fetchQuizzes();
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmModal

        isOpen={!!deletingQuiz}
        onClose={() => setDeletingQuiz(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Quiz"
        message="Are you sure you want to delete this quiz? Past attempt results and score history will remain safely preserved."
        confirmText="Delete Quiz"
        cancelText="Cancel"
        isDanger={true}
        isLoading={deleteLoading}
      />
      </div>
    </DashboardLayout>
  );
};

export default QuizzesPage;
