import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Folder,
  BookOpen,
  Lightbulb,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import doubtSolverService from '../../services/doubtSolverService';
import { subjectService } from '../../services/subjectService';

const DoubtSolverDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      directAnswer: 'Hi! I am your StudySense Syllabus Assistant.',
      explanation:
        'Select any enrolled subject or syllabus unit, and ask me questions or speak your doubts. I will reference your saved notes and curriculum topics directly.',
      keyConcepts: ['Contextual Syllabus', 'Step-by-step breakdown', 'Exam Tips'],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechActive, setSpeechActive] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const loadSubjects = async () => {
    try {
      const res = await subjectService.getAllSubjects();
      if (res.data?.success && res.data.data?.length > 0) {
        setSubjects(res.data.data);
        setSelectedSubjectId(res.data.data[0]._id || res.data.data[0].id);
      }
    } catch (err) {
      console.warn('[DoubtDrawer] Failed to fetch subjects:', err.message);
    }
  };

  const handleSend = async (overrideText = '') => {
    const query = overrideText || inputQuery;
    if (!query.trim() || loading) return;

    const userMessage = { sender: 'user', text: query.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await doubtSolverService.askDoubt({
        query: query.trim(),
        subjectId: selectedSubjectId || null,
      });

      if (res.success && res.data?.result) {
        const botReply = {
          sender: 'assistant',
          ...res.data.result,
        };
        setMessages((prev) => [...prev, botReply]);
      } else {
        throw new Error(res.message || 'Unable to solve doubt');
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          directAnswer: 'Sorry, I encountered an issue analyzing your query.',
          explanation: err.response?.data?.message || err.message || 'Please try rephrasing your question.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputQuery(transcript);
      handleSend(transcript);
    };

    recognition.start();
  };

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    if (speechActive) {
      window.speechSynthesis.cancel();
      setSpeechActive(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeechActive(false);
    utterance.onerror = () => setSpeechActive(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeechActive(true);
  };

  return (
    <>
      {/* Floating Widget Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          title="Open AI Syllabus Assistant & Doubt Solver"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
          </div>
          <span>Ask Assistant</span>
        </button>
      )}

      {/* Slide-over Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div
            className="w-full max-w-md h-full bg-white dark:bg-charcoal-850 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">AI Syllabus Assistant</h3>
                  <p className="text-[11px] text-brand-100">Context-Aware Doubt Solver</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  window.speechSynthesis?.cancel();
                  setIsOpen(false);
                }}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Context Selector Bar */}
            <div className="px-4 py-2 bg-slate-50 dark:bg-charcoal-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Folder className="w-3.5 h-3.5 text-brand-500 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                Active Subject:
              </span>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="flex-1 text-xs bg-white dark:bg-charcoal-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
              >
                <option value="">All Subjects (General Context)</option>
                {subjects.map((s) => (
                  <option key={s._id || s.id} value={s._id || s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {msg.sender === 'user' ? (
                    <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tr-xs bg-brand-600 text-white text-xs font-medium leading-relaxed shadow-xs">
                      {msg.text}
                    </div>
                  ) : (
                    <div className="max-w-[95%] p-3.5 rounded-2xl rounded-tl-xs bg-slate-50 dark:bg-charcoal-800 border border-slate-200/90 dark:border-slate-700 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                          StudySense Assistant
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            speakText(`${msg.directAnswer}. ${msg.explanation || ''}`)
                          }
                          className="p-1 text-slate-400 hover:text-brand-600 transition-colors"
                          title="Read out loud"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {msg.directAnswer && (
                        <p className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                          {msg.directAnswer}
                        </p>
                      )}

                      {msg.explanation && (
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          {msg.explanation}
                        </p>
                      )}

                      {msg.keyConcepts?.length > 0 && (
                        <div className="pt-1.5 flex flex-wrap gap-1">
                          {msg.keyConcepts.map((kc, kIdx) => (
                            <span
                              key={kIdx}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-charcoal-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                            >
                              {kc}
                            </span>
                          ))}
                        </div>
                      )}

                      {msg.examTip && (
                        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-[11px] leading-relaxed">
                          <strong>Exam Tip: </strong> {msg.examTip}
                        </div>
                      )}

                      {msg.suggestedFollowUps?.length > 0 && (
                        <div className="pt-1 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                            Suggested Follow-ups
                          </span>
                          <div className="space-y-1">
                            {msg.suggestedFollowUps.map((fu, fIdx) => (
                              <button
                                key={fIdx}
                                type="button"
                                onClick={() => handleSend(fu)}
                                className="w-full text-left p-1.5 rounded-lg bg-white dark:bg-charcoal-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:text-brand-600 hover:border-brand-300 transition-all text-[11px] font-medium"
                              >
                                &bull; {fu}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-charcoal-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                  <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />
                  <span>Referencing subject syllabus and notes...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Footer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 bg-white dark:bg-charcoal-850 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
            >
              <button
                type="button"
                onClick={handleToggleVoiceInput}
                className={`p-2.5 rounded-xl border transition-all ${
                  isListening
                    ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                    : 'bg-slate-100 dark:bg-charcoal-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
                title={isListening ? 'Listening... click to stop' : 'Tap to speak your question'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                placeholder={isListening ? 'Listening...' : 'Ask a doubt on this subject...'}
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                className="flex-1 p-2.5 rounded-xl bg-slate-100 dark:bg-charcoal-800 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              />

              <button
                type="submit"
                disabled={!inputQuery.trim() || loading}
                className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-40 transition-colors cursor-pointer"
                title="Send query"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default DoubtSolverDrawer;
