import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Topbar from '../dashboard/Topbar';
import BackButton from '../common/BackButton';

const DashboardLayout = ({
  children,
  title = 'Dashboard',
  showBackButton,
  backFallback = '/dashboard'
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Show back button on all pages except the primary dashboard unless explicitly set
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';
  const shouldShowBack = showBackButton !== undefined ? showBackButton : !isDashboard;

  // Global Keyboard shortcuts: Alt + Left Arrow for back navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is currently typing in an input, textarea, or contentEditable element
      const targetTag = e.target.tagName?.toLowerCase();
      if (
        targetTag === 'input' ||
        targetTag === 'textarea' ||
        e.target.isContentEditable
      ) {
        return;
      }

      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        if (!isDashboard) {
          if (window.history.length > 2) {
            navigate(-1);
          } else {
            navigate(backFallback, { replace: true });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, isDashboard, backFallback]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-charcoal-900 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Top Navigation Bar */}
      <Topbar title={title} />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        {shouldShowBack && (
          <div className="flex items-center justify-between pb-1 -mt-1 print:hidden">
            <BackButton fallback={backFallback} label="Back" />
          </div>
        )}
        {children}
      </main>

      {/* Global Footer */}
      <footer className="py-5 border-t border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-charcoal-850/50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>StudySense: Smart Study Evaluator & LMS &bull; MCA Project</span>
          <span className="font-mono text-[11px] text-slate-400">
            Top Navigation Mode
          </span>
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;
