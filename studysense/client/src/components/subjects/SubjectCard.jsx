import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, MoreVertical, Edit2, Trash2, ArrowRight, CheckCircle2, Award } from 'lucide-react';

const SubjectCard = ({ subject, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const totalTopics = subject.topicsCount || 0;
  const completedTopics = subject.completedCount || 0;
  const masteredTopics = subject.masteredCount || 0;
  const progressPercentage = subject.progressPercentage || 0;

  const subjectUrl = `/subjects/${subject.id || subject._id}`;

  const handleCardClick = (e) => {
    // If click was inside the menu or a button/link, don't trigger card navigation
    if (menuRef.current && menuRef.current.contains(e.target)) return;
    if (e.target.closest('button') || e.target.closest('a')) return;
    navigate(subjectUrl);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white dark:bg-charcoal-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-brand-300 dark:hover:border-brand-700 transition-all duration-200 flex flex-col justify-between cursor-pointer"
    >
      {/* Top Color Accent Line */}
      <div
        className="absolute top-0 left-5 right-5 h-1 rounded-b-full"
        style={{ backgroundColor: subject.color || '#3b82f6' }}
      />

      <div>
        {/* Header with Title and Menu */}
        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm shrink-0"
              style={{ backgroundColor: subject.color || '#3b82f6' }}
            >
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <Link
                to={`/subjects/${subject.id || subject._id}`}
                className="font-bold text-base text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors line-clamp-1"
                title={subject.name}
              >
                {subject.name}
              </Link>
              <p className="text-xs text-slate-400 mt-0.5">
                {totalTopics === 1 ? '1 Topic' : `${totalTopics} Topics`}
              </p>
            </div>
          </div>

          {/* Action Menu Dropdown */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-charcoal-800 focus:outline-none"
              aria-label={`Subject actions for ${subject.name}`}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-8 z-20 w-36 bg-white dark:bg-charcoal-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(subject);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-charcoal-700"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit Subject</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(subject);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 line-clamp-2 min-h-[2rem]">
          {subject.description || 'No description provided.'}
        </p>

        {/* Topic Metrics Badges */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="font-semibold">{completedTopics}</span>
            <span className="text-slate-400">Completed</span>
          </div>
          <div className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400">
            <Award className="w-3.5 h-3.5" />
            <span className="font-semibold">{masteredTopics}</span>
            <span className="text-slate-400">Mastered</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            <span>Curriculum Progress</span>
            <span className="text-slate-800 dark:text-slate-200">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-charcoal-900 h-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(0, progressPercentage))}%`,
                backgroundColor: subject.color || '#3b82f6',
              }}
            />
          </div>
        </div>
      </div>

      {/* Card Action Link */}
      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
        <Link
          to={`/subjects/${subject.id || subject._id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 group-hover:translate-x-0.5 transition-transform"
        >
          <span>Open Topics</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default SubjectCard;
