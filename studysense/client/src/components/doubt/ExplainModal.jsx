import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Layers,
  Volume2,
  VolumeX,
  FileText,
  BookmarkPlus,
  Loader2,
  HelpCircle,
  ChevronRight,
  Folder,
} from 'lucide-react';
import doubtSolverService from '../../services/doubtSolverService';
import materialService from '../../services/materialService';

const ExplainModal = ({
  isOpen,
  onClose,
  questionText,
  options = [],
  userSelectedOption = '',
  correctOption = '',
  authorExplanation = '',
  subject = null,
  topic = null,
  unit = '',
}) => {
  const [loading, setLoading] = useState(false);
  const [breakdown, setBreakdown] = useState(null);
  const [error, setError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [savedNoteSuccess, setSavedNoteSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && questionText) {
      fetchExplanation();
    } else {
      setBreakdown(null);
      setError(null);
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      setSavedNoteSuccess(false);
    }
  }, [isOpen, questionText]);

  const fetchExplanation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await doubtSolverService.explainConcept({
        questionText,
        options,
        userSelectedOption,
        correctOption,
        authorExplanation,
        subjectId: subject?._id || subject?.id || null,
        topicId: topic?._id || topic?.id || null,
        unit,
      });

      if (res.success && res.data?.breakdown) {
        setBreakdown(res.data.breakdown);
      } else {
        throw new Error(res.message || 'Could not retrieve conceptual breakdown');
      }
    } catch (err) {
      console.error('[ExplainModal] Error fetching explanation:', err);
      setError(err.response?.data?.message || err.message || 'Failed to explain concept');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVoice = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported by your browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!breakdown) return;

    const speechText = [
      breakdown.summary,
      ...((breakdown.steps || []).map((s) => `Step ${s.stepNumber}: ${s.title}. ${s.explanation}`)),
      breakdown.commonPitfalls ? `Common pitfall: ${breakdown.commonPitfalls}` : '',
      breakdown.memoryRule ? `Memory trick: ${breakdown.memoryRule}` : '',
    ]
      .filter(Boolean)
      .join(' ');

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleSaveAsStudyNote = async () => {
    if (!breakdown || !subject) {
      alert('Please ensure a subject is linked to save this note.');
      return;
    }

    setSavingNote(true);
    try {
      const noteContent = `### Conceptual Breakdown: ${questionText}

**Summary:** ${breakdown.summary}

${(breakdown.steps || [])
  .map((s) => `#### Step ${s.stepNumber}: ${s.title}\n${s.explanation}`)
  .join('\n\n')}

${breakdown.commonPitfalls ? `**Exam Pitfalls:** ${breakdown.commonPitfalls}\n` : ''}
${breakdown.memoryRule ? `**Memory Rule:** ${breakdown.memoryRule}` : ''}`;

      await materialService.create({
        type: 'note',
        title: `Clarification: ${questionText.slice(0, 50)}...`,
        subject: subject._id || subject.id,
        topic: topic?._id || topic?.id || null,
        content: noteContent,
        tags: ['doubt-solver', 'remedial', breakdown.subjectName || 'curriculum'],
        isFavorite: true,
      });

      setSavedNoteSuccess(true);
      setTimeout(() => setSavedNoteSuccess(false), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not save note to Study Materials');
    } finally {
      setSavingNote(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-charcoal-850 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 p-5 text-white flex items-start justify-between gap-3 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-white/20 backdrop-blur-xs text-white">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </span>
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                Context-Aware Concept Breakdown
              </h2>
            </div>
            <p className="text-xs text-brand-100 max-w-md leading-relaxed">
              Step-by-step pedagogical explanation resolving misconceptions and referencing your active syllabus.
            </p>
          </div>

          <button
            onClick={() => {
              window.speechSynthesis?.cancel();
              onClose();
            }}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Academic Context Bar */}
        <div className="px-5 py-2.5 bg-slate-50 dark:bg-charcoal-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
            <Folder className="w-3.5 h-3.5 text-brand-500" />
            <span>Subject: <strong>{subject?.name || breakdown?.subjectName || 'Current Course'}</strong></span>
            {topic?.title && (
              <>
                <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                <span>Topic: <strong>{topic.title}</strong></span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleVoice}
              disabled={loading || !breakdown}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                isSpeaking
                  ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse'
                  : 'bg-white dark:bg-charcoal-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
              title={isSpeaking ? 'Stop speaking' : 'Listen with voice assistant'}
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isSpeaking ? 'Stop Voice' : 'Read Out Loud'}</span>
            </button>

            {subject && (
              <button
                onClick={handleSaveAsStudyNote}
                disabled={loading || !breakdown || savingNote || savedNoteSuccess}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-charcoal-800 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 hover:bg-brand-50"
                title="Save explanation into Study Materials"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>{savedNoteSuccess ? 'Saved to Notes!' : savingNote ? 'Saving...' : 'Save as Note'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Question Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-charcoal-900 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5 text-brand-500" />
              <span>Target Question / Concept</span>
            </div>
            <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-relaxed">
              {questionText}
            </p>

            {(userSelectedOption || correctOption) && (
              <div className="pt-2 flex flex-wrap gap-2 text-xs">
                {userSelectedOption && (
                  <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-medium">
                    Your Answer: <strong>{userSelectedOption}</strong>
                  </span>
                )}
                {correctOption && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium">
                    Correct Answer: <strong>{correctOption}</strong>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
              <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Synthesizing conceptual breakdown...
                </p>
                <p className="text-xs text-slate-400">
                  Referencing syllabus definitions, notes, and breaking down answer options.
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={fetchExplanation}
                className="px-2.5 py-1 rounded bg-rose-600 text-white font-semibold hover:bg-rose-700"
              >
                Retry
              </button>
            </div>
          )}

          {/* Explanation Content */}
          {breakdown && !loading && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Summary Callout */}
              <div className="p-4 rounded-2xl bg-brand-50/80 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60">
                <div className="flex items-center gap-2 text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">
                  <Lightbulb className="w-4 h-4 text-brand-600" />
                  <span>Key Conceptual Takeaway</span>
                </div>
                <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                  {breakdown.summary}
                </p>
              </div>

              {/* Step-by-Step Breakdown Cards */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Step-by-Step Pedagogical Walkthrough</span>
                </h3>

                <div className="space-y-2.5">
                  {(breakdown.steps || []).map((step, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {step.stepNumber || idx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {step.title}
                        </h4>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-7">
                        {step.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pitfalls & Memory Rule Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {breakdown.commonPitfalls && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Exam Pitfalls</span>
                    </div>
                    <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                      {breakdown.commonPitfalls}
                    </p>
                  </div>
                )}

                {breakdown.memoryRule && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Memory Rule / Trick</span>
                    </div>
                    <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                      {breakdown.memoryRule}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-charcoal-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>StudySense Context-Aware Academic Engine</span>
          <button
            onClick={() => {
              window.speechSynthesis?.cancel();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold shadow-xs cursor-pointer"
          >
            Done Learning
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExplainModal;
