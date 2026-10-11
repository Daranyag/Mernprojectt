import React, { useState, useEffect } from 'react';
import { X, Layers, Flag } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';
import Alert from '../common/Alert';

const STATUS_OPTIONS = [
  { value: 'Not Started', label: 'Not Started', desc: 'Learning has not begun' },
  { value: 'In Progress', label: 'In Progress', desc: 'Currently studying' },
  { value: 'Completed', label: 'Completed', desc: 'Topic syllabus covered' },
  { value: 'Mastered', label: 'Mastered', desc: 'Thoroughly understood' },
];

const PRIORITY_OPTIONS = [
  { value: 'Low', label: 'Low', color: 'text-slate-500' },
  { value: 'Medium', label: 'Medium', color: 'text-amber-500' },
  { value: 'High', label: 'High', color: 'text-rose-500' },
];

const TopicModal = ({
  isOpen,
  topic = null, // null for create, object for edit
  isLoading = false,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    unit: '',
    subtopics: '',
    description: '',
    status: 'Not Started',
    priority: 'Medium',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const isEditing = Boolean(topic && topic.id);

  useEffect(() => {
    if (topic) {
      setFormData({
        title: topic.title || '',
        unit: topic.unit || '',
        subtopics: Array.isArray(topic.subtopics) ? topic.subtopics.join(', ') : '',
        description: topic.description || '',
        status: topic.status || 'Not Started',
        priority: topic.priority || 'Medium',
      });
    } else {
      setFormData({
        title: '',
        unit: '',
        subtopics: '',
        description: '',
        status: 'Not Started',
        priority: 'Medium',
      });
    }
    setErrors({});
    setServerError('');
  }, [topic, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Topic title is required';
    } else if (formData.title.trim().length < 2) {
      newErrors.title = 'Topic title must be at least 2 characters';
    } else if (formData.title.trim().length > 120) {
      newErrors.title = 'Topic title cannot exceed 120 characters';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description cannot exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: '' }));
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const subtopicsArr = formData.subtopics
        ? formData.subtopics
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
        : [];

      await onSubmit({
        title: formData.title.trim(),
        unit: formData.unit.trim(),
        subtopics: subtopicsArr,
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
      });
    } catch (err) {
      setServerError(err.message || 'Failed to save topic. Please try again.');
      if (err.errors) setErrors(err.errors);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="topic-modal-title"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-charcoal-850 rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <h3 id="topic-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
            {isEditing ? 'Edit Topic' : 'Add New Topic'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isEditing
              ? 'Modify the topic title, notes, priority, or mastery status.'
              : 'Add a new unit topic or learning objective to this subject.'}
          </p>
        </div>

        {serverError && (
          <Alert
            type="error"
            message={serverError}
            onDismiss={() => setServerError('')}
            className="mb-4 text-xs"
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="title"
            label="Topic Title"
            placeholder="e.g. Normalization & BCNF, Quicksort Algorithm"
            value={formData.title}
            onChange={handleChange}
            error={errors.title}
            required
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              id="unit"
              label="Unit / Chapter"
              placeholder="e.g. Unit 1: Process Management"
              value={formData.unit}
              onChange={handleChange}
            />

            <Input
              id="subtopics"
              label="Subtopics (Comma-separated)"
              placeholder="e.g. Paging, TLB, Page replacement"
              value={formData.subtopics}
              onChange={handleChange}
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Description / Learning Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Key concepts, formula notes, or syllabus textbook references..."
              value={formData.description}
              onChange={handleChange}
              className={`w-full px-3.5 py-2.5 rounded-xl text-sm border bg-white dark:bg-charcoal-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors ${
                errors.description ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            {errors.description && (
              <p className="text-xs text-rose-500 mt-1">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status Select */}
            <div>
              <label htmlFor="status" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Learning Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-charcoal-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Select */}
            <div>
              <label htmlFor="priority" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Academic Priority
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-charcoal-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} Priority
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
            >
              {isEditing ? 'Save Changes' : 'Create Topic'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TopicModal;
