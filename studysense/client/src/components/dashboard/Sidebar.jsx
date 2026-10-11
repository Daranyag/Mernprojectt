import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  FileText,
  HelpCircle,
  BookMarked,
  CalendarCheck,
  BarChart3,
  ListChecks,
  LogOut,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  {
    name: 'Dashboard',
    to: '/dashboard',
    icon: LayoutDashboard,
    isImplemented: true,
  },
  {
    name: 'Subjects & Topics',
    to: '/subjects',
    icon: BookOpen,
    isImplemented: true,
  },
  {
    name: 'Study Materials',
    to: '/materials',
    icon: FileText,
    isImplemented: true,
  },
  {
    name: 'Question Bank',
    to: '/question-bank',
    icon: HelpCircle,
    isImplemented: true,
  },
  {
    name: 'Quizzes',
    to: '/quizzes',
    icon: GraduationCap,
    isImplemented: true,
  },
  {
    name: 'Mistake Book',
    to: '/mistake-book',
    icon: BookMarked,
    isImplemented: true,
  },
  {
    name: 'Revision Planner',
    to: '/revisions',
    icon: CalendarCheck,
    isImplemented: false,
    badge: 'Upcoming',
  },
  {
    name: 'Performance Analytics',
    to: '/analytics',
    icon: BarChart3,
    isImplemented: true,
  },
  {
    name: 'Exam Paper Generator',
    to: '/exam-paper-generator',
    icon: FileText,
    isImplemented: true,
  },
  {
    name: 'Important Topics',
    to: '/important-topics',
    icon: ListChecks,
    isImplemented: true,
  },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-charcoal-850 border-r border-slate-200 dark:border-slate-800">
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                StudySense
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                LMS
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Smart Study Evaluator
            </p>
          </div>
        </div>

        {/* Close button on mobile */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-charcoal-800"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
          Learning Navigation
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          if (item.isImplemented) {
            return (
              <NavLink
                key={item.name}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300 shadow-sm border border-brand-200/60 dark:border-brand-800/60'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-charcoal-800 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                <span className="flex-1">{item.name}</span>
              </NavLink>
            );
          }

          // Future modules clearly marked as coming soon and disabled
          return (
            <div
              key={item.name}
              className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 dark:text-slate-500 cursor-not-allowed select-none opacity-80 hover:bg-slate-50 dark:hover:bg-charcoal-900/40"
              title={`${item.name} will be unlocked in ${item.badge}`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                <span>{item.name}</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-charcoal-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                {item.badge}
              </span>
            </div>
          );
        })}
      </nav>

      {/* Module Milestone Footer */}
      <div className="p-3 mx-3 mb-3 rounded-xl bg-slate-50 dark:bg-charcoal-900/70 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Active: Module 4 (Materials & Notes)</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          Next upcoming: Module 5 (Quizzes & Knowledge Checks).
        </p>
      </div>

      {/* User Card & Logout */}
      <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-charcoal-900/50">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/settings"
            className="flex items-center gap-2.5 min-w-0 hover:opacity-85 transition group flex-1"
            title="View Profile & Settings"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-500 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm group-hover:ring-2 group-hover:ring-brand-400">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ST'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {user?.name || 'Student'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {user?.email}
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            title="Log Out"
            className="p-2 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block w-64 lg:w-72 shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          {/* Drawer content */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
