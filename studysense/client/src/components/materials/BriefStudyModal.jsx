import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  BookOpen,
  Sparkles,
  Lightbulb,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  GraduationCap,
  Copy,
  Check,
  Layers,
  FileCheck,
} from 'lucide-react';
import Button from '../common/Button';

/**
 * Standard Academic Brief Knowledge Base for instant high-yield revision
 */
const getBriefTopicKnowledge = (topicTitle = '', subjectName = '') => {
  const tLower = topicTitle.toLowerCase();
  const sLower = subjectName.toLowerCase();

  // Intelligent context deduction
  let quickSummary = `${topicTitle} is an essential foundational pillar in ${subjectName}. It establishes core structural rules, coordinates component lifecycles, and guarantees deterministic execution under system constraints.`;
  let mechanism = [
    'Initialization & Verification: Validates incoming requests and allocates system resources safely.',
    'State Transition & Processing: Coordinates scheduling, boundary checks, and concurrent state synchronization.',
    'Finalization & Consistency: Enforces atomicity, updates tracking registries, and releases allocated memory or locks.',
  ];
  let realWorldExample = `In modern operating systems and enterprise systems (such as Linux, Windows, or distributed cloud databases), this mechanism prevents data corruption and minimizes execution overhead.`;
  let twoMarkAnswer = `Q: Define ${topicTitle}.\nAns: ${topicTitle} is an operational mechanism in ${subjectName} responsible for managing resource allocation, maintaining computational state, and enforcing system consistency with minimal latency.`;
  let tenMarkRoadmap = [
    'Section 1: Formal Definition, Architectural Overview, and Block Diagram.',
    'Section 2: Detailed Algorithmic Steps and State Transition Flowchart.',
    'Section 3: Mathematical / Computational Complexity (Time & Space Bounds).',
    'Section 4: Comparative Evaluation against alternative legacy techniques.',
    'Section 5: Practical Engineering Trade-offs and Modern Optimization Strategies.',
  ];
  let memoryMnemonic = `Remember the 'AIC' Rule: Abstraction (simplifies interface), Isolation (prevents interference), and Correctness (ensures reliable completion).`;

  if (/process|scheduling|fcfs|sjf|round robin/i.test(tLower)) {
    quickSummary = 'Process management governs program execution, PCB context switching, and CPU time allocation across concurrent user threads.';
    mechanism = [
      'State Transitions: New -> Ready -> Running -> Waiting -> Terminated.',
      'Context Switching: MMU and registers saved into Process Control Block (PCB).',
      'Scheduler Dispatch: Short-term scheduler assigns CPU based on turnaround and waiting time algorithms.',
    ];
    realWorldExample = 'Linux CFS (Completely Fair Scheduler) uses red-black trees to balance CPU runtime fairly across server containers.';
    twoMarkAnswer = 'Q: What is a Process Control Block (PCB)?\nAns: A PCB is an OS data structure storing process state, program counter, CPU registers, memory limits, and open file lists required to pause and resume process execution.';
    memoryMnemonic = 'PCB Holds: P (Process state), C (Counters & registers), B (Boundaries of memory & I/O).';
  } else if (/deadlock|banker|concurrency|semaphore|mutex/i.test(tLower)) {
    quickSummary = 'Deadlock occurs when concurrent processes are permanently blocked because each holds resources required by another in a circular wait.';
    mechanism = [
      'Coffman Conditions: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait.',
      'Resource Allocation Graph (RAG): Cycle detection in graphs determines deadlock potential.',
      'Banker’s Algorithm: Simulates maximum resource allocations to verify if state remains safe.',
    ];
    realWorldExample = 'Database systems use transaction wait-for graphs and lock timeouts to automatically abort one deadlock transaction (victim selection).';
    twoMarkAnswer = 'Q: State the 4 necessary conditions for deadlock.\nAns: 1. Mutual Exclusion, 2. Hold and Wait, 3. No Preemption, 4. Circular Wait. Deadlock cannot occur if any one condition is eliminated.';
    memoryMnemonic = 'M-H-N-C: Mutual exclusion, Hold & wait, No preemption, Circular wait.';
  } else if (/memory|paging|virtual memory|tlb|segmentation/i.test(tLower)) {
    quickSummary = 'Memory management maps logical process addresses into physical DRAM pages, using TLB hardware caches and demand paging.';
    mechanism = [
      'Address Translation: Virtual address = Page Number (p) + Page Offset (d).',
      'TLB Lookup: Translation Lookaside Buffer checks page cache in < 1 nanosecond.',
      'Page Fault Handling: If valid bit is 0, OS issues I/O to swap space and updates page table.',
    ];
    realWorldExample = 'Modern 64-bit x86-64 CPUs implement 4-level or 5-level paging tables with 4KB or 2MB HugePages for fast cloud memory allocation.';
    twoMarkAnswer = 'Q: What is Thrashing in Virtual Memory?\nAns: Thrashing occurs when the OS spends more time swapping pages in and out of disk than executing instructions, caused by insufficient physical frames allocated to working sets.';
    memoryMnemonic = 'TLB: Translation Lookaside Buffer = Fast hardware cache for Page Tables.';
  }

  return {
    quickSummary,
    mechanism,
    realWorldExample,
    twoMarkAnswer,
    tenMarkRoadmap,
    memoryMnemonic,
  };
};

