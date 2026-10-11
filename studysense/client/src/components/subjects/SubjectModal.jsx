import React, { useState, useEffect } from 'react';
import { X, Palette } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';
import Alert from '../common/Alert';

const PRESET_COLORS = [
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Indigo', value: '#6366f1' },
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Teal', value: '#14b8a6' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Cyan', value: '#06b6d4' },
];

const SubjectModal = ({
  isOpen,
  subject = null, // null for create, object for edit
  isLoading = false,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const isEditing = Boolean(subject && subject.id);

  useEffect(() => {
    if (subject) {
      setFormData({
        name: subject.name || '',
        description: subject.description || '',
        color: subject.color || '#3b82f6',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        color: '#3b82f6',
      });
    }
    setErrors({});
    setServerError('');
  }, [subject, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Subject name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Subject name must be at least 2 characters';
    } else if (formData.name.trim().length > 80) {
      newErrors.name = 'Subject name cannot exceed 80 characters';
    }

    if (formData.description && formData.description.length > 300) {
      newErrors.description = 'Description cannot exceed 300 characters';
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

  const handleColorSelect = (hex) => {
    setFormData((prev) => ({ ...prev, color: hex }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color,
      });
      // onClose will be called by parent upon successful resolution
    } catch (err) {
      setServerError(err.message || 'Failed to save subject. Please try again.');
      if (err.errors) setErrors(err.errors);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subject-modal-title"
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
          <h3 id="subject-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
            {isEditing ? 'Edit Subject' : 'Add New Subject'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isEditing
              ? 'Update the course name, description, or theme color.'
              : 'Create a new academic subject to organize syllabus topics.'}
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
            id="name"
            label="Subject Name"
            placeholder="e.g. Advanced Operating Systems, Database Systems"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
            autoFocus
          />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="description"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Topics / Syllabus Text Box <span className="text-slate-400 font-normal">(Unit-wise or plain topics)</span>
              </label>
              <span className="text-[11px] font-medium text-brand-600 dark:text-brand-400">
                ✨ Auto-extracts Unit & Topic hierarchy
              </span>
            </div>
            <textarea
              id="description"
              rows={5}
              placeholder={`Paste topics or unit-wise syllabus here. For example:\n\nUnit 1: Process Management, CPU Scheduling, Threads\nUnit 2: Memory Management, Paging, Virtual Memory\nUnit 3: File Systems, Storage Architecture\n\nOr simply comma/newline separated topics:\nIntroduction to Operating Systems, System Calls, Deadlocks, Semaphore`}
              value={formData.description}
              onChange={handleChange}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono border bg-white dark:bg-charcoal-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors leading-relaxed ${
                errors.description ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
              }`}
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              💡 If you paste unit-wise text (e.g. <span className="font-semibold text-slate-700 dark:text-slate-300">Unit 1: Topic A, Topic B</span>), StudySense will automatically classify topics under their respective Units!
            </p>
            {errors.description && (
              <p className="text-xs text-rose-500 mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Card Accent Color
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => handleColorSelect(c.value)}
                  className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                    formData.color === c.value ? 'scale-125 ring-2 ring-offset-2 ring-brand-500' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                  aria-label={`Select ${c.label} color`}
                />
              ))}
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
              {isEditing ? 'Save Changes' : 'Create Subject'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubjectModal;
