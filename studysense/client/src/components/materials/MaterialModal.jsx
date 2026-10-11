import React, { useState, useEffect } from 'react';
import { X, FileText, Globe, Star, Tag, Plus, FileUp, Upload, Sparkles, Layers } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';
import Alert from '../common/Alert';
import subjectService from '../../services/subjectService';
import materialService from '../../services/materialService';

const MaterialModal = ({
  isOpen,
  material = null, // null for create, object for edit
  editingMaterial = null,
  defaultSubjectId = null,
  defaultTopicId = null,
  isLoading = false,
  onClose,
  onSubmit,
  onSaved,
}) => {
  const currentMaterial = material || editingMaterial;
  const [formData, setFormData] = useState({
    type: 'note', // 'note' | 'resource' | 'pdf'
    title: '',
    subject: '',
    topic: '',
    content: '',
    url: '',
    tags: '',
    isFavorite: false,
  });

  const [pdfFile, setPdfFile] = useState(null);
  const [topicSyllabusText, setTopicSyllabusText] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  // Topic input modes: 'select' (scroll added topics), 'type' (single topic), or 'paste' (unit-wise/topics block)
  const [topicMode, setTopicMode] = useState('select');
  const [customTopicTitle, setCustomTopicTitle] = useState('');
  const [customTopicUnit, setCustomTopicUnit] = useState('');

  const isEditing = Boolean(currentMaterial && (currentMaterial.id || currentMaterial._id));

  // Load user's subjects
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      try {
        const res = await subjectService.getSubjects();
        const loadedList = res.data?.subjects || res.data || [];
        if (isMounted) {
          setSubjects(loadedList);
        }
      } catch (err) {
        console.error('[MaterialModal] Error fetching subjects:', err);
      } finally {
        if (isMounted) setLoadingSubjects(false);
      }
    };

    fetchSubjects();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Sync form data on open or material prop change
  useEffect(() => {
    if (currentMaterial) {
      const subjectId = typeof currentMaterial.subject === 'object' && currentMaterial.subject?._id
        ? currentMaterial.subject._id
        : (typeof currentMaterial.subject === 'object' && currentMaterial.subject?.id ? currentMaterial.subject.id : currentMaterial.subject || '');

      const topicId = typeof currentMaterial.topic === 'object' && currentMaterial.topic?._id
        ? currentMaterial.topic._id
        : (typeof currentMaterial.topic === 'object' && currentMaterial.topic?.id ? currentMaterial.topic.id : currentMaterial.topic || '');

      setFormData({
        type: currentMaterial.type || 'note',
        title: currentMaterial.title || '',
        subject: subjectId || '',
        topic: topicId || '',
        content: currentMaterial.content || '',
        url: currentMaterial.url || '',
        tags: Array.isArray(currentMaterial.tags) ? currentMaterial.tags.join(', ') : '',
        isFavorite: Boolean(currentMaterial.isFavorite),
      });
      setTopicMode('select');
      setCustomTopicTitle('');
      setCustomTopicUnit('');
    } else {
      setFormData({
        type: 'note',
        title: '',
        subject: defaultSubjectId || '',
        topic: defaultTopicId || '',
        content: '',
        url: '',
        tags: '',
        isFavorite: false,
      });
      setTopicMode('select');
      setCustomTopicTitle('');
      setCustomTopicUnit('');
    }
    setErrors({});
    setServerError('');
  }, [currentMaterial, isOpen, defaultSubjectId, defaultTopicId]);

  // Load topics when selected subject changes
  useEffect(() => {
    if (!formData.subject) {
      setTopics([]);
      return;
    }

    let isMounted = true;
    const fetchTopics = async () => {
      try {
        const res = await subjectService.getSubjectById(formData.subject);
        const subData = res.data?.subject || res.data;
        const topicList = subData?.topics || [];
        if (isMounted) {
          setTopics(topicList);
          // If selected topic doesn't belong to newly selected subject, reset it
          if (formData.topic) {
            const exists = topicList.some((t) => (t.id || t._id) === formData.topic);
            if (!exists) {
              setFormData((prev) => ({ ...prev, topic: '' }));
            }
          }
        }
      } catch (err) {
        console.error('[MaterialModal] Error fetching subject topics:', err);
      }
    };

    fetchTopics();
    return () => {
      isMounted = false;
    };
  }, [formData.subject]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim() && !pdfFile) {
      newErrors.title = 'Title or file upload is required';
    } else if (formData.title.trim() && formData.title.trim().length > 140) {
      newErrors.title = 'Title cannot exceed 140 characters';
    }

    if (!formData.subject) {
      newErrors.subject = 'Please select a parent subject';
    }

    if (formData.type === 'note') {
      if (!formData.content.trim()) {
        newErrors.content = 'Note content cannot be empty';
      }
    }

    if (formData.type === 'resource') {
      if (!formData.url.trim()) {
        newErrors.url = 'Resource URL is required';
      } else if (!/^https?:\/\/.+/i.test(formData.url.trim())) {
        newErrors.url = 'Please provide a valid web URL starting with http:// or https://';
      }
    }

    if (formData.type === 'pdf') {
      if (!pdfFile && !isEditing) {
        newErrors.pdfFile = 'Please select a .pdf file to upload';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: '' }));
    if (serverError) setServerError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setErrors((prev) => ({ ...prev, pdfFile: 'Only .pdf files are supported' }));
        return;
      }
      setPdfFile(file);
      if (!formData.title) {
        setFormData((prev) => ({ ...prev, title: file.name.replace(/\.pdf$/i, '') }));
      }
      setErrors((prev) => ({ ...prev, pdfFile: '', title: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Process tags
    const tagArray = formData.tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0 && t.length <= 30);

    // If user provided a unit-wise or topics text paste, auto-extract the primary topic and unit
    let resolvedCustomTopic = customTopicTitle.trim();
    let resolvedUnit = customTopicUnit.trim();

    if (topicMode === 'paste' && topicSyllabusText.trim()) {
      const lines = topicSyllabusText.trim().split(/\r?\n/).filter(Boolean);
      for (const line of lines) {
        const uMatch = line.match(/^(?:Unit|Module|Chapter)\s*([0-9IVXivx]+)?\s*[:\-.]?\s*(.*)$/i);
        if (uMatch) {
          if (!resolvedUnit) resolvedUnit = line.trim();
          if (uMatch[2] && uMatch[2].trim()) {
            const firstTop = uMatch[2].split(/[,;]/)[0].trim();
            if (firstTop && !resolvedCustomTopic) resolvedCustomTopic = firstTop;
          }
        } else if (!resolvedCustomTopic) {
          resolvedCustomTopic = line.split(/[,;]/)[0].replace(/^[\s*•\-–—#]+/, '').trim();
        }
      }
      if (!resolvedCustomTopic && topicSyllabusText.trim()) {
        resolvedCustomTopic = topicSyllabusText.trim().slice(0, 60);
      }
    }

    const effectiveTitle = formData.title.trim() || (pdfFile ? pdfFile.name.replace(/\.pdf$/i, '') : 'Study Material');

    setIsUploading(true);
    try {
      let saved;

      if (formData.type === 'pdf' && pdfFile) {
        // Upload multipart PDF
        const uploadData = new FormData();
        uploadData.append('file', pdfFile);
        uploadData.append('title', effectiveTitle);
        uploadData.append('subject', formData.subject);
        if (topicMode === 'select' && formData.topic) {
          uploadData.append('topic', formData.topic);
        } else if (resolvedCustomTopic) {
          uploadData.append('customTopic', resolvedCustomTopic);
        }
        if (resolvedUnit) {
          uploadData.append('unit', resolvedUnit);
        }
        if (formData.tags) {
          uploadData.append('tags', tagArray.join(','));
        }
        uploadData.append('isFavorite', String(formData.isFavorite));

        const res = await materialService.uploadPdfMaterial(uploadData);
        saved = res.data?.material || res.material;
      } else {
        // Regular JSON create or update
        const payload = {
          type: formData.type,
          title: effectiveTitle,
          subject: formData.subject,
          topic: topicMode === 'select' ? (formData.topic || null) : (resolvedCustomTopic || null),
          customTopic: topicMode !== 'select' ? resolvedCustomTopic : '',
          unit: resolvedUnit || (topicMode === 'type' ? customTopicUnit.trim() : ''),
          content: formData.content.trim(),
          url: formData.url.trim(),
          tags: Array.from(new Set(tagArray)),
          isFavorite: formData.isFavorite,
        };

        if (typeof onSubmit === 'function') {
          await onSubmit(payload);
          return;
        } else {
          const targetId = currentMaterial?._id || currentMaterial?.id;
          let res;
          if (targetId) {
            res = await materialService.updateMaterial(targetId, payload);
          } else {
            res = await materialService.createMaterial(payload);
          }
          saved = res.data?.material || res.material || res.data;
        }
      }

      if (typeof onSaved === 'function' && saved) {
        onSaved(saved);
      }
      if (typeof onClose === 'function') onClose();
    } catch (err) {
      setServerError(err.response?.data?.message || err.message || 'Failed to save material. Please verify input.');
      if (err.errors) setErrors(err.errors);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="material-modal-title"
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-charcoal-850 rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
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
          <h3 id="material-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
            {isEditing ? 'Edit Study Material' : 'Add Study Material'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isEditing
              ? 'Update your notes, resource link, tags, or topic associations.'
              : 'Save learning notes or bookmark external resources under your subjects.'}
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
          {/* Material Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Material Type
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, type: 'note' }))}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 sm:px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  formData.type === 'note'
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-charcoal-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <FileText className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>Study Note</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, type: 'pdf' }))}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 sm:px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  formData.type === 'pdf'
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-charcoal-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <FileUp className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>PDF Document</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, type: 'resource' }))}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 sm:px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  formData.type === 'resource'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-charcoal-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Web Resource</span>
              </button>
            </div>
          </div>

          {/* PDF File Upload Input (if PDF type selected) */}
          {formData.type === 'pdf' && (
            <div className="p-4 rounded-xl border border-dashed border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 space-y-2">
              <label className="block text-xs font-semibold text-rose-900 dark:text-rose-200">
                Upload PDF File <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs transition">
                  <Upload className="w-4 h-4" />
                  <span>{pdfFile ? 'Change PDF File' : 'Choose PDF'}</span>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {pdfFile ? (
                  <div className="text-xs text-slate-700 dark:text-slate-300 truncate">
                    <span className="font-semibold text-rose-700 dark:text-rose-400">Selected:</span> {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Upload textbooks, slides, or question banks (.pdf up to 20MB)
                  </span>
                )}
              </div>
              {errors.pdfFile && <p className="text-xs text-rose-600 mt-1">{errors.pdfFile}</p>}
            </div>
          )}

          {/* Title */}
          <Input
            id="title"
            label="Title"
            placeholder={
              formData.type === 'pdf'
                ? 'e.g. Operating Systems Lecture Notes, Unit 1 Textbook PDF'
                : formData.type === 'note'
                ? 'e.g. ACID Properties in DBMS, OSI Model Summary'
                : 'e.g. Official React Documentation, RFC 793 TCP Standard'
            }
            value={formData.title}
            onChange={handleChange}
            error={errors.title}
            required={formData.type !== 'pdf'}
          />

          {/* Subject & Topic Selectors */}
          <div className="space-y-3.5 p-3.5 bg-slate-50 dark:bg-charcoal-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            {/* Subject Selector */}
            <div>
              <label htmlFor="subject" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject <span className="text-rose-500">*</span>
              </label>
              <select
                id="subject"
                value={formData.subject}
                onChange={handleChange}
                disabled={loadingSubjects}
                className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm border bg-white dark:bg-charcoal-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 ${
                  errors.subject ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <option value="">-- Select Subject --</option>
                {subjects.map((s) => {
                  const sId = s._id || s.id;
                  return (
                    <option key={sId} value={sId}>
                      {s.name}
                    </option>
                  );
                })}
              </select>
              {errors.subject && <p className="text-xs text-rose-500 mt-1">{errors.subject}</p>}
            </div>

            {/* Topic Choice: Scrollable selection, Type custom topic, or Paste Unit-Wise / Topics */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Topic Destination
                </label>
                <div className="flex flex-wrap items-center gap-1 bg-white dark:bg-charcoal-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setTopicMode('select')}
                    className={`px-2.5 py-0.5 rounded-md font-medium transition cursor-pointer ${
                      topicMode === 'select'
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    Scroll Added Topics
                  </button>
                  <button
                    type="button"
                    onClick={() => setTopicMode('type')}
                    className={`px-2.5 py-0.5 rounded-md font-medium transition cursor-pointer ${
                      topicMode === 'type'
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    Type Topic
                  </button>
                  <button
                    type="button"
                    onClick={() => setTopicMode('paste')}
                    className={`px-2.5 py-0.5 rounded-md font-medium transition cursor-pointer ${
                      topicMode === 'paste'
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    Paste Unit-Wise / Topics
                  </button>
                </div>
              </div>

              {topicMode === 'select' ? (
                <div>
                  <select
                    id="topic"
                    value={formData.topic}
                    onChange={handleChange}
                    disabled={!formData.subject}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 disabled:opacity-50"
                  >
                    <option value="">🌐 General / Overall (No specific topic)</option>
                    {topics.map((t) => {
                      const tId = t._id || t.id;
                      const unitPrefix = t.unit ? `[${t.unit}] ` : '';
                      return (
                        <option key={tId} value={tId}>
                          {unitPrefix}{t.title}
                        </option>
                      );
                    })}
                  </select>
                  <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-500">
                    <span>
                      {topics.length > 0 
                        ? `${topics.length} topic${topics.length > 1 ? 's' : ''} added under this subject`
                        : formData.subject ? 'No topics found for this subject yet' : 'Select a subject first'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTopicMode('type')}
                      className="text-brand-600 hover:underline font-medium cursor-pointer"
                    >
                      + Type topic name instead
                    </button>
                  </div>
                </div>
              ) : topicMode === 'paste' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="font-semibold">Paste Unit-Wise Syllabus or Topics:</span>
                    <span className="text-brand-600 dark:text-brand-400">✨ Auto-extracts Unit & Topic</span>
                  </div>
                  <textarea
                    rows={4}
                    value={topicSyllabusText}
                    onChange={(e) => setTopicSyllabusText(e.target.value)}
                    placeholder={`e.g. Unit 1: Introduction, Process Synchronization\nUnit 2: Deadlocks, Memory Management\n\nOr simply topics:\nPaging, Virtual Memory, Inverted Page Tables`}
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-mono border border-slate-200 dark:border-slate-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 leading-relaxed"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>💡 Material will be categorized directly under the extracted Unit & Topic!</span>
                    <button
                      type="button"
                      onClick={() => setTopicMode('select')}
                      className="text-brand-600 hover:underline font-medium cursor-pointer shrink-0"
                    >
                      ← Scroll added topics
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Type topic name (e.g. Memory Management)"
                        value={customTopicTitle}
                        onChange={(e) => {
                          setCustomTopicTitle(e.target.value);
                          if (errors.customTopic) setErrors(prev => ({ ...prev, customTopic: '' }));
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-xs sm:text-sm border bg-white dark:bg-charcoal-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 ${
                          errors.customTopic ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                        }`}
                      />
                      {errors.customTopic && <p className="text-xs text-rose-500 mt-1">{errors.customTopic}</p>}
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Unit (e.g. Unit 2)"
                        value={customTopicUnit}
                        onChange={(e) => setCustomTopicUnit(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-charcoal-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>💡 If not already in subject, this topic will be automatically created and stored!</span>
                    <button
                      type="button"
                      onClick={() => setTopicMode('select')}
                      className="text-brand-600 hover:underline font-medium cursor-pointer shrink-0"
                    >
                      ← Scroll added topics
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* External URL for Resources */}
          {formData.type === 'resource' && (
            <div>
              <Input
                id="url"
                label="Resource Web URL"
                type="url"
                placeholder="https://example.com/docs/topic"
                value={formData.url}
                onChange={handleChange}
                error={errors.url}
                required
              />
            </div>
          )}

          {/* Content / Notes textarea (optional for PDF and Resource, required for Note) */}
          {formData.type !== 'pdf' && (
            <div>
              <label
                htmlFor="content"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                {formData.type === 'note' ? 'Note Content' : 'Resource Summary / Overview'}{' '}
                {formData.type === 'note' ? (
                  <span className="text-rose-500">*</span>
                ) : (
                  <span className="text-slate-400 font-normal">(Optional)</span>
                )}
              </label>
              <textarea
                id="content"
                rows={5}
                placeholder={
                  formData.type === 'note'
                    ? 'Write your study notes, key definitions, explanations, formulas, or summaries...'
                    : 'Brief description of what this article, video, or documentation covers...'
                }
                value={formData.content}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border bg-white dark:bg-charcoal-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-sans ${
                  errors.content ? 'border-rose-400' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.content && <p className="text-xs text-rose-500 mt-1">{errors.content}</p>}
            </div>
          )}

          {formData.type === 'pdf' && (
            <div>
              <label
                htmlFor="content"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Additional Notes / Chapter Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="content"
                rows={3}
                placeholder="Optional notes or context about this PDF document..."
                value={formData.content}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-charcoal-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-sans"
              />
            </div>
          )}

          {/* Tags */}
          <div>
            <label
              htmlFor="tags"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Tags <span className="text-slate-400 font-normal">(Comma-separated, e.g. exam, formula, unit-2)</span>
            </label>
            <Input
              id="tags"
              placeholder="e.g. revision, algorithms, midterms"
              value={formData.tags}
              onChange={handleChange}
            />
          </div>

          {/* Favorite Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isFavorite"
              checked={formData.isFavorite}
              onChange={handleChange}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-slate-300 cursor-pointer"
            />
            <label
              htmlFor="isFavorite"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
            >
              <Star className={`w-3.5 h-3.5 ${formData.isFavorite ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
              <span>Mark as favorite for quick access</span>
            </label>
          </div>

          {/* Action buttons */}
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
              {isEditing ? 'Save Changes' : 'Save Material'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaterialModal;
