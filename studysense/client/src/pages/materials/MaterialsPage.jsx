import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  BookOpen, 
  Link as LinkIcon, 
  Star, 
  CheckCircle, 
  RotateCcw, 
  Layers,
  ArrowUpDown,
  AlertCircle,
  Sparkles,
  FileUp,
  FolderOpen
} from 'lucide-react';
import { materialService } from '../../services/materialService';
import { subjectService } from '../../services/subjectService';
import MaterialCard from '../../components/materials/MaterialCard';
import MaterialModal from '../../components/materials/MaterialModal';
import MaterialViewModal from '../../components/materials/MaterialViewModal';
import NotesGeneratorModal from '../../components/materials/NotesGeneratorModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import DashboardLayout from '../../components/layouts/DashboardLayout';


const MaterialsPage = () => {
  const [searchParams] = useSearchParams();
  const urlSubjectId = searchParams.get('subjectId') || '';

  // State for data
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View Mode: 'classified' (hierarchical Subject -> Topic -> General) or 'grid' (all materials flat grid)
  const [viewMode, setViewMode] = useState('classified');

  // Filters & Search state
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(urlSubjectId);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [filterReviewed, setFilterReviewed] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals state & pre-selected Subject/Topic IDs
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [modalSubjectId, setModalSubjectId] = useState('');
  const [modalTopicId, setModalTopicId] = useState('');
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [viewingMaterial, setViewingMaterial] = useState(null);
  const [deletingMaterial, setDeletingMaterial] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load user's subjects for filter dropdowns & classification tree
  const loadSubjects = useCallback(async () => {
    try {
      const res = await subjectService.getAllSubjects();
      const subs = res.data?.data || res.data?.subjects || [];
      setSubjects(subs);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  }, []);

  // Fetch materials with current filters
  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedSubject) params.subject = selectedSubject;
      if (selectedTopic) params.topic = selectedTopic;
      if (selectedType) params.type = selectedType;
      if (filterFavorites) params.favorite = 'true';
      if (filterReviewed !== '') params.reviewed = filterReviewed;
      if (sortBy) {
        params.sort = sortBy === 'createdAt' ? (sortOrder === 'asc' ? 'oldest' : 'newest') : (sortBy === 'title' ? (sortOrder === 'asc' ? 'title' : 'title') : 'newest');
      }

      const res = await materialService.getAllMaterials(params);
      const list = res.data?.materials || res.data?.data || res.materials || [];
      setMaterials(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Error fetching materials:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load study materials. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, selectedSubject, selectedTopic, selectedType, filterFavorites, filterReviewed, sortBy, sortOrder]);

  // Initial load
  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  // Refetch when filters change
  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // Topics for selected filter subject
  const currentSubjectObj = subjects.find(s => (s._id || s.id) === selectedSubject);
  const availableTopics = currentSubjectObj?.topics || [];

  const handleOpenAddModal = (subjId = '', topicId = '') => {
    setModalSubjectId(subjId || selectedSubject || (subjects[0]?._id || ''));
    setModalTopicId(topicId || '');
    setEditingMaterial(null);
    setIsFormModalOpen(true);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearch('');
    setSelectedSubject('');
    setSelectedTopic('');
    setSelectedType('');
    setFilterFavorites(false);
    setFilterReviewed('');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  // Actions
  const handleToggleFavorite = async (id) => {
    try {
      const res = await materialService.toggleFavorite(id);
      if (res.data?.success) {
        const updated = res.data.data;
        setMaterials(prev => prev.map(m => m._id === id ? { ...m, isFavorite: updated.isFavorite } : m));
        if (viewingMaterial?._id === id) {
          setViewingMaterial(prev => ({ ...prev, isFavorite: updated.isFavorite }));
        }
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleToggleReviewed = async (id) => {
    try {
      const res = await materialService.toggleReviewed(id);
      if (res.data?.success) {
        const updated = res.data.data;
        setMaterials(prev => prev.map(m => m._id === id ? { ...m, isReviewed: updated.isReviewed } : m));
        if (viewingMaterial?._id === id) {
          setViewingMaterial(prev => ({ ...prev, isReviewed: updated.isReviewed }));
        }
      }
    } catch (err) {
      console.error('Failed to toggle reviewed:', err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingMaterial) return;
    try {
      setDeleteLoading(true);
      await materialService.deleteMaterial(deletingMaterial._id);
      setMaterials(prev => prev.filter(m => m._id !== deletingMaterial._id));
      setDeletingMaterial(null);
    } catch (err) {
      console.error('Failed to delete material:', err);
      alert(err.response?.data?.message || 'Failed to delete material');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSaved = (savedMaterial) => {
    if (editingMaterial) {
      setMaterials(prev => prev.map(m => m._id === savedMaterial._id ? savedMaterial : m));
    } else {
      setMaterials(prev => [savedMaterial, ...prev]);
    }
    // Also re-sync to ensure populated subject/topic fields match
    fetchMaterials();
  };

  const handleMaterialSubmit = async (payload) => {
    if (editingMaterial) {
      const id = editingMaterial._id || editingMaterial.id;
      const res = await materialService.updateMaterial(id, payload);
      const saved = res.data?.material || res.material || res.data;
      handleSaved(saved);
    } else {
      const res = await materialService.createMaterial(payload);
      const saved = res.data?.material || res.material || res.data;
      handleSaved(saved);
    }
    setIsFormModalOpen(false);
    setEditingMaterial(null);
  };

  // Stats calculation
  const totalNotes = materials.filter(m => m.type === 'note').length;
  const totalPdfs = materials.filter(m => m.type === 'pdf').length;
  const totalResources = materials.filter(m => m.type === 'resource').length;
  const totalFavorites = materials.filter(m => m.isFavorite).length;

  return (
    <DashboardLayout title="Study Materials & Notes">
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Top Banner & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Study Materials & Notes</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              Study Notes
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Organize study notes, uploaded PDFs, documentation links, and learning references under your subjects.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsNotesModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium text-sm shadow-sm transition-all hover:shadow-md cursor-pointer shrink-0"
          >
            <Sparkles size={18} />
            <span>Generate Notes</span>
          </button>
          <button
            onClick={() => handleOpenAddModal(selectedSubject, selectedTopic)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm shadow-indigo-100 transition-all hover:shadow-md cursor-pointer shrink-0"
          >
            <Plus size={18} />
            <span>Add Material</span>
          </button>
        </div>
      </div>


      {/* Metrics Mini-Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <BookOpen size={20} />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Study Notes</div>
            <div className="text-xl font-bold text-slate-900">{totalNotes}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
            <FileUp size={20} />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Uploaded PDFs</div>
            <div className="text-xl font-bold text-slate-900">{totalPdfs}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <LinkIcon size={20} />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Resources</div>
            <div className="text-xl font-bold text-slate-900">{totalResources}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Star size={20} />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Favorites</div>
            <div className="text-xl font-bold text-slate-900">{totalFavorites}</div>
          </div>
        </div>
      </div>

      {/* Search & Filters Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, content, or #tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 placeholder:text-slate-400 transition-all"
            />
          </div>

          {/* Subject Filter */}
          <div className="w-full lg:w-48">
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedTopic('');
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white transition-all"
            >
              <option value="">All Subjects</option>
              {subjects.map(s => {
                const sId = s._id || s.id;
                return (
                  <option key={sId} value={sId}>{s.name}</option>
                );
              })}
            </select>
          </div>

          {/* Topic Filter with Scrollable Added Topics & General Option */}
          <div className="w-full lg:w-56">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              disabled={!selectedSubject}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white disabled:bg-slate-50 disabled:text-slate-400 transition-all"
            >
              <option value="">All Topics & General</option>
              <option value="general">🌐 General / Overall Only</option>
              {availableTopics.map(t => {
                const tId = t._id || t.id;
                const unitPrefix = t.unit ? `[${t.unit}] ` : '';
                return (
                  <option key={tId} value={tId}>{unitPrefix}{t.title}</option>
                );
              })}
            </select>
          </div>

          {/* Type Filter */}
          <div className="w-full lg:w-36">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white transition-all"
            >
              <option value="">All Types</option>
              <option value="note">Notes Only</option>
              <option value="pdf">PDFs Only</option>
              <option value="resource">Resources Only</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Row: Badges, View Mode, Sorting & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle: Classified vs Grid */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs mr-1">
              <button
                type="button"
                onClick={() => setViewMode('classified')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  viewMode === 'classified'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Classified by Subject & Topic Hierarchy"
              >
                <Layers size={13} />
                <span>Classified View</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="All Materials Grid View"
              >
                <BookOpen size={13} />
                <span>Grid View</span>
              </button>
            </div>

            {/* Favorites toggle button */}
            <button
              type="button"
              onClick={() => setFilterFavorites(prev => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterFavorites 
                  ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Star size={13} className={filterFavorites ? 'fill-amber-400 text-amber-500' : 'text-slate-400'} />
              Favorites Only
            </button>

            {/* Reviewed filter */}
            <button
              type="button"
              onClick={() => {
                if (filterReviewed === '') setFilterReviewed('true');
                else if (filterReviewed === 'true') setFilterReviewed('false');
                else setFilterReviewed('');
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filterReviewed === 'true'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : filterReviewed === 'false'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <CheckCircle size={13} className={filterReviewed === 'true' ? 'text-emerald-600' : 'text-slate-400'} />
              {filterReviewed === 'true' ? 'Reviewed Only' : filterReviewed === 'false' ? 'Unreviewed Only' : 'All Review Status'}
            </button>

            {/* Reset Filters */}
            {(search || selectedSubject || selectedTopic || selectedType || filterFavorites || filterReviewed !== '') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <RotateCcw size={12} />
                Reset Filters
              </button>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1">
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
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        /* Loading Skeletons */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="w-16 h-5 bg-slate-100 rounded-md"></div>
                <div className="w-6 h-6 bg-slate-100 rounded-full"></div>
              </div>
              <div className="w-3/4 h-5 bg-slate-200 rounded"></div>
              <div className="space-y-2">
                <div className="w-full h-3 bg-slate-100 rounded"></div>
                <div className="w-5/6 h-3 bg-slate-100 rounded"></div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between">
                <div className="w-20 h-4 bg-slate-100 rounded"></div>
                <div className="w-16 h-4 bg-slate-100 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : materials.length > 0 ? (
        viewMode === 'classified' ? (
          /* Classified Subject & Topic Hierarchy View */
          <div className="space-y-6">
            {(selectedSubject
              ? subjects.filter(s => (s._id || s.id) === selectedSubject)
              : subjects
            ).map(subj => {
              const sId = subj._id || subj.id;
              const sColor = subj.color || '#4f46e5';

              // Materials belonging to this subject
              const subjMaterials = materials.filter(m => {
                const matSubId = typeof m.subject === 'object' ? (m.subject?._id || m.subject?.id) : m.subject;
                return String(matSubId) === String(sId);
              });

              // General materials without topic
              const generalMaterials = subjMaterials.filter(m => !m.topic);

              // Topics under this subject
              const topicsList = subj.topics || [];

              return (
                <div key={sId} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden space-y-4 p-5 sm:p-6">
                  {/* Subject Header Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-3.5 h-12 rounded-full shrink-0"
                        style={{ backgroundColor: sColor }}
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-bold text-slate-900">{subj.name}</h2>
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700">
                            {subjMaterials.length} Material{subjMaterials.length !== 1 ? 's' : ''}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {topicsList.length} Topic{topicsList.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {subj.description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{subj.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedSubject(sId);
                          setIsNotesModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition cursor-pointer"
                      >
                        <Sparkles size={14} />
                        Generate Notes
                      </button>
                      <button
                        onClick={() => handleOpenAddModal(sId, '')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition cursor-pointer"
                      >
                        <Plus size={14} />
                        Add Material
                      </button>
                    </div>
                  </div>

                  {/* Inside Subject: 1. General / Overall Materials Classification */}
                  <div className="space-y-3 bg-slate-50/80 rounded-xl p-4 border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-md bg-indigo-100 text-indigo-700 text-xs font-bold">🌐</span>
                        <h3 className="text-sm font-bold text-slate-800">
                          General / Overall Materials (Course-Wide & Syllabus)
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200 font-semibold">
                          {generalMaterials.length}
                        </span>
                      </div>
                      <button
                        onClick={() => handleOpenAddModal(sId, '')}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold hover:underline cursor-pointer"
                      >
                        + Add General Material
                      </button>
                    </div>

                    {generalMaterials.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {generalMaterials.map(mat => (
                          <MaterialCard
                            key={mat._id}
                            material={mat}
                            onView={(m) => setViewingMaterial(m)}
                            onEdit={(m) => {
                              setEditingMaterial(m);
                              setIsFormModalOpen(true);
                            }}
                            onDelete={(m) => setDeletingMaterial(m)}
                            onToggleFavorite={handleToggleFavorite}
                            onToggleReviewed={handleToggleReviewed}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="py-3 px-4 bg-white rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-400">
                        No general overall materials yet for this subject. Use this bucket for course syllabus, formula sheets, or exam overviews.
                      </div>
                    )}
                  </div>

                  {/* Inside Subject: 2. Unit or Topic Classifications */}
                  <div className="space-y-4 pt-1">
                    {(() => {
                      // Check if any topic or material under this subject has unit info
                      const hasUnits = topicsList.some(t => t.unit && t.unit.trim()) || 
                                       subjMaterials.some(m => m.unit && m.unit.trim());

                      if (hasUnits) {
                        // Gather unique units in natural order
                        const unitNames = [];
                        const unitSet = new Set();

                        topicsList.forEach(t => {
                          const u = (t.unit || '').trim();
                          if (u && !unitSet.has(u)) {
                            unitSet.add(u);
                            unitNames.push(u);
                          }
                        });

                        subjMaterials.forEach(m => {
                          const u = (m.unit || '').trim();
                          if (u && !unitSet.has(u)) {
                            unitSet.add(u);
                            unitNames.push(u);
                          }
                        });

                        // Sort units naturally (Unit 1, Unit 2...)
                        unitNames.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

                        // Any topics without unit
                        const unassignedTopics = topicsList.filter(t => !t.unit || !t.unit.trim());

                        return (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                <FolderOpen size={14} className="text-indigo-600" />
                                Unit Classifications & Syllabus Breakdown
                              </h3>
                              <button
                                onClick={() => handleOpenAddModal(sId, '')}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold hover:underline cursor-pointer"
                              >
                                + Add Material to Unit
                              </button>
                            </div>

                            {/* Render Each Unit */}
                            {unitNames.map(unitName => {
                              const unitTopics = topicsList.filter(t => (t.unit || '').trim().toLowerCase() === unitName.toLowerCase());
                              const unitMaterials = subjMaterials.filter(m => (m.unit || '').trim().toLowerCase() === unitName.toLowerCase());

                              return (
                                <div key={unitName} className="border-2 border-indigo-100 rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-indigo-50/30 via-white to-purple-50/20 shadow-xs space-y-4">
                                  {/* Unit Header Banner */}
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-indigo-100/70">
                                    <div className="flex items-center gap-2.5">
                                      <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                                        U
                                      </span>
                                      <div>
                                        <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                                          {unitName}
                                        </h4>
                                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                          <span>{unitTopics.length} Topic{unitTopics.length !== 1 ? 's' : ''}</span>
                                          <span>&bull;</span>
                                          <span>{unitMaterials.length} Material{unitMaterials.length !== 1 ? 's' : ''}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <button
                                      onClick={() => handleOpenAddModal(sId, unitTopics[0]?._id || unitTopics[0]?.id || '')}
                                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 transition cursor-pointer self-start sm:self-auto"
                                    >
                                      <Plus size={13} />
                                      Add to {unitName}
                                    </button>
                                  </div>

                                  {/* Inside Unit: Topics & Materials */}
                                  <div className="space-y-3.5 pl-1 sm:pl-3">
                                    {unitTopics.length > 0 ? (
                                      unitTopics.map(topic => {
                                        const tId = topic._id || topic.id;
                                        const topicMaterials = unitMaterials.filter(m => {
                                          const matTopicId = typeof m.topic === 'object' ? (m.topic?._id || m.topic?.id) : m.topic;
                                          return String(matTopicId) === String(tId);
                                        });

                                        return (
                                          <div key={tId} className="border border-slate-200/90 rounded-xl p-3.5 bg-white shadow-xs space-y-3">
                                            <div className="flex items-center justify-between gap-2">
                                              <div className="flex items-center gap-2 min-w-0">
                                                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>
                                                <h5 className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                                                  {topic.title}
                                                </h5>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold shrink-0">
                                                  {topicMaterials.length}
                                                </span>
                                              </div>

                                              <button
                                                onClick={() => handleOpenAddModal(sId, tId)}
                                                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer shrink-0"
                                              >
                                                + Add Material
                                              </button>
                                            </div>

                                            {topicMaterials.length > 0 ? (
                                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                                                {topicMaterials.map(mat => (
                                                  <MaterialCard
                                                    key={mat._id}
                                                    material={mat}
                                                    onView={(m) => setViewingMaterial(m)}
                                                    onEdit={(m) => {
                                                      setEditingMaterial(m);
                                                      setIsFormModalOpen(true);
                                                    }}
                                                    onDelete={(m) => setDeletingMaterial(m)}
                                                    onToggleFavorite={handleToggleFavorite}
                                                    onToggleReviewed={handleToggleReviewed}
                                                  />
                                                ))}
                                              </div>
                                            ) : (
                                              <div className="py-2 px-3 bg-slate-50/60 rounded-lg border border-dashed border-slate-200 text-[11px] text-slate-400">
                                                No study materials inside this topic yet.
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })
                                    ) : (
                                      /* Unit has materials directly without subtopics */
                                      unitMaterials.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                          {unitMaterials.map(mat => (
                                            <MaterialCard
                                              key={mat._id}
                                              material={mat}
                                              onView={(m) => setViewingMaterial(m)}
                                              onEdit={(m) => {
                                                setEditingMaterial(m);
                                                setIsFormModalOpen(true);
                                              }}
                                              onDelete={(m) => setDeletingMaterial(m)}
                                              onToggleFavorite={handleToggleFavorite}
                                              onToggleReviewed={handleToggleReviewed}
                                            />
                                          ))}
                                        </div>
                                      ) : null
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                            {/* Additional Topics not assigned to any Unit */}
                            {unassignedTopics.length > 0 && (
                              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                  General Topics (Unassigned Unit)
                                </h4>
                                <div className="space-y-3">
                                  {unassignedTopics.map(topic => {
                                    const tId = topic._id || topic.id;
                                    const topicMaterials = subjMaterials.filter(m => {
                                      const matTopicId = typeof m.topic === 'object' ? (m.topic?._id || m.topic?.id) : m.topic;
                                      return String(matTopicId) === String(tId);
                                    });

                                    return (
                                      <div key={tId} className="border border-slate-200 rounded-xl p-3.5 bg-white shadow-xs space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs sm:text-sm font-bold text-slate-800">{topic.title}</span>
                                          <button
                                            onClick={() => handleOpenAddModal(sId, tId)}
                                            className="text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                                          >
                                            + Add Material
                                          </button>
                                        </div>
                                        {topicMaterials.length > 0 && (
                                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                                            {topicMaterials.map(mat => (
                                              <MaterialCard
                                                key={mat._id}
                                                material={mat}
                                                onView={(m) => setViewingMaterial(m)}
                                                onEdit={(m) => {
                                                  setEditingMaterial(m);
                                                  setIsFormModalOpen(true);
                                                }}
                                                onDelete={(m) => setDeletingMaterial(m)}
                                                onToggleFavorite={handleToggleFavorite}
                                                onToggleReviewed={handleToggleReviewed}
                                              />
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Fallback: If no units were provided, show regular Topic classifications
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                              <BookOpen size={14} />
                              Topic Classifications
                            </h3>
                            <button
                              onClick={() => handleOpenAddModal(sId, '')}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold hover:underline cursor-pointer"
                            >
                              + Add Material to Topic
                            </button>
                          </div>

                          {topicsList.length > 0 ? (
                            <div className="space-y-3">
                              {topicsList.map(topic => {
                                const tId = topic._id || topic.id;
                                const topicMaterials = subjMaterials.filter(m => {
                                  const matTopicId = typeof m.topic === 'object' ? (m.topic?._id || m.topic?.id) : m.topic;
                                  return String(matTopicId) === String(tId);
                                });

                                return (
                                  <div key={tId} className="border border-slate-200 rounded-xl p-4 bg-white space-y-3 shadow-xs">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0"></span>
                                        <h4 className="text-sm font-bold text-slate-900">
                                          {topic.title}
                                        </h4>
                                        {topic.unit && (
                                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                                            {topic.unit}
                                          </span>
                                        )}
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                                          {topicMaterials.length} Material{topicMaterials.length !== 1 ? 's' : ''}
                                        </span>
                                      </div>

                                      <button
                                        onClick={() => handleOpenAddModal(sId, tId)}
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2.5 py-1 rounded-lg transition cursor-pointer self-start sm:self-auto"
                                      >
                                        <Plus size={13} />
                                        Add to this Topic
                                      </button>
                                    </div>

                                    {topicMaterials.length > 0 ? (
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                                        {topicMaterials.map(mat => (
                                          <MaterialCard
                                            key={mat._id}
                                            material={mat}
                                            onView={(m) => setViewingMaterial(m)}
                                            onEdit={(m) => {
                                              setEditingMaterial(m);
                                              setIsFormModalOpen(true);
                                            }}
                                            onDelete={(m) => setDeletingMaterial(m)}
                                            onToggleFavorite={handleToggleFavorite}
                                            onToggleReviewed={handleToggleReviewed}
                                          />
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="py-2.5 px-3 bg-slate-50/70 rounded-lg border border-dashed border-slate-200 text-xs text-slate-400 flex items-center justify-between">
                                        <span>No materials saved inside this topic yet.</span>
                                        <button
                                          onClick={() => handleOpenAddModal(sId, tId)}
                                          className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                                        >
                                          + Store First Material
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                              No topics added yet for this subject. Use '+ Add Material' above and type or paste topics to automatically create them!
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Materials Flat Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {materials.map(material => (
              <MaterialCard
                key={material._id}
                material={material}
                onView={(m) => setViewingMaterial(m)}
                onEdit={(m) => {
                  setEditingMaterial(m);
                  setIsFormModalOpen(true);
                }}
                onDelete={(m) => setDeletingMaterial(m)}
                onToggleFavorite={handleToggleFavorite}
                onToggleReviewed={handleToggleReviewed}
              />
            ))}
          </div>
        )
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4">
            <Layers size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            {search || selectedSubject || selectedTopic || selectedType || filterFavorites || filterReviewed !== ''
              ? 'No matching materials found'
              : 'No study materials yet'}
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            {search || selectedSubject || selectedTopic || selectedType || filterFavorites || filterReviewed !== ''
              ? 'Try adjusting your search criteria or resetting the active filters.'
              : 'Create your first study note or save an external learning resource to organize your academic materials.'}
          </p>

          {search || selectedSubject || selectedTopic || selectedType || filterFavorites || filterReviewed !== '' ? (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors cursor-pointer"
            >
              <RotateCcw size={16} />
              Reset Filters
            </button>
          ) : (
            <button
              onClick={() => handleOpenAddModal(selectedSubject, selectedTopic)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm shadow-indigo-100 transition-all cursor-pointer"
            >
              <Plus size={18} />
              Create First Material
            </button>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      <MaterialModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingMaterial(null);
        }}
        onSubmit={handleMaterialSubmit}
        onSaved={handleSaved}
        material={editingMaterial}
        editingMaterial={editingMaterial}
        defaultSubjectId={modalSubjectId || selectedSubject || (subjects[0]?._id || '')}
        defaultTopicId={modalTopicId}
      />

      {/* View Details Modal */}
      <MaterialViewModal
        isOpen={!!viewingMaterial}
        onClose={() => setViewingMaterial(null)}
        material={viewingMaterial}
        onEdit={(m) => {
          setViewingMaterial(null);
          setEditingMaterial(m);
          setIsFormModalOpen(true);
        }}
        onDelete={(m) => {
          setViewingMaterial(null);
          setDeletingMaterial(m);
        }}
        onToggleFavorite={handleToggleFavorite}
        onToggleReviewed={handleToggleReviewed}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingMaterial}
        onClose={() => setDeletingMaterial(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Study Material"
        message={`Are you sure you want to permanently delete "${deletingMaterial?.title}"? This action cannot be undone.`}
        confirmText="Delete Material"
        cancelText="Cancel"
        isDanger={true}
        isLoading={deleteLoading}
      />

      {/* AI Short Notes Generator Modal */}
      <NotesGeneratorModal
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        subjects={subjects}
        initialSubjectId={selectedSubject}
        initialTopicId={selectedTopic}
        onNotesSaved={() => {
          fetchMaterials();
        }}
      />
      </div>
    </DashboardLayout>
  );
};

export default MaterialsPage;

