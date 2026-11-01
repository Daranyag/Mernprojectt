import React, { useState, useEffect } from 'react';
import { 
  StickyNote, Plus, Trash2, CheckCircle2, Copy, Sparkles, 
  Tag, ChevronRight, BookOpen, Layers
} from 'lucide-react';

const STORAGE_KEY = 'studysense_quick_scratchpad_notes';

const DEFAULT_NOTES = [
  {
    id: 'note-1',
    title: 'Operating Systems: Page Fault',
    content: 'A trap raised by hardware when a program accesses a page not mapped in physical memory (RAM). Handler swaps it from disk swap space.',
    category: 'Formula / Definition',
    color: 'amber'
  },
  {
    id: 'note-2',
    title: 'Dbms: ACID Properties',
    content: 'Atomicity (All or None), Consistency (Valid states), Isolation (Concurrent execution safe), Durability (Committed updates persist).',
    category: 'Exam Key Points',
    color: 'indigo'
  }
];

export const QuickNotesScratchpad = () => {
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load scratchpad notes from localStorage', e);
    }
    return DEFAULT_NOTES;
  });

  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'flashcards'
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Key Concept');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.warn('Failed to save scratchpad notes to localStorage', e);
    }
  }, [notes]);

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const colors = ['indigo', 'emerald', 'amber', 'rose', 'blue'];
    const assignedColor = colors[notes.length % colors.length];

    const newNote = {
      id: `note-${Date.now()}`,
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory.trim() || 'Quick Note',
      color: assignedColor,
      createdAt: new Date().toISOString()
    };

    setNotes((prev) => [newNote, ...prev]);
    setNewTitle('');
    setNewContent('');
    setIsAdding(false);
  };

  const handleDeleteNote = (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeCardIndex >= notes.length - 1) {
      setActiveCardIndex(Math.max(0, notes.length - 2));
    }
  };

  const handleCopyNote = (note) => {
    const text = `${note.title}\n\n${note.content}`;
    navigator.clipboard?.writeText(text);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeCard = notes[activeCardIndex] || notes[0];

  return (
    <div className="bg-white dark:bg-charcoal-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <StickyNote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Quick Notes & Flashcards
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scratchpad for formulas, definitions & exam points
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeTab === 'notes'
                  ? 'bg-white dark:bg-charcoal-850 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Notes ({notes.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('flashcards');
                setIsFlipped(false);
              }}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeTab === 'flashcards'
                  ? 'bg-white dark:bg-charcoal-850 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cards
            </button>
          </div>
        </div>

        {/* Content body */}
        {activeTab === 'notes' ? (
          <div className="mt-4 space-y-3">
            {/* Add note toggle / form */}
            {isAdding ? (
              <form onSubmit={handleAddNote} className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 space-y-3 animate-in fade-in duration-200">
                <div>
                  <input
                    type="text"
                    placeholder="Title / Formula name (e.g. Bayes Theorem, Page Fault)..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-charcoal-800 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-charcoal-800 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <option value="Formula / Definition">Formula / Definition</option>
                    <option value="Exam Key Points">Exam Key Points</option>
                    <option value="Quick Reminder">Quick Reminder</option>
                    <option value="Algorithm / Concept">Algorithm / Concept</option>
                  </select>
                </div>
                <div>
                  <textarea
                    rows={2}
                    placeholder="Write key explanation, formula, or quick memory shortcut..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-charcoal-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    Save Note
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Active Scratchpad Notes
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 transition"
                >
                  <Plus size={14} /> Add Quick Note
                </button>
              </div>
            )}

            {/* Notes List */}
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {notes.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <StickyNote size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-xs font-medium">Your scratchpad is empty</p>
                  <button
                    onClick={() => setIsAdding(true)}
                    className="mt-2 text-xs font-bold text-amber-600 hover:underline"
                  >
                    + Add your first quick note
                  </button>
                </div>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="group p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 hover:border-amber-200 hover:bg-amber-50/20 dark:hover:bg-amber-950/10 transition-all bg-white dark:bg-charcoal-800 relative"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {note.title}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                            {note.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed whitespace-pre-wrap">
                          {note.content}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleCopyNote(note)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                          title="Copy text"
                        >
                          {copiedId === note.id ? <CheckCircle2 size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 transition"
                          title="Delete note"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Flashcard View */
          <div className="mt-4 space-y-4">
            {notes.length > 0 && activeCard ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Card {activeCardIndex + 1} of {notes.length}</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Click card to flip
                  </span>
                </div>

                {/* Flip Card */}
                <div
                  onClick={() => setIsFlipped((prev) => !prev)}
                  className="cursor-pointer min-h-[140px] p-5 rounded-2xl border-2 border-dashed border-amber-300/80 dark:border-amber-700/60 bg-gradient-to-br from-amber-50/60 via-white to-amber-50/20 dark:from-charcoal-800 dark:to-charcoal-900 flex flex-col items-center justify-center text-center transition-all hover:shadow-xs select-none"
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                    {isFlipped ? 'Answer / Explanation' : 'Concept / Prompt'}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white max-w-sm">
                    {isFlipped ? activeCard.content : activeCard.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-2">
                    {isFlipped ? 'Tap to view prompt' : 'Tap to flip and reveal answer'}
                  </p>
                </div>

                {/* Flashcard Nav controls */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFlipped(false);
                      setActiveCardIndex((prev) => (prev > 0 ? prev - 1 : notes.length - 1));
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                  >
                    ← Previous
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFlipped((prev) => !prev)}
                    className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition"
                  >
                    Flip Card
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsFlipped(false);
                      setActiveCardIndex((prev) => (prev < notes.length - 1 ? prev + 1 : 0));
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                  >
                    Next →
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400">
                <BookOpen size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs">Add notes first to practice flashcards.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span>Persistent across your sessions</span>
        <span className="font-semibold text-amber-600 dark:text-amber-400">StudySense Memory Pad</span>
      </div>
    </div>
  );
};

export default QuickNotesScratchpad;
