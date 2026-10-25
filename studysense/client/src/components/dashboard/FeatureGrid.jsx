import React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  HelpCircle,
  GraduationCap,
  BookMarked,
  ListChecks,
  BarChart3,
  Settings,
  Sparkles,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

const FEATURE_CARDS = [
  {
    name: 'Subjects & Topics',
    to: '/subjects',
    icon: BookOpen,
    desc: 'Browse curriculum, syllabi & units',
    badge: 'Curriculum',
    gradient: 'from-blue-500 to-indigo-600',
    lightBg: 'bg-blue-50/80 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50',
    hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-700',
    actionText: 'Manage Subjects',
  },
  {
    name: 'Study Materials',
    to: '/materials',
    icon: FileText,
    desc: 'Access lecture notes, PDFs & online resources',
    badge: 'Notes & Files',
    gradient: 'from-indigo-500 to-purple-600',
    lightBg: 'bg-indigo-50/80 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50',
    hoverBorder: 'hover:border-indigo-300 dark:hover:border-indigo-700',
    actionText: 'Open Materials',
  },

  {
    name: 'Interactive Quizzes',
    to: '/quizzes',
    icon: GraduationCap,
    desc: 'Take timed tests and assess topic knowledge',
    badge: 'Assessments',
    gradient: 'from-emerald-500 to-teal-600',
    lightBg: 'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50',
    hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    actionText: 'Take a Quiz',
  },
  {
    name: 'Mistake Book',
    to: '/mistake-book',
    icon: BookMarked,
    desc: 'Review wrong answers, notes & practice again',
    badge: 'Self-Correction',
    gradient: 'from-rose-500 to-pink-600',
    lightBg: 'bg-rose-50/80 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50',
    hoverBorder: 'hover:border-rose-300 dark:hover:border-rose-700',
    actionText: 'Practice Mistakes',
  },
  {
    name: 'Exam Paper Generator',
    to: '/exam-paper-generator',
    icon: FileText,
    desc: 'Generate balanced MCA papers and mock tests',
    badge: 'Mock Papers',
    gradient: 'from-cyan-500 to-blue-600',
    lightBg: 'bg-cyan-50/80 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 border-cyan-100 dark:border-cyan-900/50',
    hoverBorder: 'hover:border-cyan-300 dark:hover:border-cyan-700',
    actionText: 'Generate Paper',
  },
  {
    name: 'Important Topics',
    to: '/important-topics',
    icon: ListChecks,
    desc: 'Prioritize high-yield exam topics and key formulas',
    badge: 'High-Yield Topics',
    gradient: 'from-fuchsia-500 to-pink-600',
    lightBg: 'bg-fuchsia-50/80 dark:bg-fuchsia-950/30 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-100 dark:border-fuchsia-900/50',
    hoverBorder: 'hover:border-fuchsia-300 dark:hover:border-fuchsia-700',
    actionText: 'View Topics',
  },
  {
    name: 'Performance Analytics',
    to: '/analytics',
    icon: BarChart3,
    desc: 'Mastery scores, accuracy insights & statistics',
    badge: 'Analytics',
    gradient: 'from-violet-500 to-purple-600',
    lightBg: 'bg-violet-50/80 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-900/50',
    hoverBorder: 'hover:border-violet-300 dark:hover:border-violet-700',
    actionText: 'View Analytics',
  },
  {
    name: 'Settings & Profile',
    to: '/settings',
    icon: Settings,
    desc: 'Update account details, preferences and security',
    badge: 'Profile',
    gradient: 'from-slate-600 to-slate-800',
    lightBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    hoverBorder: 'hover:border-slate-400 dark:hover:border-slate-600',
    actionText: 'Manage Account',
  },
];

const FeatureGrid = () => {
  return (
    <section aria-labelledby="features-heading" className="space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <div>
          <div className="flex items-center gap-2">
            <h2 id="features-heading" className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              All Study Features
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              <Sparkles className="w-3 h-3 text-brand-500" />
              Quick Launch
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Tap or click any feature card to directly jump in and begin studying
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {FEATURE_CARDS.map((feat) => {
          const Icon = feat.icon;
          return (
            <Link
              key={feat.name}
              to={feat.to}
              className={`group relative bg-white dark:bg-charcoal-850 p-4 sm:p-4.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between ${feat.hoverBorder}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${feat.gradient} text-white flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${feat.lightBg}`}>
                    {feat.badge}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {feat.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {feat.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-brand-600 dark:text-brand-400 group-hover:text-brand-700 dark:group-hover:text-brand-300">
                <span>{feat.actionText}</span>
                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default FeatureGrid;
