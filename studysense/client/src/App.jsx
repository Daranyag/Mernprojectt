import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import SubjectsPage from './pages/subjects/SubjectsPage';
import SubjectDetailPage from './pages/subjects/SubjectDetailPage';
import MaterialsPage from './pages/materials/MaterialsPage';
import QuestionBankPage from './pages/quiz/QuestionBankPage';
import QuizzesPage from './pages/quiz/QuizzesPage';
import TakeQuizPage from './pages/quiz/TakeQuizPage';
import QuizResultsPage from './pages/quiz/QuizResultsPage';
import MistakeBookPage from './pages/mistakes/MistakeBookPage';
import PracticeEnginePage from './pages/mistakes/PracticeEnginePage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import ExamPaperGeneratorPage from './pages/examPaper/ExamPaperGeneratorPage';
import ImportantTopicsPage from './pages/importantTopics/ImportantTopicsPage';
import SettingsPage from './pages/settings/SettingsPage';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicRoute from './routes/PublicRoute';

const App = () => {
  return (
    <Routes>
      {/* Public routes (inaccessible once authenticated) */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Protected routes (requiring active authentication) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subjects"
        element={
          <ProtectedRoute>
            <SubjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subjects/:subjectId"
        element={
          <ProtectedRoute>
            <SubjectDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/materials"
        element={
          <ProtectedRoute>
            <MaterialsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/question-bank"
        element={<Navigate to="/quizzes" replace />}
      />
      <Route
        path="/quizzes"
        element={
          <ProtectedRoute>
            <QuizzesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quizzes/:quizId/take"
        element={
          <ProtectedRoute>
            <TakeQuizPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz-results/:attemptId"
        element={
          <ProtectedRoute>
            <QuizResultsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mistake-book"
        element={
          <ProtectedRoute>
            <MistakeBookPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mistake-book/practice"
        element={
          <ProtectedRoute>
            <PracticeEnginePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exam-paper-generator"
        element={
          <ProtectedRoute>
            <ExamPaperGeneratorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/important-topics"
        element={
          <ProtectedRoute>
            <ImportantTopicsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Default route redirect to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Catch-all redirect to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
