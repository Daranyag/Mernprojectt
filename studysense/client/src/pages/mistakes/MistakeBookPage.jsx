import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  BookMarked,
  Search,
  Filter,
  RotateCcw,
  Play,
  Bookmark,
  CheckCircle,
  Folder,
  Trash2,
  AlertCircle,
  Eye,
  History,
  ArrowUpDown,
  Layers,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { mistakeService } from '../../services/mistakeService';
import { subjectService } from '../../services/subjectService';
import MistakeDetailModal from '../../components/mistakes/MistakeDetailModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import DashboardLayout from '../../components/layouts/DashboardLayout';

const MistakeBookPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [mistakes, setMistakes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View toggle: 'grouped' (Segregated by Subject > Topic) | 'list' (Flat list)
  const [viewLayout, setViewLayout] = useState('grouped');
  const [collapsedSubjects, setCollapsedSubjects] = useState({});

  // Filters & Search initialized from URL search params if present
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get('subject') || '');
  const [selectedTopic, setSelectedTopic] = useState(searchParams.get('topic') || '');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || '');
  const [onlyMarked, setOnlyMarked] = useState(searchParams.get('onlyMarked') === 'true');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals
  const [viewingMistake, setViewingMistake] = useState(null);
  const [deletingMistake, setDeletingMistake] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadSubjects = useCallback(async () => {
    try {
      const res = await subjectService.getAllSubjects();
      if (res.data?.success) {
        setSubjects(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  }, []);

  const fetchMistakes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedSubject) params.subject = selectedSubject;
      if (selectedTopic) params.topic = selectedTopic;
      if (selectedStatus) params.status = selectedStatus;
      if (onlyMarked) params.isMarkedForReview = 'true';
      if (sortBy) params.sortBy = sortBy;
      if (sortOrder) params.sortOrder = sortOrder;

      const res = await mistakeService.getAllMistakes(params);
      if (res.data?.success) {
        setMistakes(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching mistakes:', err);
      setError(err.response?.data?.message || 'Failed to load Mistake Book.');
    } finally {
      setLoading(false);
    }
  }, [search, selectedSubject, selectedTopic, selectedStatus, onlyMarked, sortBy, sortOrder]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  useEffect(() => {
    fetchMistakes();
  }, [fetchMistakes]);

  const currentSubjectObj = subjects.find((s) => s._id === selectedSubject);
  const availableTopics = currentSubjectObj?.topics || [];

  const handleResetFilters = () => {
    setSearch('');
    setSelectedSubject('');
    setSelectedTopic('');
    setSelectedStatus('');
    setOnlyMarked(false);
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const handleToggleReview = async (id) => {
    try {
      const res = await mistakeService.toggleMarkedForReview(id);
      if (res.data?.success) {
        const updated = res.data.data;
        setMistakes((prev) =>
          prev.map((m) => (m._id === id ? { ...m, isMarkedForReview: updated.isMarkedForReview } : m))
        );
        if (viewingMistake?._id === id) {
          setViewingMistake((prev) => ({ ...prev, isMarkedForReview: updated.isMarkedForReview }));
        }
      }
    } catch (err) {
      console.error('Failed to toggle review flag:', err);
    }
  };

  const handleUpdateNote = async (id, noteText) => {
    const res = await mistakeService.updateMistake(id, { personalNote: noteText });
    if (res.data?.success) {
      setMistakes((prev) =>
        prev.map((m) => (m._id === id ? { ...m, personalNote: noteText } : m))
      );
      if (viewingMistake?._id === id) {
        setViewingMistake((prev) => ({ ...prev, personalNote: noteText }));
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingMistake) return;
    try {
      setDeleteLoading(true);
      await mistakeService.deleteMistake(deletingMistake._id);
      setMistakes((prev) => prev.filter((m) => m._id !== deletingMistake._id));
      if (viewingMistake?._id === deletingMistake._id) {
        setViewingMistake(null);
      }
      setDeletingMistake(null);
    } catch (err) {
      console.error('Failed to delete mistake:', err);
      alert(err.response?.data?.message || 'Failed to delete mistake');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Metrics calculation
  const totalNeedsReview = mistakes.filter((m) => m.status === 'needs_review').length;
  const totalCorrected = mistakes.filter((m) => m.status === 'corrected').length;

  return (
    <DashboardLayout title="Mistake Book">
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Top Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mistake Book</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100">
              Module 6
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Automatically track incorrect quiz answers, add personal learning notes, and practice to mastery.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              const query = new URLSearchParams();
              if (selectedSubject) query.set('subject', selectedSubject);
              if (onlyMarked) query.set('onlyMarked', 'true');
              navigate(`/mistake-book/practice?${query.toString()}`);
            }}
            disabled={mistakes.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-sm shadow-rose-100 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <Play size={16} fill="currentColor" />
            <span>Practice Mistakes ({mistakes.length})</span>
          </button>
        </div>
      </div>

      {/* Mini Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <BookMarked size={20} />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Needs Review</div>
            <div className="text-xl font-bold text-slate-900">{totalNeedsReview}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle size={20} />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Corrected Mistakes</div>
            <div className="text-xl font-bold text-slate-900">{totalCorrected}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Bookmark size={20} />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Marked for Review</div>
            <div className="text-xl font-bold text-slate-900">
              {mistakes.filter((m) => m.isMarkedForReview).length}
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by question, explanation, or personal note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <div className="w-full lg:w-48">
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedTopic('');
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full lg:w-48">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              disabled={!selectedSubject || availableTopics.length === 0}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white disabled:bg-slate-50"
            >
              <option value="">All Topics</option>
              {availableTopics.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full lg:w-36">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="needs_review">Needs Review</option>
              <option value="practicing">Practicing</option>
              <option value="corrected">Corrected</option>
            </select>
          </div>
        </div>

        {/* Secondary Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOnlyMarked((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                onlyMarked
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Bookmark size={13} className={onlyMarked ? 'fill-amber-500' : ''} />
              Marked for Review Only
            </button>

            {(search || selectedSubject || selectedTopic || selectedStatus || onlyMarked) && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 transition-colors"
              >
                <RotateCcw size={12} />
                Reset Filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View layout toggle: Grouped by Subject > Topic vs All Mistakes */}
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={() => setViewLayout('grouped')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  viewLayout === 'grouped'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers size={13} />
                By Subject & Topic
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  viewLayout === 'list'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookMarked size={13} />
                All Cards ({mistakes.length})
              </button>
            </div>

            <span className="text-xs text-slate-400 flex items-center gap-1 ml-2">
              <ArrowUpDown size={12} />
              Sort:
            </span>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="incorrectCount-desc">Most Missed</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <p>{error}</p>
        </div>
      )}

      {/* Mistake Cards List or Grouped View */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3 animate-pulse">
              <div className="w-1/4 h-5 bg-slate-200 rounded"></div>
              <div className="w-3/4 h-5 bg-slate-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : mistakes.length > 0 ? (
        viewLayout === 'grouped' ? (
          /* SEGREGATED BY SUBJECT > TOPIC VIEW */
          <div className="space-y-6">
            {(() => {
              // Group mistakes by subject -> topic
              const subjectGroups = {};
              mistakes.forEach((m) => {
                const sId = m.subject?._id || 'unassigned';
                const sName = m.subject?.name || 'General / Uncategorized';
                const sColor = m.subject?.color || '#6366F1';

                if (!subjectGroups[sId]) {
                  subjectGroups[sId] = {
                    subjectId: sId,
                    subjectName: sName,
                    subjectColor: sColor,
                    topics: {},
                    totalCount: 0,
                  };
                }

                subjectGroups[sId].totalCount += 1;

                const tId = m.topic?._id || 'general';
                const tTitle = m.topic?.title || 'General Subject Questions';

                if (!subjectGroups[sId].topics[tId]) {
                  subjectGroups[sId].topics[tId] = {
                    topicId: tId,
                    topicTitle: tTitle,
                    mistakes: [],
                  };
                }

                subjectGroups[sId].topics[tId].mistakes.push(m);
              });

              return Object.values(subjectGroups).map((sg) => {
                const isCollapsed = collapsedSubjects[sg.subjectId];
                return (
                  <div
                    key={sg.subjectId}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all"
                  >
                    {/* Subject Header Banner */}
                    <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-indigo-50/30 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setCollapsedSubjects((prev) => ({
                              ...prev,
                              [sg.subjectId]: !prev[sg.subjectId],
                            }))
                          }
                          className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition"
                          title={isCollapsed ? 'Expand Subject' : 'Collapse Subject'}
                        >
                          {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                        </button>

                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: sg.subjectColor }}
                          />
                          <h2 className="text-base sm:text-lg font-bold text-slate-900">
                            {sg.subjectName}
                          </h2>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                            {sg.totalCount} Mistake{sg.totalCount > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Repractice Entire Subject */}
                      <div className="flex items-center gap-2">
                        {sg.subjectId !== 'unassigned' && (
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/mistake-book/practice?subject=${sg.subjectId}`)
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition"
                            title={`Repractice all ${sg.totalCount} mistakes in this subject`}
                          >
                            <Play size={13} fill="currentColor" />
                            <span>Repractice Subject ({sg.totalCount})</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Topics inside Subject */}
                    {!isCollapsed && (
                      <div className="p-4 sm:p-5 space-y-6">
                        {Object.values(sg.topics).map((tg) => (
                          <div
                            key={tg.topicId}
                            className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3"
                          >
                            {/* Topic Row Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/70">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-brand-500" />
                                <h3 className="text-sm font-bold text-slate-800">
                                  Topic: {tg.topicTitle}
                                </h3>
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                                  {tg.mistakes.length} Question{tg.mistakes.length > 1 ? 's' : ''}
                                </span>
                              </div>

                              {/* Repractice Specific Topic */}
                              {tg.topicId !== 'general' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      `/mistake-book/practice?subject=${sg.subjectId}&topic=${tg.topicId}`
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-2xs transition"
                                  title={`Repractice ${tg.topicTitle} mistakes`}
                                >
                                  <Play size={11} fill="currentColor" />
                                  <span>Repractice Topic</span>
                                </button>
                              )}
                            </div>

                            {/* Mistake Questions in this Topic */}
                            <div className="space-y-3 pt-1">
                              {tg.mistakes.map((mistake) => (
                                <div
                                  key={mistake._id}
                                  className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-2.5 hover:border-slate-300 transition"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                          mistake.status === 'corrected'
                                            ? 'bg-emerald-100 text-emerald-800'
                                            : mistake.status === 'practicing'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-rose-100 text-rose-800'
                                        }`}
                                      >
                                        {mistake.status === 'corrected'
                                          ? 'Corrected'
                                          : mistake.status === 'practicing'
                                          ? 'Practicing'
                                          : 'Needs Review'}
                                      </span>
                                      <span className="text-[11px] text-slate-400">
                                        Missed {mistake.incorrectCount}x
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleToggleReview(mistake._id)}
                                        className="p-1 text-slate-400 hover:text-amber-500 rounded"
                                        title={mistake.isMarkedForReview ? 'Remove mark' : 'Mark for review'}
                                      >
                                        <Bookmark
                                          size={14}
                                          className={mistake.isMarkedForReview ? 'fill-amber-500 text-amber-500' : ''}
                                        />
                                      </button>
                                      <button
                                        onClick={() => setDeletingMistake(mistake)}
                                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                        title="Delete mistake"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>

                                  <p className="text-sm font-semibold text-slate-900 leading-snug">
                                    {mistake.questionSnapshot}
                                  </p>

                                  {mistake.personalNote && (
                                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                                      <strong>Note: </strong> {mistake.personalNote}
                                    </div>
                                  )}

                                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-[11px] text-slate-400">
                                      Practiced {mistake.correctPracticeCount}x
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => setViewingMistake(mistake)}
                                        className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50"
                                      >
                                        Details
                                      </button>
                                      <button
                                        onClick={() =>
                                          navigate(`/mistake-book/practice?singleId=${mistake._id}`)
                                        }
                                        className="inline-flex items-center gap-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-3 py-1 rounded shadow-2xs"
                                      >
                                        <Play size={11} fill="currentColor" />
                                        Repractice
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          /* FLAT LIST OF MISTAKES */
          <div className="space-y-4">
            {mistakes.map((mistake) => (
              <div
                key={mistake._id}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs hover:shadow-sm transition-all space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {mistake.subject && (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold text-white shadow-2xs"
                        style={{ backgroundColor: mistake.subject.color || '#6366F1' }}
                      >
                        <Folder size={11} />
                        {mistake.subject.name}
                      </span>
                    )}
                    {mistake.topic && (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                        Topic: {mistake.topic.title}
                      </span>
                    )}
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        mistake.status === 'corrected'
                          ? 'bg-emerald-100 text-emerald-800'
                          : mistake.status === 'practicing'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {mistake.status === 'corrected'
                        ? 'Corrected'
                        : mistake.status === 'practicing'
                        ? 'Practicing'
                        : 'Needs Review'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleReview(mistake._id)}
                      className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-slate-50"
                      title={mistake.isMarkedForReview ? 'Remove review mark' : 'Mark for review'}
                    >
                      <Bookmark
                        size={16}
                        className={mistake.isMarkedForReview ? 'fill-amber-500 text-amber-500' : ''}
                      />
                    </button>
                    <button
                      onClick={() => setDeletingMistake(mistake)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50"
                      title="Delete mistake"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Question text */}
                <p className="text-base font-semibold text-slate-900 leading-snug">
                  {mistake.questionSnapshot}
                </p>

                {/* Personal Note Callout */}
                {mistake.personalNote && (
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs text-amber-900 leading-relaxed">
                    <strong>Personal Note: </strong>
                    {mistake.personalNote}
                  </div>
                )}

                {/* Bottom Row Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Missed {mistake.incorrectCount} time{mistake.incorrectCount !== 1 ? 's' : ''} • Practiced{' '}
                    {mistake.correctPracticeCount} time{mistake.correctPracticeCount !== 1 ? 's' : ''}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewingMistake(mistake)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
                    >
                      <Eye size={13} />
                      View Details
                    </button>
                    <button
                      onClick={() => navigate(`/mistake-book/practice?singleId=${mistake._id}`)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-lg shadow-2xs"
                    >
                      <Play size={12} fill="currentColor" />
                      Repractice
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center mb-4">
            <BookMarked size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No saved mistakes</h3>
          <p className="text-sm text-slate-500 mb-6">
            Whenever you answer a quiz question incorrectly, StudySense automatically records it here so
            you can review and practice it.
          </p>
          <Link
            to="/quizzes"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-all"
          >
            Take a Quiz
          </Link>
        </div>
      )}

      {/* Details & Note Modal */}
      <MistakeDetailModal
        isOpen={!!viewingMistake}
        onClose={() => setViewingMistake(null)}
        mistake={viewingMistake}
        onUpdateNote={handleUpdateNote}
        onToggleReview={handleToggleReview}
        onDelete={(m) => setDeletingMistake(m)}
        onPracticeSingle={(mId) => navigate(`/mistake-book/practice?singleId=${mId}`)}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deletingMistake}
        onClose={() => setDeletingMistake(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Saved Mistake"
        message="Are you sure you want to remove this question from your Mistake Book? Its practice history will also be removed."
        confirmText="Delete Mistake"
        cancelText="Cancel"
        isDanger={true}
        isLoading={deleteLoading}
      />
      </div>
    </DashboardLayout>
  );
};

export default MistakeBookPage;