export const BriefStudyModal = ({
  isOpen,
  onClose,
  topicTitle = '',
  subjectName = 'Course Subject',
  subjectId = '',
}) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const study = getBriefTopicKnowledge(topicTitle, subjectName);

  const handleCopySummary = () => {
    const text = `Study Sense Brief Guide: ${topicTitle} (${subjectName})
Quick Summary:
${study.quickSummary}

Mechanism:
${study.mechanism.join('\n')}

Exam 2-Mark Answer:
${study.twoMarkAnswer}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenQuiz = () => {
    onClose();
    if (subjectId) {
      navigate(`/quizzes?subjectId=${subjectId}&generate=true`);
    } else {
      navigate('/quizzes');
    }
  };

  const handleOpenExamPaper = () => {
    onClose();
    if (subjectId) {
      navigate(`/exam-paper-generator?subjectId=${subjectId}`);
    } else {
      navigate('/exam-paper-generator');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-charcoal-850 rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  Study Briefly &bull; Quick Revision
                </span>
                <span className="text-xs text-slate-400">&bull; {subjectName}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                {topicTitle}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="space-y-4 overflow-y-auto flex-1 pr-1 py-4 custom-scrollbar">
          {/* Quick Concept Summary */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-brand-950/40 dark:to-indigo-950/40 border border-brand-200/80 dark:border-brand-800/80 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-700 dark:text-brand-300">
              <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>30-Second Concept Snapshot</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {study.quickSummary}
            </p>
          </div>

          {/* Operational Mechanism */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-charcoal-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Core Mechanism & Lifecycle Flow</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              {study.mechanism.map((m, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Real World Application */}
          <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/60 flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 dark:text-slate-300">
              <strong className="text-emerald-800 dark:text-emerald-300">Industry Context: </strong>
              {study.realWorldExample}
            </div>
          </div>

          {/* Exam Questions & Model Answer */}
          <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/80 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
              <FileCheck className="w-4 h-4 text-amber-600" />
              <span>High-Yield University Exam Model Answer (2-Mark Question)</span>
            </div>
            <pre className="text-xs text-slate-800 dark:text-slate-200 font-sans whitespace-pre-wrap leading-relaxed bg-white/70 dark:bg-charcoal-900/60 p-3 rounded-lg border border-amber-200/50 dark:border-amber-900/40">
              {study.twoMarkAnswer}
            </pre>
          </div>

          {/* 10-Mark Answer Structure Roadmap */}
          <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/60 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-800 dark:text-purple-300">
              <GraduationCap className="w-4 h-4 text-purple-600" />
              <span>10-Mark Essay Answer Roadmap</span>
            </div>
            <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
              {study.tenMarkRoadmap.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Memory Mnemonic */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-charcoal-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 italic">
            💡 <strong>Memory Aid:</strong> {study.memoryMnemonic}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Key Points'}</span>
          </button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenExamPaper}
              className="text-xs gap-1.5"
            >
              <FileCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Test in Exam Paper</span>
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleOpenQuiz}
              className="text-xs gap-1.5 bg-brand-600 hover:bg-brand-700 text-white"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Take Quick Quiz</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BriefStudyModal;
