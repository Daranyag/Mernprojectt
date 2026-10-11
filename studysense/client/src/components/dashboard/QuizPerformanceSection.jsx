import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Award, CheckCircle2, ArrowRight } from 'lucide-react';

const QuizPerformanceSection = ({ quizData = [], quizzesCompleted = 0, averageScore = null }) => {
  const hasQuizHistory = quizzesCompleted > 0 && quizData && quizData.length > 0;

  return (
    <div className="bg-white dark:bg-charcoal-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Quiz Performance Overview
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluations and knowledge verification
            </p>
          </div>
        </div>

        <Link
          to="/analytics"
          className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 hover:bg-violet-100 transition inline-flex items-center gap-1"
        >
          Analytics &rarr;
        </Link>
      </div>

      {hasQuizHistory ? (
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/40">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Average Evaluation Score</p>
              <p className="text-2xl font-extrabold text-violet-700 dark:text-violet-300">
                {averageScore !== null ? `${averageScore}%` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Quizzes Completed</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {quizzesCompleted}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {quizData.map((quiz, index) => (
              <div
                key={quiz.id || index}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    {quiz.title || `Quiz #${index + 1}`}
                  </span>
                </div>
                <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                  {quiz.score}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Honest empty state when no quizzes have been completed yet */
        <div className="mt-6 py-8 px-4 text-center rounded-xl bg-slate-50 dark:bg-charcoal-900/60 border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-950/70 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-3">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            No quiz evaluations yet
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1 leading-relaxed">
            Take a quiz to evaluate your subject knowledge. Your score trends and topic mastery will appear here and in Performance Analytics.
          </p>
          <Link
            to="/quizzes"
            className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 transition"
          >
            Go to Quizzes
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default QuizPerformanceSection;
