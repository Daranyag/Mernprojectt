import React from 'react';
import Navbar from '../common/Navbar';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-charcoal-900 text-slate-800 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="py-6 border-t border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>StudySense: Smart Study Evaluator & LMS</span>
          <span className="font-mono text-[11px] text-slate-400">Secure Session Protected</span>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
