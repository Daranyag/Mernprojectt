import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Search,
  BookOpen,
  Edit2,
  Trash2,
  Layers,
  CheckCircle2,
  Award,
  RefreshCw,
  Filter,
  FileText,
  Sparkles,
  HelpCircle,
  FileCheck,
  TrendingUp,
  BookmarkPlus
} from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import TopicCard from '../../components/subjects/TopicCard';
import TopicModal from '../../components/subjects/TopicModal';
import SubjectModal from '../../components/subjects/SubjectModal';
import SyllabusImportModal from '../../components/subjects/SyllabusImportModal';
import NotesGeneratorModal from '../../components/materials/NotesGeneratorModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import subjectService from '../../services/subjectService';
import topicService from '../../services/topicService';


const SubjectDetailPage = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();

  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Topic Modal state
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [isSubmittingTopic, setIsSubmittingTopic] = useState(false);

  // Subject Edit Modal state
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [isSubmittingSubject, setIsSubmittingSubject] = useState(false);

  // Topic Delete Confirm state
  const [topicToDelete, setTopicToDelete] = useState(null);
  const [deleteTopicConfirmOpen, setDeleteTopicConfirmOpen] = useState(false);
  const [isDeletingTopic, setIsDeletingTopic] = useState(false);

  // Syllabus Modal state
  const [syllabusModalOpen, setSyllabusModalOpen] = useState(false);
  const [autoGenerateSyllabus, setAutoGenerateSyllabus] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

  const handleOpenAutoGenerateTopics = () => {
    setAutoGenerateSyllabus(true);
    setSyllabusModalOpen(true);
  };

  const handleOpenSyllabusImport = () => {
    setAutoGenerateSyllabus(false);
    setSyllabusModalOpen(true);
  };

  // Subject Delete Confirm state
  const [deleteSubjectConfirmOpen, setDeleteSubjectConfirmOpen] = useState(false);
  const [isDeletingSubject, setIsDeletingSubject] = useState(false);


  const [notification, setNotification] = useState(null);

  const fetchSubjectDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await subjectService.getSubjectById(subjectId);
      if (res.success && res.data?.subject) {
        setSubject(res.data.subject);
        setTopics(res.data.subject.topics || []);
      } else {
        throw new Error(res.message || 'Subject not found');
      }
    } catch (err) {
      console.error('[SubjectDetailPage] Error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    fetchSubjectDetails();
  }, [fetchSubjectDetails]);

  // Handle topic create/edit
  const handleSaveTopic = async (formData) => {
    setIsSubmittingTopic(true);
    try {
      if (editingTopic) {
        const res = await topicService.updateTopic(editingTopic.id, formData);
        setTopics((prev) =>
          prev.map((t) => (t.id === editingTopic.id ? res.data.topic : t))
        );
        setNotification({ type: 'success', message: `Topic "${formData.title}" updated.` });
      } else {
        const res = await topicService.createTopic(subjectId, formData);
        setTopics((prev) => [...prev, res.data.topic]);
        setNotification({ type: 'success', message: `Topic "${formData.title}" added to subject.` });
      }
      setTopicModalOpen(false);
      setEditingTopic(null);
    } finally {
      setIsSubmittingTopic(false);
    }
  };

  // Handle bulk syllabus topics added
  const handleTopicsBulkAdded = (createdTopics, count, skipped) => {
    if (createdTopics && createdTopics.length > 0) {
      setTopics((prev) => [...prev, ...createdTopics]);
    }
    fetchSubjectDetails(); // Refresh to recalculate live topic mastery & stats
    let msg = `Successfully added ${count} topics from syllabus!`;
    if (skipped && skipped.length > 0) {
      msg += ` (${skipped.length} existing topics were skipped)`;
    }
    setNotification({ type: 'success', message: msg });
  };

  // Quick status change from card dropdown
  const handleQuickStatusChange = async (topicId, newStatus) => {
    try {
      const res = await topicService.updateTopic(topicId, { status: newStatus });
      setTopics((prev) =>
        prev.map((t) => (t.id === topicId ? res.data.topic : t))
      );
      setNotification({
        type: 'success',
        message: `Topic status changed to "${newStatus}".`,
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to update topic status.',
      });
    }
  };

  // Handle topic delete
  const handleConfirmDeleteTopic = async () => {
    if (!topicToDelete) return;
    setIsDeletingTopic(true);
    try {
      await topicService.deleteTopic(topicToDelete.id);
      setTopics((prev) => prev.filter((t) => t.id !== topicToDelete.id));
      setNotification({
        type: 'success',
        message: `Topic "${topicToDelete.title}" deleted.`,
      });
      setDeleteTopicConfirmOpen(false);
      setTopicToDelete(null);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to delete topic.',
      });
    } finally {
      setIsDeletingTopic(false);
    }
  };

  // Handle subject update
  const handleSaveSubject = async (formData) => {
    setIsSubmittingSubject(true);
    try {
      const res = await subjectService.updateSubject(subjectId, formData);
      setSubject((prev) => ({ ...prev, ...res.data.subject }));
      setNotification({
        type: 'success',
        message: 'Subject details updated successfully.',
      });
      setSubjectModalOpen(false);
    } finally {
      setIsSubmittingSubject(false);
    }
  };

  // Handle subject delete
  const handleConfirmDeleteSubject = async () => {
    setIsDeletingSubject(true);
    try {
      await subjectService.deleteSubject(subjectId);
      navigate('/subjects', { replace: true });
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to delete subject.',
      });
      setIsDeletingSubject(false);
    }
  };

  // Calculate live progress metrics from actual topic state
  const totalTopicsCount = topics.length;
  const completedTopicsCount = topics.filter((t) => t.status === 'Completed' || t.status === 'Mastered').length;
  const masteredTopicsCount = topics.filter((t) => t.status === 'Mastered').length;
  const inProgressTopicsCount = topics.filter((t) => t.status === 'In Progress').length;
  const notStartedTopicsCount = topics.filter((t) => t.status === 'Not Started').length;
  const liveProgressPercentage = totalTopicsCount > 0 ? Math.round((completedTopicsCount / totalTopicsCount) * 100) : 0;

  // Filter topics
  const filteredTopics = topics.filter((t) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase().trim()));

    const matchesStatus =
      statusFilter === 'All' || t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout title={subject ? subject.name : 'Subject Details'}>
      <div className="space-y-6">
        {/* Back Link & Page Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/subjects"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Subjects</span>
          </Link>

          {subject && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSyllabusModalOpen(true)}
                className="gap-1.5 text-xs text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Import Syllabus</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSubjectModalOpen(true)}
                className="gap-1.5 text-xs"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit Subject</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteSubjectConfirmOpen(true)}
                className="gap-1.5 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 border-slate-200 dark:border-slate-700"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete Subject</span>
              </Button>
            </div>
          )}
        </div>

        {/* Notification Banner */}
        {notification && (
          <Alert
            type={notification.type}
            message={notification.message}
            onDismiss={() => setNotification(null)}
            className="text-xs"
          />
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-40 rounded-2xl bg-slate-200 dark:bg-charcoal-800" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-44 rounded-2xl bg-slate-200 dark:bg-charcoal-800" />
              <div className="h-44 rounded-2xl bg-slate-200 dark:bg-charcoal-800" />
            </div>
          </div>
        ) : error ? (
          /* Error / Not Found State */
          <div className="p-8 text-center rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/30 space-y-3">
            <p className="text-base font-bold text-slate-900 dark:text-white">
              Subject not found or inaccessible
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              {error.message || 'The requested subject does not exist or does not belong to your account.'}
            </p>
            <div className="pt-2">
              <Link to="/subjects">
                <Button variant="primary" size="sm">
                  Return to My Subjects
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Subject Overview Banner */}
            <div
              className="relative overflow-hidden rounded-2xl bg-white dark:bg-charcoal-850 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 shadow-sm"
              style={{ borderTop: `4px solid ${subject.color || '#3b82f6'}` }}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-sm"
                      style={{ backgroundColor: subject.color || '#3b82f6' }}
                    >
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {subject.name}
                      </h2>
                      <span className="text-xs text-slate-400">
                        {totalTopicsCount} {totalTopicsCount === 1 ? 'topic' : 'topics'} in syllabus
                      </span>
                    </div>
                  </div>

                  {subject.description && (
                    <div className="pt-1 space-y-2">
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {subject.description}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSyllabusModalOpen(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 px-2.5 py-1 rounded-lg border border-indigo-200/80 dark:border-indigo-800 transition-colors cursor-pointer"
                        title="Click to automatically extract topics from this description"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Extract topics from syllabus text</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Progress Visual */}
                <div className="md:w-72 bg-slate-50 dark:bg-charcoal-900/70 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 shrink-0">
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-700 dark:text-slate-300">Topic Mastery</span>
                    <span className="text-brand-600 dark:text-brand-400">{liveProgressPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-charcoal-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${liveProgressPercentage}%`,
                        backgroundColor: subject.color || '#3b82f6',
                      }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{completedTopicsCount} of {totalTopicsCount} Completed</span>
                    <span>{masteredTopicsCount} Mastered</span>
                  </div>
                </div>
              </div>

              {/* Central Workspace Quick Actions Bar */}
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNotesModalOpen(true)}
                  className="gap-1.5 text-xs text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>Generate Short Notes</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/quizzes?subjectId=${subjectId}&generate=true`)}
                  className="gap-1.5 text-xs text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>Generate Quiz</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/exam-paper-generator?subjectId=${subjectId}`)}
                  className="gap-1.5 text-xs text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                >
                  <FileCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Exam Paper</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/important-topics?subjectId=${subjectId}`)}
                  className="gap-1.5 text-xs text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
                  <span>Important Topics</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/materials?subjectId=${subjectId}`)}
                  className="gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                >
                  <BookmarkPlus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Study Materials</span>
                </Button>
              </div>
            </div>


            {/* Topics Section Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-charcoal-850 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-charcoal-850 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="All">All Topics ({totalTopicsCount})</option>
                    <option value="Not Started">Not Started ({notStartedTopicsCount})</option>
                    <option value="In Progress">In Progress ({inProgressTopicsCount})</option>
                    <option value="Completed">Completed ({completedTopicsCount - masteredTopicsCount})</option>
                    <option value="Mastered">Mastered ({masteredTopicsCount})</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleOpenAutoGenerateTopics}
                  className="gap-1.5 text-xs bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Topics (AI)</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenSyllabusImport}
                  className="gap-1.5 text-xs text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Import Syllabus</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingTopic(null);
                    setTopicModalOpen(true);
                  }}
                  className="gap-2 shrink-0 text-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Topic</span>
                </Button>
              </div>
            </div>

            {/* Topic List / Empty States */}
            {filteredTopics.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-2xl bg-white dark:bg-charcoal-850 border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
                {topics.length === 0 ? (
                  <div className="w-full max-w-xl p-6 rounded-2xl bg-gradient-to-br from-brand-50 via-white to-indigo-50 dark:from-brand-950/40 dark:via-charcoal-850 dark:to-indigo-950/40 border border-brand-200 dark:border-brand-800 shadow-sm space-y-4">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-brand-500/20">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        Auto-Generate Course Curriculum for "{subject.name}"
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                        Simply created this subject? Click below to generate all general course topics with AI. You can review, add or drop, edit, or remove topics before adding them to your subject.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={handleOpenAutoGenerateTopics}
                        className="gap-2 text-xs bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20 px-4 py-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Generate All Topics with AI</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleOpenSyllabusImport}
                        className="gap-2 text-xs text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Import Syllabus / File</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTopic(null);
                          setTopicModalOpen(true);
                        }}
                        className="gap-1.5 text-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Manually</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                      <Layers className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      No topics match the selected filter
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Try clearing the search query or changing the status filter to see other topics.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('All');
                      }}
                    >
                      Reset Filters
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTopics.map((topic) => (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    onEdit={(t) => {
                      setEditingTopic(t);
                      setTopicModalOpen(true);
                    }}
                    onDelete={(t) => {
                      setTopicToDelete(t);
                      setDeleteTopicConfirmOpen(true);
                    }}
                    onStatusChange={handleQuickStatusChange}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add / Edit Topic Modal */}
      <TopicModal
        isOpen={topicModalOpen}
        topic={editingTopic}
        isLoading={isSubmittingTopic}
        onClose={() => {
          setTopicModalOpen(false);
          setEditingTopic(null);
        }}
        onSubmit={handleSaveTopic}
      />

      {/* Edit Subject Modal */}
      <SubjectModal
        isOpen={subjectModalOpen}
        subject={subject}
        isLoading={isSubmittingSubject}
        onClose={() => setSubjectModalOpen(false)}
        onSubmit={handleSaveSubject}
      />

      {/* Delete Topic Confirm Modal */}
      <ConfirmModal
        isOpen={deleteTopicConfirmOpen}
        title="Delete Topic"
        message={`Are you sure you want to delete the topic "${topicToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete Topic"
        isLoading={isDeletingTopic}
        onClose={() => {
          setDeleteTopicConfirmOpen(false);
          setTopicToDelete(null);
        }}
        onConfirm={handleConfirmDeleteTopic}
      />

      {/* Delete Subject Confirm Modal */}
      <ConfirmModal
        isOpen={deleteSubjectConfirmOpen}
        title="Delete Subject"
        message={`Are you sure you want to delete "${subject?.name}"? All ${totalTopicsCount} topics in this subject will also be permanently deleted.`}
        confirmText="Delete Subject & Topics"
        isLoading={isDeletingSubject}
        onClose={() => setDeleteSubjectConfirmOpen(false)}
        onConfirm={handleConfirmDeleteSubject}
      />

      {/* Syllabus Import / Bulk Topics Modal */}
      <SyllabusImportModal
        isOpen={syllabusModalOpen}
        subject={subject}
        autoGenerate={autoGenerateSyllabus}
        onClose={() => {
          setSyllabusModalOpen(false);
          setAutoGenerateSyllabus(false);
        }}
        onTopicsAdded={handleTopicsBulkAdded}
      />

      {/* AI Short Notes Generator Modal */}
      {subject && (
        <NotesGeneratorModal
          isOpen={isNotesModalOpen}
          onClose={() => setIsNotesModalOpen(false)}
          subjects={[subject]}
          initialSubjectId={subject._id}
          onNotesSaved={() => {
            setNotification({
              type: 'success',
              message: 'Short notes saved directly to Study Materials!'
            });
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default SubjectDetailPage;

