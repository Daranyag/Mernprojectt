import React from 'react';
import { ArrowLeft } from 'lucide-react';
import useSafeBackNavigation from '../../hooks/useSafeBackNavigation';

/**
 * Universal BackButton component matching StudySense design guidelines.
 * Accessible with label, keyboard focus, and mobile-friendly touch targets.
 *
 * @param {string} fallback - Destination if history is unavailable (default: '/dashboard')
 * @param {string} label - Optional text label to display next to arrow
 * @param {string} className - Optional container styling
 */
const BackButton = ({
  fallback = '/dashboard',
  label = '',
  className = ''
}) => {
  const handleBack = useSafeBackNavigation(fallback);

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-charcoal-800 hover:bg-slate-100 dark:hover:bg-charcoal-700 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-2xs transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer ${className}`}
      aria-label="Go back to previous page"
      title="Go back (Alt + Left Arrow)"
    >
      <ArrowLeft className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      {label && <span>{label}</span>}
    </button>
  );
};

export default BackButton;
