import React, { useState } from 'react';
import { Sparkles, FileText, X, CheckCircle2, AlertCircle, Copy, Check, Download, BookmarkPlus } from 'lucide-react';
import materialService from '../../services/materialService';
import ColorfulNotesViewer from './ColorfulNotesViewer';
import BriefStudyModal from './BriefStudyModal';

const NOTE_STYLES = [
  'Quick Revision Notes',
  'Unit-Wise Notes',
  'Topic-Wise Notes',
  'Important Definitions',
  'Formula and Key Points Sheet',
  'Short Question-and-Answer Notes',
  'Exam Preparation Notes',
  '2-Mark Answer Notes',
  '5-Mark Answer Notes',
  '10-Mark Answer Notes',
  '14-Mark Answer Notes'
];

export const NotesGeneratorModal = ({
  isOpen,
  onClose,
  subjects = [],
  initialSubjectId = '',
  initialTopicId = '',
  initialUnit = '',
  onNotesSaved
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubjectId || (subjects[0]?._id || ''));
  const [selectedUnit, setSelectedUnit] = useState(initialUnit || '');
  const [selectedTopicId, setSelectedTopicId] = useState(initialTopicId || '');
  const [noteStyle, setNoteStyle] = useState('Quick Revision Notes');
  const [sourceScope, setSourceScope] = useState('general_knowledge'); // 'general_knowledge' | 'material_only' | 'combined'
  const [customInstructions, setCustomInstructions] = useState('');

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [generatedNotes, setGeneratedNotes] = useState(null);
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Deep-dive Brief Study state
  const [briefStudyOpen, setBriefStudyOpen] = useState(false);
  const [briefStudyTopic, setBriefStudyTopic] = useState('');

  if (!isOpen) return null;

  const currentSubject = subjects.find((s) => s._id === selectedSubjectId);
  const currentTopics = currentSubject?.topics || [];

  // Units list derived from topics
  const availableUnits = Array.from(new Set(currentTopics.map((t) => t.unit).filter(Boolean)));

  const handleGenerate = async () => {
    if (!selectedSubjectId) {
      setError('Please select a subject');
      return;
    }
    setError('');
    setNotice('');
    setGenerating(true);
    setGeneratedNotes(null);
    setSavedSuccess(false);

    try {
      const response = await materialService.generateNotes({
        subjectId: selectedSubjectId,
        unit: selectedUnit,
        topicIds: selectedTopicId ? [selectedTopicId] : [],
        noteStyle,
        sourceScope,
        customInstructions,
        autoSave: false
      });

      if (response?.data?.notes) {
        if (response.data.fallbackNotice) {
          setNotice(response.data.fallbackNotice);
        }
        setGeneratedNotes(response.data.notes);
      } else {
        setError('No notes returned from generation service');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to generate notes');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveToMaterials = async () => {
    if (!generatedNotes) return;
    setSaving(true);
    setError('');
    try {
      const response = await materialService.createMaterial({
        type: 'note',
        title: generatedNotes.title || `${noteStyle} - ${currentSubject?.name}`,
        subject: selectedSubjectId,
        topic: selectedTopicId || null,
        unit: selectedUnit || '',
        content: generatedNotes.content,
        tags: ['AI-Notes', noteStyle]
      });

      setSavedSuccess(true);
      if (onNotesSaved) {
        onNotesSaved(response.data);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    if (generatedNotes?.content) {
      navigator.clipboard.writeText(generatedNotes.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800/80 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI Short Notes Generator</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Generate high-yield revision notes, definitions, formula sheets, or exam-style answers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {notice && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-sm">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong>Curriculum Notice: </strong> {notice}
              </div>
              <button
                type="button"
                onClick={() => setNotice('')}
                className="text-xs text-amber-700 hover:text-amber-900 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {!generatedNotes ? (
            <div className="space-y-5">
              {/* Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Subject Selection */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Subject *
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => {
                      setSelectedSubjectId(e.target.value);
                      setSelectedUnit('');
                      setSelectedTopicId('');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="">Select a subject...</option>
                    {subjects.map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Note Style */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Note Style / Format *
                  </label>
                  <select
                    value={noteStyle}
                    onChange={(e) => setNoteStyle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    {NOTE_STYLES.map((style) => (
                      <option key={style} value={style}>
                        {style}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Optional Unit */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Unit / Module (Optional)
                  </label>
                  {availableUnits.length > 0 ? (
                    <select
                      value={selectedUnit}
                      onChange={(e) => setSelectedUnit(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      <option value="">All Units / Entire Subject</option>
                      {availableUnits.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Unit 1: Introduction"
                      value={selectedUnit}
                      onChange={(e) => setSelectedUnit(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  )}
                </div>

                {/* Optional Topic */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Topic Focus (Optional)
                  </label>
                  <select
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="">All Topics in Unit / Subject</option>
                    {currentTopics.map((top) => (
                      <option key={top._id} value={top._id}>
                        {top.unit ? `[${top.unit}] ` : ''}{top.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Source Scope Mode */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Knowledge Source Grounding
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                    sourceScope === 'general_knowledge'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}>
                    <input
                      type="radio"
                      name="sourceScope"
                      value="general_knowledge"
                      checked={sourceScope === 'general_knowledge'}
                      onChange={() => setSourceScope('general_knowledge')}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">University Curriculum Standard</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Synthesizes standard academic syllabus concepts for this subject.</div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                    sourceScope === 'combined'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}>
                    <input
                      type="radio"
                      name="sourceScope"
                      value="combined"
                      checked={sourceScope === 'combined'}
                      onChange={() => setSourceScope('combined')}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">Curriculum + Saved Notes</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Blends your existing uploaded study materials with syllabus knowledge.</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Custom Instructions */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Custom Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Emphasize differences between threads and processes with a comparison table..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>
          ) : (
            /* Result View */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">{generatedNotes.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium">
                      {generatedNotes.noteStyle}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Scope: {generatedNotes.sourceScope}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy Text'}
                  </button>
                  <button
                    onClick={handleSaveToMaterials}
                    disabled={saving || savedSuccess}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-semibold shadow-sm transition disabled:opacity-50"
                  >
                    {savedSuccess ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Saved in Materials!
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        {saving ? 'Saving...' : 'Save to Study Materials'}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Colorful Visual Note Display with Study Briefly buttons */}
              <div className="max-h-[60vh] overflow-y-auto pr-1">
                <ColorfulNotesViewer
                  content={generatedNotes.content}
                  title={generatedNotes.title}
                  subjectName={currentSubject?.name || 'Subject Notes'}
                  subjectId={selectedSubjectId}
                  noteStyle={generatedNotes.noteStyle || noteStyle}
                  onStudyBriefly={(topic) => {
                    setBriefStudyTopic(topic);
                    setBriefStudyOpen(true);
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          {generatedNotes ? (
            <button
              onClick={() => setGeneratedNotes(null)}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition"
            >
              ← Configure Another Note
            </button>
          ) : (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Generated notes can be saved directly to your notes collection.
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition"
            >
              {generatedNotes ? 'Close' : 'Cancel'}
            </button>
            {!generatedNotes && (
              <button
                onClick={handleGenerate}
                disabled={generating || !selectedSubjectId}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating Notes...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Notes
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Deep-dive Brief Study Modal */}
      <BriefStudyModal
        isOpen={briefStudyOpen}
        onClose={() => setBriefStudyOpen(false)}
        topicTitle={briefStudyTopic}
        subjectName={currentSubject?.name || 'Subject'}
        subjectId={selectedSubjectId}
      />
    </div>
  );
};

export default NotesGeneratorModal;
