import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, ArrowRight, Layers } from 'lucide-react';
import Button from '../common/Button';

const SubjectOverviewSection = ({ subjects = [] }) => {
  const hasSubjects = subjects && subjects.length > 0;

  return (
    <div className="bg-white dark:bg-charcoal-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Subjects & Topic Mastery
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Curriculum progression and topic evaluations
            </p>
          </div>
        </div>

        <Link
          to="/subjects"
          className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {hasSubjects ? (
        <div className="mt-5 space-y-3">
          {subjects.map((subject) => (
            <Link
              key={subject.id || subject._id || subject.name}
              to={`/subjects/${subject.id}`}
              className="block p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">
                    {subject.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {subject.completedCount || 0} of {subject.topicsCount || 0} topics completed
                    {subject.masteredCount ? ` (${subject.masteredCount} mastered)` : ''}
                  </p>
                </div>
                <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
                  {subject.progressPercentage || 0}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-charcoal-900 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, subject.progressPercentage || 0))}%`,
                    backgroundColor: subject.color || '#3b82f6',
                  }}
                />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* Empty state when no subjects have been added yet */
        <div className="mt-6 py-8 px-4 text-center rounded-xl bg-slate-50 dark:bg-charcoal-900/60 border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Your subjects will appear here
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1 leading-relaxed">
            Create your academic subjects to track topic completion and curriculum mastery.
          </p>
          <div className="mt-4">
            <Link to="/subjects">
              <Button variant="primary" size="sm" className="gap-1.5 text-xs">
                <Plus className="w-4 h-4" />
                <span>Go to My Subjects</span>
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectOverviewSection;

