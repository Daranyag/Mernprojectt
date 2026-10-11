import React from 'react';
import { History, Sparkles, CheckCircle2 } from 'lucide-react';

const RecentActivitySection = ({ activities = [] }) => {
  const hasActivities = activities && activities.length > 0;

  return (
    <div className="bg-white dark:bg-charcoal-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Learning Activity
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quiz attempts, topic updates, and academic milestones
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-charcoal-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          Activity Stream
        </span>
      </div>

      {hasActivities ? (
        <div className="mt-5 space-y-3">
          {activities.map((item, idx) => (
            <div
              key={item.id || idx}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {item.title}
                </p>
                <p className="text-[11px] text-slate-400">
                  {item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Honest empty state without fabricated entries */
        <div className="mt-6 py-8 px-4 text-center rounded-xl bg-slate-50 dark:bg-charcoal-900/60 border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            No recent learning activity yet
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1 leading-relaxed">
            Your learning activity stream will track completed topic evaluations, quiz attempts, and mastered subjects as you use subsequent modules.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-charcoal-850 border border-slate-200 dark:border-slate-700">
            <span>Awaiting quiz and topic milestones</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecentActivitySection;
