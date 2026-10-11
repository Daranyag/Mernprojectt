import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Sparkles,
  CheckSquare,
  Square,
  Trash2,
  Plus,
  ArrowRight,
  Layers,
  Upload,
  AlertCircle,
  FileUp,
  RefreshCw,
} from 'lucide-react';
import Button from '../common/Button';
import Alert from '../common/Alert';
import topicService from '../../services/topicService';
import quizGeneratorService from '../../services/quizGeneratorService';

/**
 * Local rule-based fallback parser so it works instantly without network lag
 */
const parseSyllabusClient = (text) => {
  if (!text || typeof text !== 'string') return [];

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const extracted = [];
  const seen = new Set();
  let currentUnit = '';

  const addTopic = (rawTitle, unit = '') => {
    let title = rawTitle
      .replace(/^[\s*•\-–—#]+/, '')
      .replace(/^(Unit\s*[0-9IVXivx]+[:\-.]?|Module\s*[0-9IVXivx]+[:\-.]?|Chapter\s*[0-9IVXivx]+[:\-.]?|[0-9]+[.)\-]|\([0-9]+\))\s*/i, '')
      .trim();

    if (title.length < 2 || title.length > 120) return;
    if (/^(syllabus|textbook|textbooks|reference|references|course objectives|course outcomes|evaluation|credits|hours)$/i.test(title)) {
      return;
    }

    const lower = title.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      let priority = 'Medium';
      if (/critical|core|advanced|architecture|deadlock|concurrency|paging|algorithm/i.test(lower)) {
        priority = 'High';
      } else if (/overview|introduction|history|basics|summary/i.test(lower)) {
        priority = 'Low';
      }

      extracted.push({
        id: `extracted-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title,
        unit: unit || currentUnit || '',
        subtopics: '',
        description: '',
        priority,
        selected: true,
      });
    }
  };

  for (const line of lines) {
    const unitMatch = line.match(/^(?:Unit|Module|Chapter)\s*([0-9IVXivx]+)?\s*[:\-.]?\s*(.+)?$/i);
    if (unitMatch && !line.includes(',') && !line.includes(';')) {
      currentUnit = line.trim();
      if (unitMatch[2] && unitMatch[2].trim().length >= 2) {
        addTopic(unitMatch[2].trim(), currentUnit);
      }
      continue;
    }

    if (line.includes(',') || line.includes(';')) {
      const parts = line.split(/[,;]/);
      for (const part of parts) {
        addTopic(part, currentUnit);
      }
    } else {
      addTopic(line, currentUnit);
    }
  }

  return extracted;
};

const SyllabusImportModal = ({
  isOpen,
  subject,
  autoGenerate = false,
  onClose,
  onTopicsAdded,
}) => {
  const [syllabusText, setSyllabusText] = useState('');
  const [extractedTopics, setExtractedTopics] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAiExtracting, setIsAiExtracting] = useState(false);
  const [isGeneratingGeneral, setIsGeneratingGeneral] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const fileInputRef = useRef(null);

  // General topic generator function
  const handleGenerateGeneralTopics = async (customSubjectName) => {
    const targetName = customSubjectName || subject?.name || 'Course Subject';
    setError('');
    setIsGeneratingGeneral(true);
    try {
      const res = await topicService.extractTopicsFromSyllabus(subject.id || subject._id, {
        text: '',
        subjectName: targetName,
      });

      const candidates = res.data?.topics || [];
      if (candidates.length > 0) {
        const formatted = candidates.map((c) => ({
          id: `extracted-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          title: c.title,
          unit: c.unit || '',
          subtopics: Array.isArray(c.subtopics) ? c.subtopics.join(', ') : '',
          description: c.description || '',
          priority: c.priority || 'Medium',
          selected: true,
        }));
        setExtractedTopics(formatted);
        setInfoMessage(`Generated ${formatted.length} core curriculum topics for "${targetName}". Check the topics to add or uncheck to drop, or use the trash icon to remove.`);
      } else {
        setError('Could not generate topics automatically. Please enter syllabus text manually.');
      }
    } catch (err) {
      console.error('Error generating general topics:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to auto-generate topics.');
    } finally {
      setIsGeneratingGeneral(false);
    }
  };

  // Initial populate or auto-generate on open
  useEffect(() => {
    if (isOpen) {
      setError('');
      setInfoMessage('');

      if (autoGenerate && subject?.name) {
        handleGenerateGeneralTopics(subject.name);
      } else if (subject?.description && subject.description.trim().length > 0) {
        setSyllabusText(subject.description.trim());
        const initialTopics = parseSyllabusClient(subject.description.trim());
        setExtractedTopics(initialTopics);
      } else {
        setSyllabusText('');
        setExtractedTopics([]);
      }
    }
  }, [isOpen, subject, autoGenerate]);

  if (!isOpen) return null;

  // Handle local extraction
  const handleExtractLocal = () => {
    if (!syllabusText.trim()) {
      setError('Please paste or type syllabus text first.');
      return;
    }
    setError('');
    setIsExtracting(true);
    try {
      const parsed = parseSyllabusClient(syllabusText);
      if (parsed.length === 0) {
        setError('No distinct topics could be parsed. Try separating topics with commas, bullet points, or newlines.');
      } else {
        setExtractedTopics(parsed);
        setInfoMessage(`Extracted ${parsed.length} topics from syllabus text.`);
      }
    } finally {
      setIsExtracting(false);
    }
  };

  // Handle AI smart extraction
  const handleExtractAi = async () => {
    if (!syllabusText.trim()) {
      // If text is empty, auto-generate general topics instead of erroring
      return handleGenerateGeneralTopics();
    }
    setError('');
    setIsAiExtracting(true);
    try {
      const res = await topicService.extractTopicsFromSyllabus(subject.id || subject._id, {
        text: syllabusText,
        subjectName: subject?.name || 'Subject',
      });

      const candidates = res.data?.topics || [];
      if (candidates.length > 0) {
        const formatted = candidates.map((c) => ({
          id: `extracted-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          title: c.title,
          unit: c.unit || '',
          subtopics: Array.isArray(c.subtopics) ? c.subtopics.join(', ') : '',
          description: c.description || '',
          priority: c.priority || 'Medium',
          selected: true,
        }));
        setExtractedTopics(formatted);
        setInfoMessage(`Smart extracted ${formatted.length} topics with units & priorities!`);
      } else {
        handleExtractLocal();
      }
    } catch (err) {
      console.warn('AI Extraction request error, using rule-based parser:', err);
      handleExtractLocal();
    } finally {
      setIsAiExtracting(false);
    }
  };

  // Handle Syllabus Document Upload (PDF, PPTX, TXT)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subjectId', subject.id || subject._id);
      formData.append('title', `Syllabus File - ${file.name}`);

      const res = await quizGeneratorService.ingestFileUpload(formData);
      if (res.success && res.data?.extractedText) {
        setSyllabusText(res.data.extractedText);
        const parsed = parseSyllabusClient(res.data.extractedText);
        setExtractedTopics(parsed);
        setInfoMessage(`Uploaded "${file.name}" and extracted ${parsed.length} topics.`);
      } else {
        throw new Error(res.message || 'Failed to extract text from document.');
      }
    } catch (err) {
      console.error('File syllabus upload error:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to parse syllabus file. Please verify format.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Toggle selection
  const handleToggleSelect = (id) => {
    setExtractedTopics((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t))
    );
  };

  // Toggle select all
  const allSelected = extractedTopics.length > 0 && extractedTopics.every((t) => t.selected);
  const handleToggleSelectAll = () => {
    setExtractedTopics((prev) =>
      prev.map((t) => ({ ...t, selected: !allSelected }))
    );
  };

  // Topic field update
  const handleUpdateTopic = (id, field, value) => {
    setExtractedTopics((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  // Remove topic from list
  const handleRemoveTopic = (id) => {
    setExtractedTopics((prev) => prev.filter((t) => t.id !== id));
  };

  // Add manual topic row
  const handleAddCustomTopic = () => {
    setExtractedTopics((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title: '',
        unit: '',
        subtopics: '',
        description: '',
        priority: 'Medium',
        selected: true,
      },
    ]);
  };

  // Submit bulk creation
  const handleSaveBulk = async () => {
    const selected = extractedTopics.filter((t) => t.selected && t.title.trim().length >= 2);
    if (selected.length === 0) {
      setError('Please select at least one topic with a valid title (minimum 2 characters).');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const payload = {
        topics: selected.map((t) => ({
          title: t.title.trim(),
          unit: t.unit ? t.unit.trim() : '',
          subtopics: t.subtopics
            ? (typeof t.subtopics === 'string' ? t.subtopics.split(',').map((s) => s.trim()).filter(Boolean) : t.subtopics)
            : [],
          description: t.description ? t.description.trim() : '',
          priority: t.priority || 'Medium',
          status: 'Not Started',
        })),
      };

      const res = await topicService.createBulkTopics(subject.id || subject._id, payload);
      const created = res.data?.created || [];
      const count = res.data?.count || created.length;

      onTopicsAdded(created, count, res.data?.skipped || []);
      onClose();
    } catch (err) {
      console.error('Failed to bulk save topics:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save topics.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCount = extractedTopics.filter((t) => t.selected && t.title.trim().length >= 2).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-4xl bg-white dark:bg-charcoal-850 rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-4 pr-8">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-brand-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Generate & Manage Topics for <span className="text-brand-600 dark:text-brand-400">"{subject?.name}"</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Auto-generate comprehensive curriculum topics with AI, upload a syllabus file, or paste course outlines. Select or drop topics before adding.
              </p>
            </div>
          </div>
        </div>

        {/* Fast Action Ribbon: Auto-Generate All Topics */}
        <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-brand-950/40 dark:to-indigo-950/40 border border-brand-200/80 dark:border-brand-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 animate-pulse" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Simply have a subject? Generate all general course topics in 1-click:
            </span>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => handleGenerateGeneralTopics()}
            disabled={isGeneratingGeneral || isExtracting || isAiExtracting || isSaving}
            className="gap-2 text-xs bg-brand-600 hover:bg-brand-700 text-white shadow-sm shrink-0"
          >
            {isGeneratingGeneral ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating Curriculum...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Generate All Topics (AI)</span>
              </>
            )}
          </Button>
        </div>

        {/* Error / Info alerts */}
        {error && (
          <div className="mb-3">
            <Alert type="error" message={error} onDismiss={() => setError('')} className="text-xs" />
          </div>
        )}
        {infoMessage && (
          <div className="mb-3">
            <Alert type="info" message={infoMessage} onDismiss={() => setInfoMessage('')} className="text-xs" />
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className="space-y-4 overflow-y-auto flex-1 pr-1 custom-scrollbar">
          {/* Optional Syllabus Text & Upload Drawer */}
          <details className="group border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-charcoal-900/40 p-3">
            <summary className="cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between select-none">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                <span>Upload Document or Paste Custom Syllabus Text (Optional)</span>
              </span>
              <span className="text-[11px] text-brand-600 dark:text-brand-400 group-open:rotate-180 transition-transform">
                ▼
              </span>
            </summary>

            <div className="space-y-3 pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Paste course outline or syllabus document:
                </span>
                <label
                  htmlFor="syllabus-file-upload"
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>Upload PDF/PPTX/TXT</span>
                  <input
                    id="syllabus-file-upload"
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.pptx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>

              <textarea
                id="syllabus-input"
                rows={3}
                value={syllabusText}
                onChange={(e) => setSyllabusText(e.target.value)}
                placeholder="Paste outline or unit details here (e.g., Unit 1: Introduction, Unit 2: Process Scheduling)..."
                className="w-full px-3 py-2 rounded-xl text-xs font-mono border border-slate-200 dark:border-slate-700 bg-white dark:bg-charcoal-850 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-y"
              />

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleExtractLocal}
                  disabled={isExtracting || !syllabusText.trim()}
                  className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isExtracting ? 'Extracting...' : 'Parse Text'}</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExtractAi}
                  disabled={isAiExtracting || !syllabusText.trim()}
                  className="gap-1.5 text-xs text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span>{isAiExtracting ? 'Analyzing...' : 'Smart Extract'}</span>
                </Button>

                {syllabusText && (
                  <button
                    type="button"
                    onClick={() => setSyllabusText('')}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-auto"
                  >
                    Clear Text
                  </button>
                )}
              </div>
            </div>
          </details>

          {/* Topics Preview & Interactive Checklist (Add, Drop, Remove, Edit) */}
          {extractedTopics.length > 0 ? (
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50 dark:bg-charcoal-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Curriculum Topics ({selectedCount} of {extractedTopics.length} selected to Add)
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    {allSelected ? <Square className="w-3.5 h-3.5" /> : <CheckSquare className="w-3.5 h-3.5" />}
                    <span>{allSelected ? 'Drop All' : 'Add All'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    💡 Checkbox = Add/Drop &bull; Trash = Remove
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCustomTopic}
                    className="gap-1 text-xs py-1 px-2.5 h-7"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Custom</span>
                  </Button>
                </div>
              </div>

              {/* Topics Table/List with Add/Drop selection and Remove */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {extractedTopics.map((topic, index) => (
                  <div
                    key={topic.id}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                      topic.selected
                        ? 'bg-white dark:bg-charcoal-900 border-brand-200 dark:border-brand-900/60 shadow-xs'
                        : 'bg-slate-50/70 dark:bg-charcoal-950/40 border-slate-200/60 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    {/* Add / Drop Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleSelect(topic.id)}
                      className="p-1 text-brand-600 dark:text-brand-400 hover:scale-105 transition-transform shrink-0"
                      title={topic.selected ? 'Click to DROP this topic' : 'Click to ADD this topic'}
                    >
                      {topic.selected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {/* Topic Number */}
                    <span className="text-[11px] font-mono text-slate-400 w-5 text-right shrink-0">
                      #{index + 1}
                    </span>

                    {/* Topic Title & Unit Inputs */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
                      <input
                        type="text"
                        value={topic.title}
                        onChange={(e) => handleUpdateTopic(topic.id, 'title', e.target.value)}
                        placeholder="Topic title..."
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-charcoal-850 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
                      />
                      <input
                        type="text"
                        value={topic.unit}
                        onChange={(e) => handleUpdateTopic(topic.id, 'unit', e.target.value)}
                        placeholder="Unit/Chapter (e.g. Unit 1)..."
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-charcoal-850 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>

                    {/* Priority Selector */}
                    <select
                      value={topic.priority}
                      onChange={(e) => handleUpdateTopic(topic.id, 'priority', e.target.value)}
                      className="px-2 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-charcoal-850 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500 shrink-0"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>

                    {/* Status badge: Add vs Drop */}
                    <span
                      onClick={() => handleToggleSelect(topic.id)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer select-none shrink-0 ${
                        topic.selected
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-100 text-slate-500 dark:bg-charcoal-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {topic.selected ? 'ADD' : 'DROP'}
                    </span>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(topic.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors shrink-0"
                      title="Remove this topic from list"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-10 px-4 text-center rounded-2xl bg-slate-50 dark:bg-charcoal-900/40 border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
              <Sparkles className="w-8 h-8 text-brand-500 mb-2" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Ready to generate topics for "{subject?.name}"
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                Click "Auto-Generate All Topics (AI)" above to generate standard course units and topics, or upload/paste a syllabus.
              </p>
              <div className="mt-4">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => handleGenerateGeneralTopics()}
                  disabled={isGeneratingGeneral}
                  className="gap-2 text-xs bg-brand-600 hover:bg-brand-700 text-white"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate All General Topics</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {selectedCount > 0
              ? `Ready to add ${selectedCount} topics to "${subject?.name}".`
              : 'Generate or select topics to import into this subject.'}
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
              className="text-xs"
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSaveBulk}
              disabled={isSaving || selectedCount === 0}
              className="gap-2 text-xs bg-brand-600 hover:bg-brand-700 text-white shadow-sm shadow-brand-500/20"
            >
              <span>{isSaving ? 'Importing Topics...' : `Add ${selectedCount} Topics to Subject`}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyllabusImportModal;
