import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';
import Navbar from '../common/Navbar';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-charcoal-900 text-slate-800 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Decorative/Contextual Panel (Hidden on small mobile) */}
          <div className="lg:col-span-5 hidden lg:flex flex-col justify-center space-y-6 pr-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60 text-xs font-semibold w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Study Evaluator</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Study smarter, master subjects, elevate results.
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                StudySense combines structured study sessions, instant knowledge checks, and revision planners to boost academic performance.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/70 dark:bg-charcoal-850/60 border border-slate-200/80 dark:border-slate-800 backdrop-blur-sm">
                <div className="p-2 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    HttpOnly Cookie Authentication
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Industry-standard XSS-resistant session management.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/70 dark:bg-charcoal-850/60 border border-slate-200/80 dark:border-slate-800 backdrop-blur-sm">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                    Modular MCA Architecture
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Clean MVC backend with robust validation and security layers.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Card Panel (Authentication Form Container) */}
          <div className="lg:col-span-7 flex justify-center w-full">
            <div className="w-full max-w-md bg-white dark:bg-charcoal-850 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8">
              {(title || subtitle) && (
                <div className="mb-6 text-center sm:text-left">
                  {title && (
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {subtitle}
                    </p>
                  )}
                </div>
              )}

              {children}
            </div>
          </div>

        </div>
      </main>

      <footer className="py-4 border-t border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-400 dark:text-slate-500">
        StudySense — Smart Study Evaluator & LMS &copy; {new Date().getFullYear()} MCA Project
      </footer>
    </div>
  );
};

export default AuthLayout;
