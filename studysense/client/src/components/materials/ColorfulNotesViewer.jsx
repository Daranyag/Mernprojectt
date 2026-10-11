import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Lightbulb,
  CheckCircle2,
  BookmarkPlus,
  Copy,
  Check,
  Code,
  FileText,
  Layers,
  GraduationCap,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import Button from '../common/Button';

const THEME_ACCENTS = [
  {
    border: 'border-blue-200 dark:border-blue-900/60',
    bg: 'bg-blue-50/40 dark:bg-blue-950/20',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    iconColor: 'text-blue-600 dark:text-blue-400',
    buttonColor: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  {
    border: 'border-emerald-200 dark:border-emerald-900/60',
    bg: 'bg-emerald-50/40 dark:bg-emerald-950/20',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    buttonColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  {
    border: 'border-purple-200 dark:border-purple-900/60',
    bg: 'bg-purple-50/40 dark:bg-purple-950/20',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    iconColor: 'text-purple-600 dark:text-purple-400',
    buttonColor: 'bg-purple-600 hover:bg-purple-700 text-white',
  },
  {
    border: 'border-amber-200 dark:border-amber-900/60',
    bg: 'bg-amber-50/40 dark:bg-amber-950/20',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    iconColor: 'text-amber-600 dark:text-amber-400',
    buttonColor: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  {
    border: 'border-rose-200 dark:border-rose-900/60',
    bg: 'bg-rose-50/40 dark:bg-rose-950/20',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    iconColor: 'text-rose-600 dark:text-rose-400',
    buttonColor: 'bg-rose-600 hover:bg-rose-700 text-white',
  },
];

/**
 * Intelligent client-side parser to transform markdown study notes into colorful topic cards
 */
const parseNotesIntoSections = (markdownText) => {
  if (!markdownText) return { overview: '', topics: [], tables: [] };

  const lines = markdownText.split(/\r?\n/);
  let overview = '';
  const topics = [];
  let currentTopic = null;
  let inOverview = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check for overview
    if (/^##\s*(?:Overview|Key Concepts|Summary|Introduction)/i.test(line)) {
      inOverview = true;
      continue;
    }

    // Check for new topic header: ## 1. Topic or ### Section
    const topicMatch = line.match(/^(?:##|###)\s*(?:[0-9]+[.)]\s*)?(?:Section\s*[0-9]+[:.]\s*)?(.+)$/i);
    if (topicMatch && !/^##\s*(?:Overview|Summary|High-Yield)/i.test(line)) {
      inOverview = false;
      if (currentTopic) {
        topics.push(currentTopic);
      }
      currentTopic = {
        title: topicMatch[1].replace(/[*#]/g, '').trim(),
        bullets: [],
        paragraphs: [],
      };
      continue;
    }

    if (inOverview) {
      if (line.startsWith('---') || line.startsWith('##')) {
        inOverview = false;
      } else if (line) {
        overview += (overview ? ' ' : '') + line.replace(/^[*•\-]\s*/, '');
      }
      continue;
    }

    if (currentTopic) {
      if (line.startsWith('*') || line.startsWith('-') || line.startsWith('•')) {
        const cleanBullet = line.replace(/^[*•\-]\s*/, '').trim();
        if (cleanBullet) currentTopic.bullets.push(cleanBullet);
      } else if (line && !line.startsWith('---') && !line.startsWith('#')) {
        currentTopic.paragraphs.push(line);
      }
    }
  }

  if (currentTopic) {
    topics.push(currentTopic);
  }

  return { overview, topics };
};

/**
 * Formats inline bold terms into clean, colorful highlights
 */
const renderFormattedText = (text) => {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldContent = part.slice(2, -2);
      return (
        <span
          key={idx}
          className="font-bold text-slate-900 dark:text-white bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/60 mx-0.5"
        >
          {boldContent}
        </span>
      );
    }
    return <span key={idx}>{part}</span>;
  });
};

export const ColorfulNotesViewer = ({
  content,
  title,
  subjectName = 'Course Subject',
  subjectId = '',
  noteStyle = 'Quick Revision Notes',
  onStudyBriefly,
}) => {
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'doc' | 'raw'
  const { overview, topics } = parseNotesIntoSections(content);

  return (
    <div className="space-y-4">
      {/* View Mode Controls */}
      <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-100 dark:bg-charcoal-900 border border-slate-200 dark:border-slate-800">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 pl-2">
          Display Format:
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'cards'
                ? 'bg-white dark:bg-charcoal-800 text-brand-600 dark:text-brand-300 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Colourful Study Cards</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('doc')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'doc'
                ? 'bg-white dark:bg-charcoal-800 text-brand-600 dark:text-brand-300 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            <span>Reading View</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('raw')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'raw'
                ? 'bg-white dark:bg-charcoal-800 text-brand-600 dark:text-brand-300 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-slate-500" />
            <span>Markdown Source</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: COLOURFUL CARDS */}
      {viewMode === 'cards' && (
        <div className="space-y-4 max-h-[58vh] overflow-y-auto pr-1 custom-scrollbar">
          {/* Executive Overview Hero Card */}
          {overview && (
            <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-brand-500/10 border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
                  <Lightbulb className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                      Core Conceptual Overview
                    </span>
                    <span className="text-xs text-slate-400">&bull; {subjectName}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 mt-2 leading-relaxed font-normal">
                    {renderFormattedText(overview)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Render Colourful Topic Cards */}
          {topics.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {topics.map((topic, idx) => {
                const accent = THEME_ACCENTS[idx % THEME_ACCENTS.length];

                return (
                  <div
                    key={idx}
                    className={`p-5 rounded-2xl border ${accent.border} ${accent.bg} bg-white dark:bg-charcoal-850 shadow-sm hover:shadow-md transition-all space-y-3`}
                  >
                    {/* Header Row: Topic title, Badge, and "Study Briefly" Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <span className={`text-[11px] font-mono font-extrabold px-2.5 py-1 rounded-lg ${accent.badge} shrink-0`}>
                          TOPIC {String(idx + 1).padStart(2, '0')}
                        </span>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">
                          {topic.title}
                        </h4>
                      </div>

                      {/* Study Briefly Interactive Button */}
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => onStudyBriefly(topic.title)}
                        className={`gap-1.5 text-xs ${accent.buttonColor} shadow-sm shrink-0`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Study Briefly</span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Paragraphs */}
                    {topic.paragraphs.map((para, pIdx) => (
                      <p
                        key={pIdx}
                        className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal"
                      >
                        {renderFormattedText(para)}
                      </p>
                    ))}

                    {/* Bullet Points with check icons */}
                    {topic.bullets.length > 0 && (
                      <div className="space-y-2 pt-1">
                        {topic.bullets.map((b, bIdx) => (
                          <div
                            key={bIdx}
                            className="flex items-start gap-2.5 p-2 rounded-xl bg-white/70 dark:bg-charcoal-900/60 border border-slate-200/40 dark:border-slate-800"
                          >
                            <CheckCircle2 className={`w-4 h-4 ${accent.iconColor} shrink-0 mt-0.5`} />
                            <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                              {renderFormattedText(b)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Fallback if no markdown sections could be split */
            <div className="p-5 rounded-2xl bg-white dark:bg-charcoal-850 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {title || 'Study Note Content'}
                </span>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => onStudyBriefly(title || subjectName)}
                  className="gap-1.5 text-xs bg-brand-600 hover:bg-brand-700 text-white"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Study Briefly</span>
                </Button>
              </div>
              <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {renderFormattedText(content)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: FORMATTED READING DOCUMENT */}
      {viewMode === 'doc' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-charcoal-850 border border-slate-200 dark:border-slate-800 max-h-[58vh] overflow-y-auto pr-2 custom-scrollbar text-sm leading-relaxed text-slate-800 dark:text-slate-200 space-y-4">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
            <span className="text-xs text-brand-600 font-semibold">{noteStyle}</span>
          </div>
          <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed font-sans">
            {renderFormattedText(content)}
          </div>
        </div>
      )}

      {/* VIEW 3: RAW MARKDOWN SOURCE */}
      {viewMode === 'raw' && (
        <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-xs font-mono whitespace-pre-wrap max-h-[58vh] overflow-y-auto leading-relaxed border border-slate-800">
          {content}
        </pre>
      )}
    </div>
  );
};

export default ColorfulNotesViewer;
