import React from 'react';
import { CalendarCheck, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const RevisionOverviewSection = ({ revisions = [] }) => {
  const hasRevisions = revisions && revisions.length > 0;

  return (
    <div className="bg-white dark:bg-charcoal-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Upcoming Revisions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Spaced repetition and planned topic reviews
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-charcoal-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          Smart Planner
        </span>
      </div>

      {hasRevisions ? (
        <div className="mt-5 space-y-3">
          {revisions.map((rev) => (
            <div
              key={rev.id || rev._id}
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800"
            >
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {rev.topicName}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Due: {new Date(rev.scheduledDate).toLocaleDateString()}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                Pending
              </span>
            </div>
          ))}
        </div>
      ) : (
        /* Honest empty state when Revision Planner is empty */
        <div className="mt-6 py-8 px-4 text-center rounded-xl bg-slate-50 dark:bg-charcoal-900/60 border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            No scheduled revisions
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1 leading-relaxed">
            Personalized revision planning calculates optimal review cycles based on your quiz mistakes, topic mastery levels, and study schedule.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-charcoal-850 border border-slate-200 dark:border-slate-700">
            <span>Automated based on quiz attempts</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevisionOverviewSection;
