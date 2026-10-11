import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, HelpCircle, Check, AlertCircle } from 'lucide-react';
import { questionService } from '../../services/quizService';
import { subjectService } from '../../services/subjectService';

const QuestionModal = ({ isOpen, onClose, onSaved, editingQuestion = null }) => {
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    questionText: '',
    questionType: 'single_choice',
    options: [
      { id: 'opt_1', text: '' },
      { id: 'opt_2', text: '' },
      { id: 'opt_3', text: '' },
      { id: 'opt_4', text: '' },
    ],
    correctOptionId: 'opt_1',
    explanation: '',
    difficulty: 'Medium',
    tags: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Load user's subjects
  useEffect(() => {
    if (isOpen) {
      const fetchSubjects = async () => {
        try {
          setLoadingSubjects(true);
          const res = await subjectService.getAllSubjects();
          if (res.data?.success) {
            setSubjects(res.data.data || []);
          }
        } catch (err) {
          console.error('Failed to load subjects:', err);
        } finally {
          setLoadingSubjects(false);
        }
      };
      fetchSubjects();
    }
  }, [isOpen]);

  // Sync edit mode
  useEffect(() => {
    if (editingQuestion) {
      setFormData({
        subject: editingQuestion.subject?._id || editingQuestion.subject || '',
        topic: editingQuestion.topic?._id || editingQuestion.topic || '',
        questionText: editingQuestion.questionText || '',
        questionType: editingQuestion.questionType || 'single_choice',
        options: editingQuestion.options?.length
          ? editingQuestion.options.map((opt) => ({ id: opt.id, text: opt.text }))
          : [
              { id: 'opt_1', text: '' },
              { id: 'opt_2', text: '' },
            ],
        correctOptionId: editingQuestion.correctOptionId || '',
        explanation: editingQuestion.explanation || '',
        difficulty: editingQuestion.difficulty || 'Medium',
        tags: Array.isArray(editingQuestion.tags) ? editingQuestion.tags.join(', ') : '',
      });
    } else {
      setFormData({
        subject: '',
        topic: '',
        questionText: '',
        questionType: 'single_choice',
        options: [
          { id: 'opt_1', text: '' },
          { id: 'opt_2', text: '' },
          { id: 'opt_3', text: '' },
          { id: 'opt_4', text: '' },
        ],
        correctOptionId: 'opt_1',
        explanation: '',
        difficulty: 'Medium',
        tags: '',
      });
    }
    setErrors({});
    setServerError(null);
  }, [editingQuestion, isOpen]);

  if (!isOpen) return null;

  const currentSubjectObj = subjects.find((s) => s._id === formData.subject);
  const availableTopics = currentSubjectObj?.topics || [];

  const handleSubjectChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      subject: e.target.value,
      topic: '', // reset topic when subject changes
    }));
    if (errors.subject) setErrors((prev) => ({ ...prev, subject: null }));
  };

  const handleAddOption = () => {
    if (formData.options.length >= 8) return;
    const nextId = `opt_${Date.now()}_${formData.options.length + 1}`;
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, { id: nextId, text: '' }],
    }));
  };

  const handleRemoveOption = (indexToRemove) => {
    if (formData.options.length <= 2) return;
    const optionToRemove = formData.options[indexToRemove];
    const newOptions = formData.options.filter((_, idx) => idx !== indexToRemove);

    let nextCorrect = formData.correctOptionId;
    if (formData.correctOptionId === optionToRemove.id) {
      nextCorrect = newOptions[0].id;
    }

    setFormData((prev) => ({
      ...prev,
      options: newOptions,
      correctOptionId: nextCorrect,
    }));
  };

  const handleOptionTextChange = (index, text) => {
    setFormData((prev) => {
      const newOptions = [...prev.options];
      newOptions[index] = { ...newOptions[index], text };
      return { ...prev, options: newOptions };
    });
  };

  const validate = () => {
    const errs = {};
    if (!formData.subject) errs.subject = 'Subject is required';
    if (!formData.questionText.trim()) {
      errs.questionText = 'Question text is required';
    } else if (formData.questionText.trim().length < 5) {
      errs.questionText = 'Question text must be at least 5 characters';
    }

    if (formData.options.length < 2) {
      errs.options = 'At least 2 options are required';
    } else {
      const hasEmpty = formData.options.some((opt) => !opt.text.trim());
      if (hasEmpty) {
        errs.options = 'All option fields must have text';
      }
    }

    if (!formData.correctOptionId) {
      errs.correctOptionId = 'Please select which option is correct';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      setServerError(null);

      const parsedTags = formData.tags
        ? formData.tags
            .split(',')
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean)
        : [];

      const payload = {
        subject: formData.subject,
        topic: formData.topic || null,
        questionText: formData.questionText.trim(),
        questionType: formData.questionType,
        options: formData.options.map((opt) => ({
          id: opt.id,
          text: opt.text.trim(),
        })),
        correctOptionId: formData.correctOptionId,
        explanation: formData.explanation.trim(),
        difficulty: formData.difficulty,
        tags: parsedTags,
      };

      let response;
      if (editingQuestion) {
        response = await questionService.updateQuestion(editingQuestion._id, payload);
      } else {
        response = await questionService.createQuestion(payload);
      }

      if (response.data?.success) {
        onSaved(response.data.data);
        onClose();
      }
    } catch (err) {
      console.error('Error saving question:', err);
      setServerError(err.response?.data?.message || 'Failed to save question. Please check the fields.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm">
              <HelpCircle size={20} />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </h3>
              <p className="text-xs text-slate-500">
                Store multiple-choice assessment questions in your Question Bank
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
            {serverError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Subject and Topic Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Subject <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.subject}
                  onChange={handleSubjectChange}
                  disabled={loadingSubjects}
                  className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white ${
                    errors.subject ? 'border-rose-400' : 'border-slate-200'
                  }`}
                >
                  <option value="">Select a Subject</option>
                  {subjects.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
                {errors.subject && <p className="text-rose-600 text-xs mt-1">{errors.subject}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Topic <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <select
                  value={formData.topic}
                  onChange={(e) => setFormData((prev) => ({ ...prev, topic: e.target.value }))}
                  disabled={!formData.subject || availableTopics.length === 0}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">No specific topic</option>
                  {availableTopics.map((top) => (
                    <option key={top._id} value={top._id}>
                      {top.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Question Text */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Question Text <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Enter the question prompt here..."
                value={formData.questionText}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, questionText: e.target.value }));
                  if (errors.questionText) setErrors((prev) => ({ ...prev, questionText: null }));
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-400 resize-none ${
                  errors.questionText ? 'border-rose-400' : 'border-slate-200'
                }`}
              />
              {errors.questionText && <p className="text-rose-600 text-xs mt-1">{errors.questionText}</p>}
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Answer Options <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Select the radio button beside the correct option
                  </span>
                </div>
                {formData.options.length < 8 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    <Plus size={14} />
                    Add Option
                  </button>
                )}
              </div>

              {errors.options && <p className="text-rose-600 text-xs">{errors.options}</p>}

              <div className="space-y-2">
                {formData.options.map((opt, index) => {
                  const isCorrect = formData.correctOptionId === opt.id;
                  return (
                    <div
                      key={opt.id}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                        isCorrect ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-200 bg-white'
                      }`}
                    >
                      {/* Correct Option Radio Button */}
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, correctOptionId: opt.id }))}
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                          isCorrect
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'border border-slate-300 hover:border-slate-400 bg-white'
                        }`}
                        title="Mark as correct answer"
                        aria-label={`Mark option ${index + 1} as correct`}
                      >
                        {isCorrect && <Check size={14} strokeWidth={3} />}
                      </button>

                      <input
                        type="text"
                        placeholder={`Option ${index + 1}`}
                        value={opt.text}
                        onChange={(e) => handleOptionTextChange(index, e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />

                      {formData.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Remove option"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanation */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Answer Explanation <span className="text-slate-400 font-normal">(Revealed during review)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Explain why this answer is correct..."
                value={formData.explanation}
                onChange={(e) => setFormData((prev) => ({ ...prev, explanation: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-400 resize-none"
              />
            </div>

            {/* Difficulty & Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Difficulty Level
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData((prev) => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tags <span className="text-slate-400 font-normal">(Comma separated)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. osi, networking, layer4"
                  value={formData.tags}
                  onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm shadow-indigo-100 transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving Question...' : editingQuestion ? 'Update Question' : 'Save Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionModal;
