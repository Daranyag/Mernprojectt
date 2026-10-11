import React from 'react';

const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Loading dashboard metrics">
      {/* Welcome Banner Skeleton */}
      <div className="h-44 rounded-2xl bg-slate-200 dark:bg-charcoal-800 w-full" />

      {/* 4 Summary Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 rounded-2xl bg-slate-200 dark:bg-charcoal-800 p-5 space-y-3"
          >
            <div className="h-4 w-24 bg-slate-300 dark:bg-charcoal-700 rounded" />
            <div className="h-8 w-16 bg-slate-300 dark:bg-charcoal-700 rounded" />
            <div className="h-3 w-32 bg-slate-300 dark:bg-charcoal-700 rounded" />
          </div>
        ))}
      </div>

      {/* 2-Column Overview Grids Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 rounded-2xl bg-slate-200 dark:bg-charcoal-800" />
        <div className="h-64 rounded-2xl bg-slate-200 dark:bg-charcoal-800" />
      </div>

      {/* Bottom Grids Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-56 rounded-2xl bg-slate-200 dark:bg-charcoal-800" />
        <div className="h-56 rounded-2xl bg-slate-200 dark:bg-charcoal-800" />
      </div>
    </div>
  );
};

export default DashboardSkeleton;
