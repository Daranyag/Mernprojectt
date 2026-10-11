import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, School, BookOpen, GraduationCap, Award, 
  Shield, Key, Save, CheckCircle2, AlertCircle, ArrowLeft, 
  Sparkles, Sliders, Bell, Clock, Calendar, Check, Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import Topbar from '../../components/dashboard/Topbar';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'preferences' | 'security' | 'stats'
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    college: user?.college || '',
    department: user?.department || '',
    degree: user?.degree || '',
    yearOfStudy: user?.yearOfStudy || '',
    semester: user?.semester || '',
    bio: user?.bio || '',
    targetExam: user?.targetExam || '',
  });

  // Preferences form state
  const [preferencesData, setPreferencesData] = useState({
    preferredDifficulty: user?.preferredDifficulty || 'Medium',
    preferredMarksTier: user?.preferredMarksTier || '2m',
    dailyGoalMinutes: user?.dailyGoalMinutes || 60,
    emailNotifications: user?.emailNotifications ?? true,
  });

  // Security password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        college: user.college || '',
        department: user.department || '',
        degree: user.degree || '',
        yearOfStudy: user.yearOfStudy || '',
        semester: user.semester || '',
        bio: user.bio || '',
        targetExam: user.targetExam || '',
      });

      setPreferencesData({
        preferredDifficulty: user.preferredDifficulty || 'Medium',
        preferredMarksTier: user.preferredMarksTier || '2m',
        dailyGoalMinutes: user.dailyGoalMinutes || 60,
        emailNotifications: user.emailNotifications ?? true,
      });
    }
  }, [user]);

  const showFeedback = (success, message) => {
    if (success) {
      setSuccessMessage(message);
      setErrorMessage('');
      setTimeout(() => setSuccessMessage(''), 4000);
    } else {
      setErrorMessage(message);
      setSuccessMessage('');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await updateProfile(profileData);
      if (res.success) {
        showFeedback(true, 'Profile details updated successfully!');
      } else {
        showFeedback(false, res.message || 'Failed to update profile');
      }
    } catch (err) {
      showFeedback(false, err.message || 'An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await updateProfile(preferencesData);
      if (res.success) {
        showFeedback(true, 'Study preferences updated successfully!');
      } else {
        showFeedback(false, res.message || 'Failed to update preferences');
      }
    } catch (err) {
      showFeedback(false, err.message || 'An error occurred while saving preferences');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showFeedback(false, 'New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      showFeedback(false, 'New password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      showFeedback(true, 'Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showFeedback(false, err.response?.data?.message || err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const userInitials = user?.name ? user.name.slice(0, 2).toUpperCase() : 'ST';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-charcoal-900 text-slate-800 dark:text-slate-100 flex flex-col transition-colors">
      <Topbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-charcoal-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Profile & Account Settings
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Manage your student identity, college details, examination preferences, and account security
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active Student Account
            </span>
          </div>
        </div>

        {/* Global Feedback alerts */}
        {successMessage && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 text-sm animate-fade-in shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-800 dark:text-rose-200 text-sm animate-fade-in shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Profile Card & Tabs */}
          <div className="space-y-6 lg:col-span-1">
            {/* User Mini Hero Banner */}
            <div className="p-6 rounded-2xl bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-slate-800 shadow-sm text-center relative overflow-hidden">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-brand-500/20 mb-3 border-2 border-white dark:border-charcoal-700">
                {userInitials}
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                {user?.name || 'Student'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {user?.email}
              </p>
              {user?.department && (
                <span className="inline-block mt-2 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-blue-50 text-brand-700 dark:bg-blue-950/50 dark:text-brand-300">
                  {user.department}
                </span>
              )}

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Joined
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2026'}
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm space-y-1">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                  activeTab === 'profile'
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-charcoal-700'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Personal & Academic</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('preferences')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                  activeTab === 'preferences'
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-charcoal-700'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Exam & Study Defaults</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                  activeTab === 'security'
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-charcoal-700'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Password & Security</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('stats')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                  activeTab === 'stats'
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-charcoal-700'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Learning Portfolio</span>
              </button>
            </div>
          </div>

          {/* Right Column: Tab Content */}
          <div className="lg:col-span-3">
            {/* TAB 1: PERSONAL & ACADEMIC DETAILS */}
            {activeTab === 'profile' && (
              <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
                <div className="border-b border-slate-100 dark:border-slate-700/80 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-brand-600" />
                    Personal & Academic Profile
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    These academic details help customize your university question papers, 2M/14M notes, and quiz difficulty.
                  </p>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                        Full Name / Username *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          placeholder="e.g. Dara Alex"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-charcoal-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                        Email Address (Account ID)
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                        <input
                          type="email"
                          disabled
                          value={profileData.email}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-charcoal-800/80 text-slate-500 dark:text-slate-400 cursor-not-allowed text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* College / Institution Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                        College / University / Institution
                      </label>
                      <div className="relative">
                        <School className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={profileData.college}
                          onChange={(e) => setProfileData({ ...profileData, college: e.target.value })}
                          placeholder="e.g. Anna University / IIT Madras"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-charcoal-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                        Department / Branch
                      </label>
                      <div className="relative">
                        <BookOpen className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={profileData.department}
                          onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                          placeholder="e.g. Computer Science and Engineering"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-charcoal-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Degree, Year, Semester */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                        Degree / Program
                      </label>
                      <input
                        type="text"
                        value={profileData.degree}
                        onChange={(e) => setProfileData({ ...profileData, degree: e.target.value })}
                        placeholder="e.g. B.Tech / B.E."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-charcoal-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                        Year of Study
                      </label>
                      <select
                        value={profileData.yearOfStudy}
                        onChange={(e) => setProfileData({ ...profileData, yearOfStudy: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-charcoal-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                      >
                        <option value="">Select Year...</option>
                        <option value="1st Year">1st Year (Freshman)</option>
                        <option value="2nd Year">2nd Year (Sophomore)</option>
                        <option value="3rd Year">3rd Year (Junior)</option>
                        <option value="4th Year">4th Year (Senior / Final)</option>
                        <option value="Postgraduate">Postgraduate / Masters</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                        Current Semester
                      </label>
                      <select
                        value={profileData.semester}
                        onChange={(e) => setProfileData({ ...profileData, semester: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-charcoal-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                      >
                        <option value="">Select Semester...</option>
                        <option value="Semester 1">Semester 1</option>
                        <option value="Semester 2">Semester 2</option>
                        <option value="Semester 3">Semester 3</option>
                        <option value="Semester 4">Semester 4</option>
                        <option value="Semester 5">Semester 5</option>
                        <option value="Semester 6">Semester 6</option>
                        <option value="Semester 7">Semester 7</option>
                        <option value="Semester 8">Semester 8</option>
                      </select>
                    </div>
                  </div>

                  {/* Target Exam Goal & Bio */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Target Exam Focus / Primary Academic Goal
                    </label>
                    <input
                      type="text"
                      value={profileData.targetExam}
                      onChange={(e) => setProfileData({ ...profileData, targetExam: e.target.value })}
                      placeholder="e.g. End-Semester University Exams, GATE 2026, Technical Interviews"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-charcoal-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Bio / Learning Mission
                    </label>
                    <textarea
                      rows={3}
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      placeholder="Write a brief statement on your study interests and learning targets..."
                      className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-charcoal-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-600/20 transition disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {loading ? 'Saving Changes...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: EXAM & STUDY DEFAULTS */}
            {activeTab === 'preferences' && (
              <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
                <div className="border-b border-slate-100 dark:border-slate-700/80 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-indigo-600" />
                    Quiz & Study Workflow Preferences
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Configure your standard defaults for AI quiz generation, 2-mark / 14-mark tests, and daily study milestones.
                  </p>
                </div>

                <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                  {/* Default Marks Tier */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Default Quiz Marks Tier
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { id: '2m', label: '2 Marks (Part A)', desc: 'Short conceptual questions & definitions' },
                        { id: '14m', label: '14 Marks (Part B/C)', desc: 'Comprehensive essay & problem rubrics' },
                        { id: '1m', label: '1 Mark (MCQs)', desc: 'Objective multiple-choice questions' },
                        { id: 'mixed', label: 'Mixed Tier', desc: 'Combined 2M + 14M exam simulation' },
                      ].map((tier) => (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => setPreferencesData({ ...preferencesData, preferredMarksTier: tier.id })}
                          className={`p-3.5 rounded-xl border text-left transition-all ${
                            preferencesData.preferredMarksTier === tier.id
                              ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/40 ring-2 ring-brand-500/20'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-charcoal-700'
                          }`}
                        >
                          <div className="font-bold text-xs text-slate-900 dark:text-white mb-1">{tier.label}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{tier.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Difficulty */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Preferred Question Difficulty
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {['Easy', 'Medium', 'Hard', 'Mixed'].map((diff) => (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => setPreferencesData({ ...preferencesData, preferredDifficulty: diff })}
                          className={`p-3 rounded-xl border text-center font-bold text-xs transition ${
                            preferencesData.preferredDifficulty === diff
                              ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/20'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-charcoal-700'
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Daily Target */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Daily Study Target (Minutes)
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="15"
                        max="240"
                        step="15"
                        value={preferencesData.dailyGoalMinutes}
                        onChange={(e) => setPreferencesData({ ...preferencesData, dailyGoalMinutes: Number(e.target.value) })}
                        className="w-full accent-brand-600"
                      />
                      <span className="font-bold text-sm px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-charcoal-900 text-slate-800 dark:text-slate-200 min-w-24 text-center">
                        {preferencesData.dailyGoalMinutes} Mins
                      </span>
                    </div>
                  </div>

                  {/* Email Notifications Toggle */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">Email Study Summaries & Alerts</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Receive weekly mastery analytics and revision reminders.</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferencesData.emailNotifications}
                        onChange={(e) => setPreferencesData({ ...preferencesData, emailNotifications: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                    </label>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-600/20 transition disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {loading ? 'Saving Preferences...' : 'Save Preferences'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 3: PASSWORD & SECURITY */}
            {activeTab === 'security' && (
              <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
                <div className="border-b border-slate-100 dark:border-slate-700/80 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Lock className="w-5 h-5 text-rose-600" />
                    Security & Password Management
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Keep your StudySense account secure with a strong password.
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-lg">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Current Password *
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-charcoal-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      New Password (Min 8 Characters) *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-charcoal-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-charcoal-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-600/20 transition disabled:opacity-50"
                    >
                      <Shield className="w-4 h-4" />
                      {loading ? 'Updating Password...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 4: LEARNING PORTFOLIO & STATS */}
            {activeTab === 'stats' && (
              <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
                <div className="border-b border-slate-100 dark:border-slate-700/80 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    Student Learning Portfolio & Overview
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Summary of your academic engagement and active learning footprint across StudySense.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Account Status</span>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">Active Student</div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Full access to AI Question Banks & Notes Generator</p>
                  </div>

                  <div className="p-5 rounded-2xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20 space-y-2">
                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider">Default Tier</span>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {preferencesData.preferredMarksTier.toUpperCase()} Focus
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Targeted towards Part A & Part B university questions</p>
                  </div>

                  <div className="p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Daily Milestone</span>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {preferencesData.dailyGoalMinutes} Minutes
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Paced revision and continuous retention target</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-700 text-white shadow-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    <h3 className="font-bold text-base">StudySense Adaptive Learning Active</h3>
                  </div>
                  <p className="text-xs text-blue-100 leading-relaxed max-w-xl">
                    Every quiz you generate, 2M/14M question you practice, and study material you upload automatically updates your knowledge graph and personalized Mistake Book.
                  </p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => navigate('/analytics')}
                      className="px-4 py-2 rounded-xl bg-white text-brand-700 font-bold text-xs hover:bg-blue-50 transition shadow-sm"
                    >
                      View Detailed Learning Analytics →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
