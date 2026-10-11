import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '../common/Button';

const DashboardError = ({ error, onRetry, isRetrying }) => {
  return (
    <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/30 p-6 sm:p-8 text-center flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6" />
      </div>

      <div className="space-y-1 max-w-md">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Failed to load dashboard metrics
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {error?.message ||
            'We encountered a problem while communicating with the StudySense API. Please verify your connection and try again.'}
        </p>
      </div>

      <Button
        variant="primary"
        size="sm"
        onClick={onRetry}
        isLoading={isRetrying}
        className="gap-2 text-xs"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Retry Dashboard Request</span>
      </Button>
    </div>
  );
};

export default DashboardError;
