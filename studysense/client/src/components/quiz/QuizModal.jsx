import React, { useState, useEffect } from 'react';
import { X, GraduationCap, AlertCircle, CheckSquare, Square, Sparkles } from 'lucide-react';
import { questionService } from '../../services/quizService';
import { subjectService } from '../../services/subjectService';

const QuizModal = ({ isOpen, onClose, onSaved, editingQuiz = null, onOpenAIGenerator = null }) => {
  const [subjects, setSubjects] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    topics: [],
    questionIds: [],
    settings: {
      shuffleQuestions: false,
      shuffleOptions: false,
    },
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Load subjects
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

  // Load questions for selected subject
  useEffect(() => {
    if (formData.subject) {
      const fetchQuestionsForSubject = async () => {
        try {
          setLoadingQuestions(true);
          const res = await questionService.getAllQuestions({ subject: formData.subject });
          if (res.data?.success) {
            setQuestions(res.data.data || []);
          }
        } catch (err) {
          console.error('Failed to load questions for subject:', err);
        } finally {
          setLoadingQuestions(false);
        }
      };
      fetchQuestionsForSubject();
    } else {
      setQuestions([]);
    }
  }, [formData.subject]);

  // Sync edit mode
  useEffect(() => {
    if (editingQuiz) {
      setFormData({
        title: editingQuiz.title || '',
        description: editingQuiz.description || '',
        subject: editingQuiz.subject?._id || editingQuiz.subject || '',
        topics: editingQuiz.topics?.map((t) => t._id || t) || [],
        questionIds: editingQuiz.questionIds?.map((q) => q._id || q) || [],
        settings: {
          shuffleQuestions: Boolean(editingQuiz.settings?.shuffleQuestions),
          shuffleOptions: Boolean(editingQuiz.settings?.shuffleOptions),
        },
      });
    } else {
      setFormData({
        title: '',
        description: '',
        subject: '',
        topics: [],
        questionIds: [],
        settings: {
          shuffleQuestions: false,
          shuffleOptions: false,
        },
      });
    }
    setErrors({});
    setServerError(null);
  }, [editingQuiz, isOpen]);

  if (!isOpen) return null;

  const currentSubjectObj = subjects.find((s) => s._id === formData.subject);
  const availableTopics = currentSubjectObj?.topics || [];

  const handleSubjectChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      subject: e.target.value,
      topics: [],
      questionIds: [], // reset questions when subject changes
    }));
    if (errors.subject) setErrors((prev) => ({ ...prev, subject: null }));
  };

  const handleToggleQuestion = (qId) => {
    setFormData((prev) => {
      const exists = prev.questionIds.includes(qId);
      const nextIds = exists ? prev.questionIds.filter((id) => id !== qId) : [...prev.questionIds, qId];
      return { ...prev, questionIds: nextIds };
    });
    if (errors.questionIds) setErrors((prev) => ({ ...prev, questionIds: null }));
  };

  const handleSelectAllQuestions = () => {
    const allIds = questions.map((q) => q._id);
    setFormData((prev) => ({ ...prev, questionIds: allIds }));
  };

  const handleDeselectAllQuestions = () => {
    setFormData((prev) => ({ ...prev, questionIds: [] }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) {
      errs.title = 'Quiz title is required';
    } else if (formData.title.trim().length < 2) {
      errs.title = 'Title must be at least 2 characters';
    }

    if (!formData.subject) {
      errs.subject = 'Subject is required';
    }

    if (!formData.questionIds || formData.questionIds.length === 0) {
      errs.questionIds = 'Please select at least one question from the question bank';
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

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        subject: formData.subject,
        topics: formData.topics,
        questionIds: formData.questionIds,
        settings: formData.settings,
      };

      let res;
      if (editingQuiz) {
        res = await questionService.updateQuiz(editingQuiz._id, payload);
      } else {
        res = await questionService.createQuiz(payload);
      }

      if (res.data?.success) {
        onSaved(res.data.data);
        onClose();
      }
    } catch (err) {
      console.error('Error saving quiz:', err);
      setServerError(err.response?.data?.message || 'Failed to save quiz. Please check fields.');
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
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm">
              <GraduationCap size={20} />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}
              </h3>
              <p className="text-xs text-slate-500">
                Configure quiz parameters and choose questions from your Question Bank
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

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
            {serverError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Quiz Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Quiz Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Unit 1: Operating Systems & Process Scheduling"
                value={formData.title}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, title: e.target.value }));
                  if (errors.title) setErrors((prev) => ({ ...prev, title: null }));
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                  errors.title ? 'border-rose-400' : 'border-slate-200'
                }`}
              />
              {errors.title && <p className="text-rose-600 text-xs mt-1">{errors.title}</p>}
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Subject <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.subject}
                onChange={handleSubjectChange}
                disabled={loadingSubjects}
                className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white ${
                  errors.subject ? 'border-rose-400' : 'border-slate-200'
                }`}
              >
                <option value="">Select Curriculum Subject</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.subject && <p className="text-rose-600 text-xs mt-1">{errors.subject}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Description / Instructions <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Add helpful instructions for this assessment..."
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
              />
            </div>

            {/* Shuffle Settings */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Quiz Settings
              </span>
              <div className="flex flex-wrap gap-6 pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.settings.shuffleQuestions}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        settings: { ...prev.settings, shuffleQuestions: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  Shuffle Question Order
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.settings.shuffleOptions}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        settings: { ...prev.settings, shuffleOptions: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  Shuffle Option Choices
                </label>
              </div>
            </div>

            {/* Question Selector Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Select Questions from Bank <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {formData.questionIds.length} of {questions.length} question(s) selected
                  </span>
                </div>

                {questions.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={handleSelectAllQuestions}
                      className="text-indigo-600 hover:underline font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={handleDeselectAllQuestions}
                      className="text-slate-500 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {errors.questionIds && <p className="text-rose-600 text-xs">{errors.questionIds}</p>}

              <div className="border border-slate-200 rounded-xl max-h-56 overflow-y-auto divide-y divide-slate-100 bg-slate-50/30">
                {!formData.subject ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Please choose a subject first to load its question bank.
                  </div>
                ) : loadingQuestions ? (
                  <div className="p-6 text-center text-xs text-slate-400">Loading questions...</div>
                ) : questions.length === 0 ? (
                  <div className="p-6 text-center space-y-3">
                    <p className="text-xs text-slate-600 font-medium">
                      No questions saved yet for this subject.
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Use the automatic AI Quiz Generator to instantly produce questions from your subject syllabus, units, and materials.
                    </p>
                    {onOpenAIGenerator && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenAIGenerator(formData.subject);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
                      >
                        <Sparkles size={14} />
                        <span>Generate with AI Quiz Generator</span>
                      </button>
                    )}
                  </div>
                ) : (
                  questions.map((q) => {
                    const isSelected = formData.questionIds.includes(q._id);
                    return (
                      <div
                        key={q._id}
                        onClick={() => handleToggleQuestion(q._id)}
                        className={`p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-50/60' : 'hover:bg-slate-50'
                        }`}
                      >
                        <span className="mt-0.5 text-indigo-600">
                          {isSelected ? <CheckSquare size={18} /> : <Square size={18} className="text-slate-300" />}
                        </span>
                        <div className="flex-1 text-xs space-y-1">
                          <p className="font-medium text-slate-800 line-clamp-2">{q.questionText}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            {q.topic && <span>Topic: {q.topic.title}</span>}
                            <span>•</span>
                            <span>{q.difficulty}</span>
                            <span>•</span>
                            <span>{q.options?.length || 0} options</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

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
              {submitting ? 'Saving Quiz...' : editingQuiz ? 'Update Quiz' : 'Create Quiz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuizModal;
