import React, { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  Sun,
  Moon,
  LogOut,
  User,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../common/Button';
import { NAV_ITEMS } from '../../constants/navigation';

const Topbar = ({ title = 'Dashboard' }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-charcoal-850/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      {/* Primary Brand & User Controls Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                  StudySense
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                  LMS
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:block leading-none mt-0.5">
                Smart Study Evaluator
              </p>
            </div>
          </Link>

          <span className="hidden lg:inline-flex items-center gap-1.5 ml-3 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Workspace
          </span>
        </div>

        {/* Right: Controls, Mode, User Profile, Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-charcoal-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Identity Chip (Clickable to /settings) */}
          <div className="flex items-center gap-1.5 sm:gap-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
            <Link
              to="/settings"
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-charcoal-800 transition-all cursor-pointer group"
              title="Click to view Profile & Settings"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 via-indigo-500 to-purple-600 text-white font-semibold text-xs flex items-center justify-center shadow-sm group-hover:ring-2 group-hover:ring-brand-500 group-hover:scale-105 transition-all">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : <User className="w-4 h-4" />}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {user?.name || 'Student'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  {user?.email}
                </span>
              </div>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="ml-1 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 border-slate-200 dark:border-slate-700 gap-1.5"
              aria-label="Log out of StudySense"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>

          {/* Mobile hamburger toggle button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-charcoal-800 focus:outline-none focus:ring-2 focus:ring-brand-500 ml-1"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Desktop Horizontal Navigation Bar */}
      <nav className="hidden xl:block border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-charcoal-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 py-1.5 overflow-x-auto scrollbar-none">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            if (item.isImplemented) {
              return (
                <NavLink
                  key={item.name}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300 shadow-sm border border-brand-200/80 dark:border-brand-800/80 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-charcoal-800 hover:text-slate-900 dark:hover:text-white border border-transparent'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            }

            return (
              <div
                key={item.name}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 dark:text-slate-500 cursor-not-allowed select-none opacity-70 whitespace-nowrap"
                title={`${item.name} will be unlocked in ${item.badge}`}
              >
                <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{item.name}</span>
                <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-charcoal-800 text-slate-500 dark:text-slate-400">
                  {item.badge}
                </span>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Medium & Mobile Drawer Menu (When open on smaller viewports) */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-charcoal-850 px-4 py-3 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="px-2 pb-1.5 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
            Navigation Menu
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;

              if (item.isImplemented) {
                return (
                  <NavLink
                    key={item.name}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/80 dark:text-brand-300 font-semibold border border-brand-200 dark:border-brand-800'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-charcoal-800 hover:text-slate-900 dark:hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              }

              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 dark:text-slate-500 cursor-not-allowed select-none opacity-70"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-charcoal-800">
                    {item.badge}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

export default Topbar;
