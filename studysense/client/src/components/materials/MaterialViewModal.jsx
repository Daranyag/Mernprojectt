import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Link as LinkIcon, 
  ExternalLink, 
  Star, 
  CheckCircle, 
  Calendar, 
  Edit3, 
  Trash2, 
  Clock, 
  Tag, 
  Folder,
  FileUp,
  FileText
} from 'lucide-react';
import ColorfulNotesViewer from './ColorfulNotesViewer';
import BriefStudyModal from './BriefStudyModal';

const MaterialViewModal = ({ 
  isOpen, 
  onClose, 
  material, 
  onEdit, 
  onDelete, 
  onToggleFavorite, 
  onToggleReviewed 
}) => {
  const [briefStudyOpen, setBriefStudyOpen] = useState(false);
  const [briefStudyTopic, setBriefStudyTopic] = useState('');

  if (!isOpen || !material) return null;

  const isNote = material.type === 'note';
  const isPdf = material.type === 'pdf';
  const formattedDate = new Date(material.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const updatedDate = new Date(material.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className={`relative bg-white rounded-2xl ${isNote || isPdf ? 'max-w-4xl' : 'max-w-2xl'} w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header with gradient indicator */}
        <div className={`p-6 border-b border-slate-100 ${
          isNote ? 'bg-indigo-50/50' : isPdf ? 'bg-rose-50/50' : 'bg-emerald-50/50'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`p-2.5 rounded-xl ${
                isNote ? 'bg-indigo-600 text-white' : isPdf ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
              } shadow-sm`}>
                {isNote ? <BookOpen size={20} /> : isPdf ? <FileUp size={20} /> : <LinkIcon size={20} />}
              </span>
              <div>
                <span className={`inline-block text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isNote
                    ? 'bg-indigo-100 text-indigo-700'
                    : isPdf
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {isNote ? 'Study Note' : isPdf ? 'PDF Document' : 'Reference Resource'}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1 line-clamp-2">
                  {material.title}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/80 transition-colors"
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Metadata Bar */}
          <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-slate-600">
            {material.subject && (
              <span 
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium text-white shadow-xs"
                style={{ backgroundColor: material.subject.color || '#6366F1' }}
              >
                <Folder size={12} />
                {material.subject.name}
              </span>
            )}

            {material.topic && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                Topic: {material.topic.title}
              </span>
            )}

            <span className="inline-flex items-center gap-1 text-slate-500">
              <Calendar size={13} />
              Created {formattedDate}
            </span>

            {material.updatedAt !== material.createdAt && (
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Clock size={13} />
                Edited {updatedDate}
              </span>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* PDF Metadata Information Box */}
          {isPdf && (
            <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-rose-600 text-white">
                  <FileUp size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {material.fileName || material.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    {material.pageCount > 0 && <span>{material.pageCount} Pages</span>}
                    {material.fileSize > 0 && (
                      <span>&bull; {(material.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                    )}
                    {material.unit && (
                      <span className="font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                        {material.unit}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* External Resource URL Box */}
          {!isNote && !isPdf && material.url && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 overflow-hidden w-full">
                <ExternalLink size={18} className="text-emerald-600 shrink-0" />
                <a
                  href={material.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-emerald-700 hover:text-emerald-800 hover:underline truncate"
                  title={material.url}
                >
                  {material.url}
                </a>
              </div>
              <a
                href={material.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
              >
                Open Link
                <ExternalLink size={13} />
              </a>
            </div>
          )}

          {/* Content / Notes Text */}
          {material.content ? (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {isNote
                  ? 'Visual Study Notes & Topics'
                  : isPdf
                  ? 'Extracted PDF Study Content & Syllabus'
                  : 'Description & Summary'}
              </h4>
              {isNote ? (
                <div className="max-h-[55vh] overflow-y-auto pr-1">
                  <ColorfulNotesViewer
                    content={material.content}
                    title={material.title}
                    subjectName={material.subject?.name || 'Study Material'}
                    subjectId={material.subject?._id || material.subject}
                    noteStyle="Study Notes"
                    onStudyBriefly={(topic) => {
                      setBriefStudyTopic(topic);
                      setBriefStudyOpen(true);
                    }}
                  />
                </div>
              ) : isPdf ? (
                <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-4">
                  <ColorfulNotesViewer
                    content={material.content}
                    title={material.title}
                    subjectName={material.subject?.name || 'PDF Document'}
                    subjectId={material.subject?._id || material.subject}
                    noteStyle="PDF Summary"
                    onStudyBriefly={(topic) => {
                      setBriefStudyTopic(topic);
                      setBriefStudyOpen(true);
                    }}
                  />
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-normal select-text">
                  {material.content}
                </div>
              )}
            </div>
          ) : (
            !isNote && (
              <p className="text-sm text-slate-400 italic">No description provided for this resource.</p>
            )
          )}

          {/* Tags Section */}
          {material.tags && material.tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Tag size={12} />
                Tags
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {material.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-block text-xs font-medium px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          {/* Quick status toggles */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleFavorite(material._id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                material.isFavorite
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Star size={14} className={material.isFavorite ? 'fill-amber-400 text-amber-500' : 'text-slate-400'} />
              {material.isFavorite ? 'Favorited' : 'Add to Favorites'}
            </button>

            <button
              type="button"
              onClick={() => onToggleReviewed(material._id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                material.isReviewed
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <CheckCircle size={14} className={material.isReviewed ? 'text-emerald-600' : 'text-slate-400'} />
              {material.isReviewed ? 'Reviewed' : 'Mark as Reviewed'}
            </button>
          </div>

          {/* Manage actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(material);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors"
            >
              <Edit3 size={14} />
              Edit
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(material);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-medium transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Brief Study Modal */}
      <BriefStudyModal
        isOpen={briefStudyOpen}
        onClose={() => setBriefStudyOpen(false)}
        topicTitle={briefStudyTopic}
        subjectName={material.subject?.name || 'Subject'}
        subjectId={material.subject?._id || material.subject}
      />
    </div>
  );
};

export default MaterialViewModal;
