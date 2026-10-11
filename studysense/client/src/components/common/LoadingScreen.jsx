import React from 'react';
import { GraduationCap, Loader2 } from 'lucide-react';

const LoadingScreen = ({ message = 'Initializing StudySense...' }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-charcoal-900 text-slate-800 dark:text-slate-100 p-4 transition-colors">
      <div className="flex flex-col items-center max-w-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 mb-6 animate-pulse">
          <GraduationCap className="w-9 h-9" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
          StudySense
        </h2>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
