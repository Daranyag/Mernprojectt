import React, { useState } from 'react';
import {
  X,
  BookMarked,
  CheckCircle,
  XCircle,
  Bookmark,
  Calendar,
  Save,
  Play,
  Trash2,
  Folder,
  Sparkles,
} from 'lucide-react';

const MistakeDetailModal = ({
  isOpen,
  onClose,
  mistake,
  onUpdateNote,
  onToggleReview,
  onDelete,
  onPracticeSingle,
  onExplain,
}) => {
  if (!isOpen || !mistake) return null;

  const [noteText, setNoteText] = useState(mistake.personalNote || '');
  const [savingNote, setSavingNote] = useState(false);

  const handleSaveNote = async () => {
    try {
      setSavingNote(true);
      await onUpdateNote(mistake._id, noteText);
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'corrected':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'practicing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'needs_review':
      default:
        return 'bg-rose-100 text-rose-800 border-rose-200';
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
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-rose-600 text-white shadow-sm">
              <BookMarked size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(mistake.status)}`}>
                  {mistake.status === 'corrected'
                    ? 'Corrected'
                    : mistake.status === 'practicing'
                    ? 'Practicing'
                    : 'Needs Review'}
                </span>
                {mistake.isMarkedForReview && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Marked for Review
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-1 line-clamp-1">
                Saved Question Misconception
              </h3>
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

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Metadata chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {mistake.subject && (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-medium text-white shadow-2xs"
                style={{ backgroundColor: mistake.subject.color || '#6366F1' }}
              >
                <Folder size={11} />
                {mistake.subject.name}
              </span>
            )}
            {mistake.topic && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                Topic: {mistake.topic.title}
              </span>
            )}
            <span className="text-slate-400">
              Missed {mistake.incorrectCount} time{mistake.incorrectCount !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Question Text */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-900 text-sm font-semibold leading-relaxed">
            {mistake.questionSnapshot}
          </div>

          {/* Options Breakdown */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Answer Breakdown
            </h4>
            <div className="space-y-2">
              {mistake.optionsSnapshot?.map((opt) => {
                const wasStudentChoice = opt.id === mistake.selectedOptionId;
                const isCorrectAnswer = opt.id === mistake.correctOptionId;

                let borderStyle = 'border-slate-200 bg-white text-slate-700';
                if (isCorrectAnswer) {
                  borderStyle = 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-semibold';
                } else if (wasStudentChoice) {
                  borderStyle = 'border-rose-400 bg-rose-50/50 text-rose-950 font-semibold';
                }

                return (
                  <div
                    key={opt.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${borderStyle}`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          isCorrectAnswer
                            ? 'bg-emerald-600 text-white'
                            : wasStudentChoice
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isCorrectAnswer ? '✓' : wasStudentChoice ? '✗' : '•'}
                      </span>
                      <span>{opt.text}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {wasStudentChoice && (
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-medium">
                          Your Initial Choice
                        </span>
                      )}
                      {isCorrectAnswer && (
                        <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold">
                          Correct Answer
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Explanation Snapshot */}
          {mistake.explanationSnapshot && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed">
              <strong className="text-slate-900">Why this answer is correct: </strong>
              {mistake.explanationSnapshot}
            </div>
          )}

          {/* Personal Learning Note */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Personal Learning Note
              </label>
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={savingNote}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
              >
                <Save size={12} />
                {savingNote ? 'Saving...' : 'Save Note'}
              </button>
            </div>
            <textarea
              rows={3}
              placeholder="Record your misconception or memory hook (e.g. 'I confused transport layer protocols with application protocols')..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleReview(mistake._id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                mistake.isMarkedForReview
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Bookmark size={13} className={mistake.isMarkedForReview ? 'fill-amber-500' : ''} />
              {mistake.isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}
            </button>

            <button
              onClick={() => onDelete(mistake)}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
              title="Delete mistake"
            >
              <Trash2 size={15} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onExplain && (
              <button
                type="button"
                onClick={() => onExplain(mistake)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
                title="Get step-by-step conceptual breakdown from StudySense AI"
              >
                <Sparkles size={13} className="text-amber-300" />
                <span>Explain to Me</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onPracticeSingle(mistake._id);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Play size={13} fill="currentColor" />
              Practice this Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MistakeDetailModal;
