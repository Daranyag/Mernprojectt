import React from 'react';
import { Edit2, Trash2, CheckCircle2, Clock, CircleDot, Award, Flag } from 'lucide-react';

const STATUS_CONFIG = {
  'Not Started': {
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    icon: CircleDot,
    iconColor: 'text-slate-400',
  },
  'In Progress': {
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    icon: Clock,
    iconColor: 'text-blue-500',
  },
  'Completed': {
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
  },
  'Mastered': {
    badge: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-800',
    icon: Award,
    iconColor: 'text-violet-500',
  },
};

const PRIORITY_BADGES = {
  Low: 'text-slate-500 bg-slate-100 dark:bg-charcoal-800',
  Medium: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400',
  High: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-400',
};

const TopicCard = ({ topic, onEdit, onDelete, onStatusChange }) => {
  const currentConfig = STATUS_CONFIG[topic.status] || STATUS_CONFIG['Not Started'];
  const StatusIcon = currentConfig.icon;

  const handleQuickStatusChange = (e) => {
    onStatusChange(topic.id, e.target.value);
  };

  return (
    <div className="bg-white dark:bg-charcoal-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all duration-150 flex flex-col justify-between">
      <div>
        {/* Header with Title, Unit, and Priority */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            {topic.unit && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md w-fit">
                {topic.unit}
              </span>
            )}
            <div className="flex items-center gap-2.5 min-w-0">
              <StatusIcon className={`w-5 h-5 shrink-0 ${currentConfig.iconColor}`} />
              <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-1" title={topic.title}>
                {topic.title}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border border-transparent ${
                PRIORITY_BADGES[topic.priority] || PRIORITY_BADGES.Medium
              }`}
            >
              {topic.priority} Priority
            </span>
          </div>
        </div>

        {/* Subtopics Pills if available */}
        {Array.isArray(topic.subtopics) && topic.subtopics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {topic.subtopics.map((sub, i) => (
              <span
                key={i}
                className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
              >
                • {sub}
              </span>
            ))}
          </div>
        )}


        {/* Description / Notes */}
        {topic.description ? (
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 line-clamp-3 leading-relaxed">
            {topic.description}
          </p>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-2.5">
            No notes added for this topic.
          </p>
        )}
      </div>

      {/* Footer controls: Status Selector & Edit/Delete actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label htmlFor={`status-${topic.id}`} className="text-[11px] font-medium text-slate-400">
            Status:
          </label>
          <select
            id={`status-${topic.id}`}
            value={topic.status}
            onChange={handleQuickStatusChange}
            className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer bg-transparent ${currentConfig.badge}`}
          >
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Mastered">Mastered</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(topic)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-charcoal-800 transition-colors"
            title="Edit Topic"
            aria-label={`Edit ${topic.title}`}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(topic)}
            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Delete Topic"
            aria-label={`Delete ${topic.title}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopicCard;
