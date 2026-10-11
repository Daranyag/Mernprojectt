import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

const Alert = ({
  type = 'error',
  message,
  onDismiss,
  className = '',
}) => {
  if (!message) return null;

  const styles = {
    error: {
      bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200',
      icon: AlertCircle,
      iconColor: 'text-rose-600 dark:text-rose-400',
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200',
      icon: AlertTriangle,
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    info: {
      bg: 'bg-brand-50 dark:bg-brand-950/40 border-brand-200 dark:border-brand-900/60 text-brand-800 dark:text-brand-200',
      icon: Info,
      iconColor: 'text-brand-600 dark:text-brand-400',
    },
  };

  const current = styles[type] || styles.error;
  const IconComponent = current.icon;

  return (
    <div
      role="alert"
      className={`flex items-start p-3.5 rounded-lg border text-sm transition-all duration-150 ${current.bg} ${className}`}
    >
      <IconComponent className={`w-5 h-5 shrink-0 mr-3 mt-0.5 ${current.iconColor}`} />
      <div className="flex-1 font-medium leading-relaxed">{message}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-3 inline-flex text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
