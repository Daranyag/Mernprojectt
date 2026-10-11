import React from 'react';
import {
  FileText,
  Globe,
  Star,
  CheckCircle2,
  ExternalLink,
  Edit2,
  Trash2,
  Tag,
  BookOpen,
  Clock,
  Eye,
  FileUp,
} from 'lucide-react';

const MaterialCard = ({
  material,
  onView,
  onEdit,
  onDelete,
  onToggleFavorite,
  onToggleReviewed,
}) => {
  const isNote = material.type === 'note';
  const isPdf = material.type === 'pdf';

  const subjectName = typeof material.subject === 'object' && material.subject?.name
    ? material.subject.name
    : 'Subject';

  const subjectColor = typeof material.subject === 'object' && material.subject?.color
    ? material.subject.color
    : '#3b82f6';

  const topicTitle = typeof material.topic === 'object' && material.topic?.title
    ? material.topic.title
    : null;

  return (
    <div className="group relative bg-white dark:bg-charcoal-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      {/* Top indicator bar matching subject color */}
      <div
        className="absolute top-0 left-5 right-5 h-1 rounded-b-full"
        style={{ backgroundColor: subjectColor }}
      />

      <div>
        {/* Header: Type icon, title, favorite star */}
        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                isNote
                  ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/70 dark:text-brand-400'
                  : isPdf
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400'
                  : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400'
              }`}
            >
              {isNote ? (
                <FileText className="w-5 h-5" />
              ) : isPdf ? (
                <FileUp className="w-5 h-5" />
              ) : (
                <Globe className="w-5 h-5" />
              )}
            </div>

            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onView(material)}
                className="text-left font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors line-clamp-1"
                title={material.title}
              >
                {material.title}
              </button>

              <div className="flex items-center gap-2 mt-1">
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: `${subjectColor}15`, color: subjectColor }}
                >
                  <BookOpen className="w-3 h-3" />
                  <span className="truncate max-w-[120px]">{subjectName}</span>
                </span>

                {topicTitle ? (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                    &bull; {topicTitle}
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-charcoal-800 text-slate-500 dark:text-slate-400">
                    🌐 General / Overall
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Favorite toggle star */}
          <button
            type="button"
            onClick={() => onToggleFavorite(material._id || material.id)}
            className="p-1 rounded-lg text-slate-300 hover:text-amber-500 transition-colors shrink-0 cursor-pointer"
            title={material.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
            aria-label="Toggle favorite"
          >
            <Star
              className={`w-4 h-4 ${
                material.isFavorite ? 'text-amber-500 fill-amber-500' : ''
              }`}
            />
          </button>
        </div>

        {/* Content snippet, PDF info, or Resource URL */}
        <div className="mt-3.5">
          {isNote ? (
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
              {material.content || 'Empty note.'}
            </p>
          ) : isPdf ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-900">
                  PDF Document
                </span>
                {material.pageCount > 0 && (
                  <span className="font-medium text-slate-500">
                    {material.pageCount} page{material.pageCount > 1 ? 's' : ''}
                  </span>
                )}
                {material.fileSize > 0 && (
                  <span className="text-slate-400">
                    &bull; {(material.fileSize / 1024 / 1024).toFixed(2)} MB
                  </span>
                )}
              </div>
              {material.content && (
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {material.content}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              {material.url && (
                <a
                  href={material.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline max-w-full truncate"
                  title={material.url}
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{material.url}</span>
                </a>
              )}
              {material.content && (
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {material.content}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        {material.tags && material.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-2">
            {material.tags.slice(0, 4).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-charcoal-800 text-slate-600 dark:text-slate-400"
              >
                <Tag className="w-2.5 h-2.5" />
                <span>{tag}</span>
              </span>
            ))}
            {material.tags.length > 4 && (
              <span className="text-[10px] text-slate-400">+{material.tags.length - 4}</span>
            )}
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
        {/* Reviewed Status Pill Toggle */}
        <button
          type="button"
          onClick={() => onToggleReviewed(material._id || material.id)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
            material.isReviewed
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-slate-100 text-slate-600 dark:bg-charcoal-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
          }`}
          title={material.isReviewed ? 'Mark as pending review' : 'Mark as reviewed'}
        >
          <CheckCircle2 className={`w-3.5 h-3.5 ${material.isReviewed ? 'text-emerald-500' : 'text-slate-400'}`} />
          <span>{material.isReviewed ? 'Reviewed' : 'Mark Reviewed'}</span>
        </button>

        {/* Card Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onView(material)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-charcoal-800 transition-colors"
            title="Read / View Full Material"
            aria-label="View material"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(material)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-charcoal-800 transition-colors"
            title="Edit Material"
            aria-label="Edit material"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(material)}
            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Delete Material"
            aria-label="Delete material"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaterialCard;
