import React from 'react';

const SummaryCard = ({
  title,
  value,
  displayValue,
  unit,
  subtitle,
  icon: Icon,
  accentColor = 'brand', // 'brand' | 'emerald' | 'amber' | 'violet'
  statusBadge,
}) => {
  const colorMap = {
    brand: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      border: 'border-blue-100 dark:border-blue-900/50',
      text: 'text-brand-600 dark:text-brand-400',
      badge: 'bg-blue-100/70 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-100 dark:border-emerald-900/50',
      text: 'text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-100 dark:border-amber-900/50',
      text: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-100/70 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    },
    violet: {
      bg: 'bg-violet-50 dark:bg-violet-950/40',
      border: 'border-violet-100 dark:border-violet-900/50',
      text: 'text-violet-600 dark:text-violet-400',
      badge: 'bg-violet-100/70 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
    },
  };

  const scheme = colorMap[accentColor] || colorMap.brand;

  // Render value or N/A
  const shownValue = displayValue !== undefined ? displayValue : (value !== null && value !== undefined ? value : '—');

  return (
    <div className="bg-white dark:bg-charcoal-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {title}
          </span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {shownValue}
            </span>
            {unit && shownValue !== '—' && shownValue !== 'N/A' && (
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                {unit}
              </span>
            )}
          </div>
        </div>

        <div className={`p-3 rounded-xl ${scheme.bg} ${scheme.text} border ${scheme.border}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">
          {subtitle}
        </span>
        {statusBadge && (
          <span className={`px-2 py-0.5 rounded-full font-medium text-[11px] ${scheme.badge}`}>
            {statusBadge}
          </span>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;
