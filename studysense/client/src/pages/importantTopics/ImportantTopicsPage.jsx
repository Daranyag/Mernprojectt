import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ListChecks,
  Sparkles,
  BookOpen,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  HelpCircle,
  FileText,
  AlertCircle,
  RotateCcw,
  Trash2,
  Printer,
  ChevronDown,
  ChevronUp,
  Tag,
  GraduationCap,
  Upload,
  Link2,
  Globe,
  X,
  Check
} from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { subjectService } from '../../services/subjectService';
import importantTopicsService from '../../services/importantTopicsService';
import { quizGeneratorService } from '../../services/quizGeneratorService';

const ImportantTopicsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlSubjectId = searchParams.get('subjectId') || '';
  const [subjects, setSubjects] = useState([]);
  const [savedAnalyses, setSavedAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [activeTab, setActiveTab] = useState('analyze'); // 'analyze', 'dashboard', 'history'

  // Input states
  const [selectedSubjectId, setSelectedSubjectId] = useState(urlSubjectId);
  const [analysisTitle, setAnalysisTitle] = useState('');
  const [sourceScope, setSourceScope] = useState('my_materials'); // 'my_materials', 'combined', 'outer_sources'
  const [targetCount, setTargetCount] = useState(15);
  const [depthOfAnalysis, setDepthOfAnalysis] = useState('Standard');

  // Grounding reference sources (PDFs, URLs, notes)
  const [uploadedSources, setUploadedSources] = useState([]);
  const [sourceUrlInput, setSourceUrlInput] = useState('');
  const [sourceTextInput, setSourceTextInput] = useState('');
  const [showTextModal, setShowTextModal] = useState(false);
  const [sourceUploading, setSourceUploading] = useState(false);
  const [sourceUploadSuccess, setSourceUploadSuccess] = useState('');

  // Active analysis view
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [viewMode, setViewMode] = useState('priority'); // 'priority' or 'unit'
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [expandedTopicId, setExpandedTopicId] = useState(null);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [subRes, analysesRes] = await Promise.all([
        subjectService.getAllSubjects(),
        importantTopicsService.getAnalyses()
      ]);

      const rawSubs = subRes?.data?.data || subRes?.data?.subjects || subRes?.data || [];
      const subs = Array.isArray(rawSubs) ? rawSubs.map(s => ({ ...s, _id: s._id || s.id, id: s.id || s._id })) : [];
      setSubjects(subs);
      
      if (subs.length > 0) {
        // Resolve subject to select: urlSubjectId > current selectedSubjectId > first subject
        const targetId = urlSubjectId || selectedSubjectId;
        const matchingSub = subs.find(s => s._id === targetId || s.id === targetId) || subs[0];
        if (matchingSub) {
          setSelectedSubjectId(matchingSub._id || matchingSub.id);
          setAnalysisTitle((prev) => prev || `High-Priority Revision Topics - ${matchingSub.name}`);
        }
      }

      if (analysesRes.success) {
        const list = analysesRes.data || [];
        setSavedAnalyses(list);
        if (list.length > 0 && !currentAnalysis) {
          setCurrentAnalysis(list[0]);
        }
      }
    } catch (err) {
      console.error('[ImportantTopicsPage] Load error:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load initial data');
    } finally {
      setLoading(false);
    }
  }, [selectedSubjectId, currentAnalysis]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleSubjectChange = (e) => {
    const subId = e.target.value;
    setSelectedSubjectId(subId);
    const sub = subjects.find((s) => s._id === subId);
    if (sub) {
      setAnalysisTitle(`High-Priority Revision Topics - ${sub.name}`);
    }
  };

  // Ingest external PDF/PPTX file directly
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const targetSubId = selectedSubjectId || (subjects[0]?._id || subjects[0]?.id);
    if (!targetSubId) {
      setError('Please select a subject first before uploading study materials.');
      return;
    }
    setError(null);
    setSourceUploadSuccess('');
    setSourceUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subjectId', targetSubId);
      formData.append('title', file.name);

      const res = await quizGeneratorService.ingestFileUpload(formData);
      if (res?.data) {
        setUploadedSources((prev) => [...prev, res.data]);
        setSourceUploadSuccess(`Uploaded "${file.name}" successfully!`);
      }
    } catch (err) {
      console.error('File upload error:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to upload document');
    } finally {
      setSourceUploading(false);
      e.target.value = '';
    }
  };

  // Ingest URL (webpage / youtube / notes)
  const handleUrlSubmit = async (e) => {
    e?.preventDefault();
    if (!sourceUrlInput.trim()) return;
    const targetSubId = selectedSubjectId || (subjects[0]?._id || subjects[0]?.id);
    if (!targetSubId) {
      setError('Please select a subject first before adding reference URL.');
      return;
    }
    setError(null);
    setSourceUploadSuccess('');
    setSourceUploading(true);

    try {
      const res = await quizGeneratorService.ingestUrlSource({
        subjectId: targetSubId,
        url: sourceUrlInput.trim(),
        title: sourceUrlInput.trim()
      });
      if (res?.data) {
        setUploadedSources((prev) => [...prev, res.data]);
        setSourceUploadSuccess(`Fetched content from URL successfully!`);
        setSourceUrlInput('');
      }
    } catch (err) {
      console.error('URL ingest error:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to extract content from URL');
    } finally {
      setSourceUploading(false);
    }
  };

  // Ingest pasted text
  const handleTextSubmit = async () => {
    if (!sourceTextInput.trim()) return;
    const targetSubId = selectedSubjectId || (subjects[0]?._id || subjects[0]?.id);
    if (!targetSubId) {
      setError('Please select a subject first before adding notes.');
      return;
    }
    setError(null);
    setSourceUploadSuccess('');
    setSourceUploading(true);

    try {
      const res = await quizGeneratorService.ingestTextSource({
        subjectId: targetSubId,
        content: sourceTextInput.trim(),
        title: `Pasted Notes (${new Date().toLocaleTimeString()})`
      });
      if (res?.data) {
        setUploadedSources((prev) => [...prev, res.data]);
        setSourceUploadSuccess('Pasted notes ingested successfully!');
        setSourceTextInput('');
        setShowTextModal(false);
      }
    } catch (err) {
      console.error('Text ingest error:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to ingest notes');
    } finally {
      setSourceUploading(false);
    }
  };

  const handleRemoveSource = (id) => {
    setUploadedSources((prev) => prev.filter((s) => s._id !== id));
  };

  // Run AI Analysis
  const handleAnalyzeTopics = async () => {
    const targetSubjectId = selectedSubjectId || (subjects[0]?._id || subjects[0]?.id);
    if (!targetSubjectId) {
      alert('Please select a subject.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setNotice(null);
    try {
      // Map frontend 3 options to backend expectations:
      // 'my_materials' -> 'material_only'
      // 'combined' -> 'combined'
      // 'outer_sources' -> 'general_knowledge'
      let backendSourceScope = 'general_knowledge';
      if (sourceScope === 'my_materials') {
        backendSourceScope = 'material_only';
      } else if (sourceScope === 'combined') {
        backendSourceScope = 'combined';
      } else if (sourceScope === 'outer_sources') {
        backendSourceScope = 'general_knowledge';
      }

      const payload = {
        subjectId: targetSubjectId,
        title: analysisTitle || `High-Priority Revision Topics - ${subjects.find(s => (s._id || s.id) === targetSubjectId)?.name || 'Subject'}`,
        sourceScope: backendSourceScope,
        sourceIds: uploadedSources.map((s) => s._id),
        targetTopicCount: targetCount,
        depthOfAnalysis
      };

      const res = await importantTopicsService.analyzeTopics(payload);
      if (res.success && res.data) {
        if (res.fallbackNotice) {
          setNotice(res.fallbackNotice);
        }
        setCurrentAnalysis(res.data);
        setActiveTab('dashboard');
        loadInitialData();
      }
    } catch (err) {
      console.error('[ImportantTopicsPage] Analysis error:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to analyze topics');
    } finally {
      setAnalyzing(false);
    }
  };

  // Update topic revision status
  const handleStatusChange = async (topicId, newStatus) => {
    if (!currentAnalysis) return;
    try {
      const res = await importantTopicsService.updateRevisionStatus(
        currentAnalysis._id,
        topicId,
        newStatus
      );
      if (res.success) {
        const updatedTopics = currentAnalysis.topics.map((t) =>
          t._id === topicId ? { ...t, revisionStatus: newStatus } : t
        );
        setCurrentAnalysis({ ...currentAnalysis, topics: updatedTopics });
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update status');
    }
  };

  // Regenerate analysis
  const handleRegenerate = async (id) => {
    if (!window.confirm('Regenerate this topic prioritization?')) return;
    try {
      const res = await importantTopicsService.regenerateAnalysis(id);
      if (res.success) {
        setCurrentAnalysis(res.data);
        loadInitialData();
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to regenerate analysis');
    }
  };

  // Delete analysis
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this analysis?')) return;
    try {
      const res = await importantTopicsService.deleteAnalysis(id);
      if (res.success) {
        if (currentAnalysis?._id === id) setCurrentAnalysis(null);
        loadInitialData();
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete analysis');
    }
  };

  // Filtering topics
  const topicsToDisplay = currentAnalysis?.topics?.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.topicTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.unitOrChapter.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  }) || [];

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
            High Priority
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
            Medium Priority
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            Low Priority
          </span>
        );
    }
  };

  const getRevisionStatusBadge = (status) => {
    switch (status) {
      case 'Understood':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Revised':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Need More Practice':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <DashboardLayout title="Important Topic Generator">
      <div className="space-y-6 pb-16 print:p-0 print:m-0">
        {/* Header Banner - Hidden in Print */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 rounded-3xl p-6 md:p-8 text-white shadow-md relative overflow-hidden print:hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold tracking-wide uppercase mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Revision Topic Prioritizer
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Important Topic Generator
              </h1>
              <p className="text-emerald-100 text-sm mt-1 max-w-2xl leading-relaxed">
                Analyze your subject syllabus and study materials to identify high-weightage topics, key concepts, formulas, and recommended next actions without exam guesswork.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('analyze')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'analyze'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                New Analysis
              </button>
              {currentAnalysis && (
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  Topic Cards ({currentAnalysis.topics.length})
                </button>
              )}
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Saved Analyses ({savedAnalyses.length})
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 print:hidden">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <strong>Error: </strong> {error}
            </div>
          </div>
        )}

        {/* Informative Fallback Notice */}
        {notice && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 print:hidden">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <strong>Curriculum Notice: </strong> {notice}
            </div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-xs text-amber-700 hover:text-amber-900 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* TAB 1: NEW ANALYSIS WORKFLOW */}
        {activeTab === 'analyze' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 pb-4 border-b border-slate-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                Step 1: Course Subject & Analysis Configuration
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Course / Subject *
                  </label>
                  {subjects.length === 0 ? (
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs">
                      No subjects enrolled. <Link to="/subjects" className="font-bold underline">Create a Subject</Link> first.
                    </div>
                  ) : (
                    <select
                      value={selectedSubjectId || (subjects[0]?._id || subjects[0]?.id || '')}
                      onChange={handleSubjectChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select a Subject</option>
                      {subjects.map((s) => (
                        <option key={s._id || s.id} value={s._id || s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Analysis Title *
                  </label>
                  <input
                    type="text"
                    value={analysisTitle}
                    onChange={(e) => setAnalysisTitle(e.target.value)}
                    placeholder="e.g. End-Sem High Priority Topics"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Target Topic Count
                  </label>
                  <select
                    value={targetCount}
                    onChange={(e) => setTargetCount(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={10}>10 Key Topics</option>
                    <option value={15}>15 Comprehensive Topics</option>
                    <option value={20}>20 In-Depth Syllabus Topics</option>
                    <option value={30}>30 Complete Course Topics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Depth of Analysis
                  </label>
                  <select
                    value={depthOfAnalysis}
                    onChange={(e) => setDepthOfAnalysis(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Basic">Basic (Titles & Brief Summary)</option>
                    <option value="Standard">Standard (Concepts, Marks, Subtopics)</option>
                    <option value="Detailed">Detailed (Exhaustive Formulas & Rubrics)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Scope Selection */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 pb-4 border-b border-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                Step 2: Source Scope
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                {/* Option 1: My Material */}
                <div
                  onClick={() => setSourceScope('my_materials')}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer ${
                    sourceScope === 'my_materials'
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-900">My Material</span>
                    {sourceScope === 'my_materials' && <Check className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Uses your uploaded study materials and topic notes. If materials for some topics are missing, external sources are used automatically.
                  </p>
                </div>

                {/* Option 2: My Material + Other Sources */}
                <div
                  onClick={() => setSourceScope('combined')}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer ${
                    sourceScope === 'combined'
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-900">My Material + Other Sources</span>
                    {sourceScope === 'combined' && <Check className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Combines your study notes with uploaded PDFs, reference URLs, and external university curriculum.
                  </p>
                </div>

                {/* Option 3: Other Sources */}
                <div
                  onClick={() => setSourceScope('outer_sources')}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer ${
                    sourceScope === 'outer_sources'
                      ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-900">Other Sources</span>
                    {sourceScope === 'outer_sources' && <Check className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Upload URLs or PDFs. If no source URL or file provided, AI automatically analyzes from university curriculum benchmarks.
                  </p>
                </div>
              </div>

              {/* Inline Upload & URL Attachment for Combined or Other Sources */}
              {(sourceScope === 'combined' || sourceScope === 'outer_sources') && (
                <div className="mt-4 p-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                      <Globe size={14} /> Attach Reference Sources (URL, PDF, Text)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Optional • AI automatically sources if none provided
                    </span>
                  </div>

                  {/* Inputs Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* URL input */}
                    <form onSubmit={handleUrlSubmit} className="flex gap-2">
                      <div className="relative flex-1">
                        <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="url"
                          placeholder="Paste reference URL (YouTube / article / doc)..."
                          value={sourceUrlInput}
                          onChange={(e) => setSourceUrlInput(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-emerald-500 text-slate-900"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={sourceUploading || !sourceUrlInput.trim()}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition cursor-pointer shrink-0"
                      >
                        Add URL
                      </button>
                    </form>

                    {/* File upload button + Paste Text trigger */}
                    <div className="flex items-center gap-2">
                      <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition">
                        <Upload size={14} className="text-emerald-600" />
                        <span>{sourceUploading ? 'Uploading...' : 'Upload PDF / PPTX'}</span>
                        <input
                          type="file"
                          accept=".pdf,.pptx"
                          onChange={handleFileUpload}
                          disabled={sourceUploading}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => setShowTextModal(!showTextModal)}
                        className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition cursor-pointer"
                      >
                        Paste Text
                      </button>
                    </div>
                  </div>

                  {/* Expandable text paste box */}
                  {showTextModal && (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 animate-fade-in">
                      <textarea
                        rows={3}
                        placeholder="Paste syllabus excerpt, lecture notes, or key topic references..."
                        value={sourceTextInput}
                        onChange={(e) => setSourceTextInput(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-200 text-xs bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowTextModal(false)}
                          className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleTextSubmit}
                          disabled={sourceUploading || !sourceTextInput.trim()}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                        >
                          Add Text Source
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Success Notice */}
                  {sourceUploadSuccess && (
                    <div className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
                      <CheckCircle2 size={13} /> {sourceUploadSuccess}
                    </div>
                  )}

                  {/* List of Attached Sources */}
                  {uploadedSources.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Attached Sources ({uploadedSources.length}):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {uploadedSources.map((s) => (
                          <span
                            key={s._id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-xs font-medium text-emerald-900"
                          >
                            <span className="truncate max-w-[200px]">{s.title || s.fileName || 'Resource'}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSource(s._id)}
                              className="text-slate-400 hover:text-red-500 transition ml-1"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleAnalyzeTopics}
                  disabled={analyzing || subjects.length === 0}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
                  {analyzing ? 'Analyzing Syllabus & Materials...' : `Analyze Important Topics (${targetCount} Topics)`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TOPIC DASHBOARD */}
        {activeTab === 'dashboard' && currentAnalysis && (
          <div className="space-y-6">
            {/* Action Bar & Controls */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search topics or concepts..."
                    className="pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Priority Filter */}
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-800"
                >
                  <option value="All">All Priorities</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>

                {/* View Mode */}
                <div className="flex rounded-xl border border-slate-200 overflow-hidden text-xs">
                  <button
                    onClick={() => setViewMode('priority')}
                    className={`px-3 py-1.5 font-bold transition cursor-pointer ${
                      viewMode === 'priority' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600'
                    }`}
                  >
                    Priority View
                  </button>
                  <button
                    onClick={() => setViewMode('unit')}
                    className={`px-3 py-1.5 font-bold transition cursor-pointer ${
                      viewMode === 'unit' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600'
                    }`}
                  >
                    Unit View
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Topic List
                </button>
                <button
                  onClick={() => handleRegenerate(currentAnalysis._id)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                  title="Regenerate analysis"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Overview Banner */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-emerald-900">{currentAnalysis.title}</h3>
                <p className="mt-0.5 text-emerald-800">{currentAnalysis.summaryNote}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-bold px-3 py-1 rounded-full bg-white text-emerald-800 border border-emerald-200">
                  {topicsToDisplay.length} Topics Shown
                </span>
              </div>
            </div>

            {/* TOPICS CARD LIST */}
            <div className="space-y-4">
              {topicsToDisplay.map((topic) => {
                const isExpanded = expandedTopicId === topic._id;
                return (
                  <div
                    key={topic._id}
                    className="p-5 rounded-3xl border border-slate-200/90 bg-white hover:border-emerald-300 transition shadow-2xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        {getPriorityBadge(topic.priority)}
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          {topic.unitOrChapter}
                        </span>
                      </div>

                      {/* Revision Status Picker */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400 font-semibold">Revision:</span>
                        <select
                          value={topic.revisionStatus}
                          onChange={(e) => handleStatusChange(topic._id, e.target.value)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-xl border transition cursor-pointer ${getRevisionStatusBadge(
                            topic.revisionStatus
                          )}`}
                        >
                          <option value="Not Reviewed">Not Reviewed</option>
                          <option value="Need More Practice">Need More Practice</option>
                          <option value="Revised">Revised</option>
                          <option value="Understood">Understood</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-slate-900">{topic.topicTitle}</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {topic.shortDescription}
                      </p>
                    </div>

                    {/* Key Details Tags */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      {topic.suggestedMarks?.map((m, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 font-bold border border-teal-200 text-[11px]"
                        >
                          {m} Marks
                        </span>
                      ))}

                      {topic.suggestedQuestionFormats?.map((fmt, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]"
                        >
                          {fmt}
                        </span>
                      ))}

                      <span className="text-slate-400 text-[11px] ml-auto">
                        Evidence: {topic.priorityEvidence}
                      </span>
                    </div>

                    {/* Action Integration Links */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <button
                        onClick={() => setExpandedTopicId(isExpanded ? null : topic._id)}
                        className="text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        {isExpanded ? 'Hide Details' : 'View Core Concepts & Formulas'}
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      <div className="flex items-center gap-2">
                        {/* Generate Quiz Integration */}
                        <Link
                          to={`/quizzes?subjectId=${currentAnalysis?.subjectId?._id || currentAnalysis?.subjectId || selectedSubjectId}&generate=true`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-800 font-bold text-[11px] transition"
                        >
                          <GraduationCap className="w-3 h-3" />
                          Generate Quiz
                        </Link>

                        {/* Generate Exam Paper Integration */}
                        <Link
                          to={`/exam-paper-generator?subjectId=${currentAnalysis?.subjectId?._id || currentAnalysis?.subjectId || selectedSubjectId}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[11px] transition"
                        >
                          <FileText className="w-3 h-3" />
                          Generate Exam Paper
                        </Link>
                      </div>
                    </div>

                    {/* Expanded Details Section */}
                    {isExpanded && (
                      <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                        {topic.mainConcepts && topic.mainConcepts.length > 0 && (
                          <div>
                            <strong className="text-slate-800">Main Concepts:</strong>
                            <ul className="list-disc pl-5 mt-1 text-slate-600 space-y-0.5">
                              {topic.mainConcepts.map((mc, idx) => (
                                <li key={idx}>{mc}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {topic.importantSubtopics && topic.importantSubtopics.length > 0 && (
                          <div>
                            <strong className="text-slate-800">Important Subtopics:</strong>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {topic.importantSubtopics.map((st, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[11px]"
                                >
                                  {st}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {topic.definitionsOrFormulas && topic.definitionsOrFormulas.length > 0 && (
                          <div>
                            <strong className="text-slate-800">Key Definitions / Formulas:</strong>
                            <ul className="list-disc pl-5 mt-1 text-slate-600 space-y-0.5">
                              {topic.definitionsOrFormulas.map((df, idx) => (
                                <li key={idx}>{df}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                          <strong>Recommended Study Action:</strong> {topic.recommendedAction}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: SAVED ANALYSES HISTORY */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 pb-4 border-b border-slate-100">
              Saved Important Topic Analyses
            </h2>

            {savedAnalyses.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No analyses saved yet. Run an analysis in "New Analysis" to save revision priorities.
              </div>
            ) : (
              <div className="space-y-4 mt-5">
                {savedAnalyses.map((item) => (
                  <div
                    key={item._id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {item.subject?.name || 'Subject'}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 mt-1">{item.title}</h3>
                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                        <span>{item.topics?.length || 0} Topics Identified</span>
                        <span>&bull;</span>
                        <span>Scope: {item.sourceScope.replace('_', ' ')}</span>
                        <span>&bull;</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setCurrentAnalysis(item);
                          setActiveTab('dashboard');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition cursor-pointer"
                      >
                        View Topics
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                        title="Delete Analysis"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ImportantTopicsPage;
