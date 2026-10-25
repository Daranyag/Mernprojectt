import React from 'react';
import { Sparkles, Calendar, BookOpenCheck } from 'lucide-react';

const WelcomeSection = ({ user }) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-700 text-white p-6 sm:p-8 shadow-lg shadow-brand-500/10">
      {/* Background Decorative Circles */}
      <div className="absolute -right-12 -top-12 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute right-20 -bottom-16 w-64 h-64 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-medium border border-white/20">
          <Calendar className="w-3.5 h-3.5 text-brand-200" />
          <span>{currentDate}</span>
          <span className="text-white/40">&bull;</span>
          <span className="text-brand-100">MCA Learning Hub</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
          Welcome back, {user?.name || 'Student'}!
        </h2>

        <p className="text-sm sm:text-base text-brand-100 font-normal leading-relaxed max-w-2xl">
          Organize your learning, practise what you know, and improve your understanding.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-white/90">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/20 backdrop-blur-sm border border-white/10">
            <BookOpenCheck className="w-4 h-4 text-emerald-300" />
            <span>Academic Performance & Mastery</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/20 backdrop-blur-sm border border-white/10">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Smart Evaluator Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeSection;
