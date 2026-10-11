import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, BookOpen, Layers, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import SubjectCard from '../../components/subjects/SubjectCard';
import SubjectModal from '../../components/subjects/SubjectModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import subjectService from '../../services/subjectService';

const SubjectsPage = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirm state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [notification, setNotification] = useState(null);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await subjectService.getSubjects();
      if (res.success && res.data?.subjects) {
        setSubjects(res.data.subjects);
      } else {
        throw new Error(res.message || 'Failed to fetch subjects');
      }
    } catch (err) {
      console.error('[SubjectsPage] Error fetching subjects:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleOpenCreateModal = () => {
    setEditingSubject(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (subj) => {
    setEditingSubject(subj);
    setModalOpen(true);
  };

  const handleSaveSubject = async (formData) => {
    setIsSubmitting(true);
    try {
      if (editingSubject) {
        const res = await subjectService.updateSubject(editingSubject.id, formData);
        setSubjects((prev) =>
          prev.map((s) => (s.id === editingSubject.id ? { ...s, ...res.data.subject } : s))
        );
        setNotification({ type: 'success', message: `Subject "${formData.name}" updated successfully.` });
      } else {
        const res = await subjectService.createSubject(formData);
        const createdSub = res.data?.subject;
        setSubjects((prev) => [createdSub, ...prev]);
        setNotification({ type: 'success', message: `Subject "${formData.name}" created successfully.` });
        setModalOpen(false);
        setEditingSubject(null);
        if (createdSub?.id || createdSub?._id) {
          navigate(`/subjects/${createdSub.id || createdSub._id}`);
          return;
        }
      }
      setModalOpen(false);
      setEditingSubject(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteConfirm = (subj) => {
    setSubjectToDelete(subj);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!subjectToDelete) return;
    setIsDeleting(true);
    try {
      await subjectService.deleteSubject(subjectToDelete.id);
      setSubjects((prev) => prev.filter((s) => s.id !== subjectToDelete.id));
      setNotification({
        type: 'success',
        message: `Subject "${subjectToDelete.name}" and its topics were deleted.`,
      });
      setDeleteConfirmOpen(false);
      setSubjectToDelete(null);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to delete subject. Please try again.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter subjects based on search query
  const filteredSubjects = subjects.filter((s) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      s.name.toLowerCase().includes(query) ||
      (s.description && s.description.toLowerCase().includes(query))
    );
  });

  return (
    <DashboardLayout title="My Subjects">
      <div className="space-y-6">
        {/* Header with Title and Add Subject Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              My Subjects
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Organize your course subjects and track topic progression.
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleOpenCreateModal}
            className="gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subject</span>
          </Button>
        </div>

        {/* Status Notification Banner */}
        {notification && (
          <Alert
            type={notification.type}
            message={notification.message}
            onDismiss={() => setNotification(null)}
            className="text-xs"
          />
        )}

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search subjects by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-charcoal-850 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Clear
            </button>
          )}
        </div>

        {/* Content States */}
        {loading ? (
          /* Loading Skeletons */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-56 rounded-2xl bg-slate-200 dark:bg-charcoal-800 animate-pulse p-5 space-y-4"
              >
                <div className="h-4 w-28 bg-slate-300 dark:bg-charcoal-700 rounded" />
                <div className="h-8 w-44 bg-slate-300 dark:bg-charcoal-700 rounded" />
                <div className="h-12 w-full bg-slate-300 dark:bg-charcoal-700 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="p-8 text-center rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/30 space-y-3">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              Failed to load subjects
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              {error.message || 'Could not connect to StudySense server. Please try again.'}
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={fetchSubjects}
              className="gap-2 mx-auto text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </Button>
          </div>
        ) : filteredSubjects.length === 0 ? (
          /* Empty State */
          <div className="py-14 px-4 text-center rounded-2xl bg-white dark:bg-charcoal-850 border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4 shadow-sm">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {searchQuery ? 'No matching subjects found' : 'Your subjects will appear here'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1.5 leading-relaxed">
              {searchQuery
                ? `No subject matched "${searchQuery}". Try a different search term or clear the filter.`
                : 'Create your first subject to start breaking down the course curriculum into actionable study topics.'}
            </p>
            <div className="mt-5">
              {searchQuery ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleOpenCreateModal}
                  className="gap-2 text-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Your First Subject</span>
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Subject Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSubjects.map((subj) => (
              <SubjectCard
                key={subj.id}
                subject={subj}
                onEdit={handleOpenEditModal}
                onDelete={handleOpenDeleteConfirm}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Subject Modal */}
      <SubjectModal
        isOpen={modalOpen}
        subject={editingSubject}
        isLoading={isSubmitting}
        onClose={() => {
          setModalOpen(false);
          setEditingSubject(null);
        }}
        onSubmit={handleSaveSubject}
      />

      {/* Delete Subject Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Delete Subject"
        message={`Are you sure you want to delete "${subjectToDelete?.name}"? All associated topics within this subject will also be permanently deleted. This action cannot be undone.`}
        confirmText="Delete Subject"
        isLoading={isDeleting}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setSubjectToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </DashboardLayout>
  );
};

export default SubjectsPage;
