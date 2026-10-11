# StudySense — Global Navigation & In-App Traversal

## 1. Overview

The StudySense MERN platform features an integrated, accessible navigation architecture that guarantees safe traversal across all modules:
- Persistent access to the primary **Dashboard** from both desktop and mobile viewports.
- An accessible **BackButton** with keyboard navigation (`Alt + Left Arrow`), history depth checks, and sensible fallback routing.
- Context-aware workflows between Subject Details, Quiz Taking, Mistake Book, Exam Paper Generator, and Important Topics.

---

## 2. Global Back Navigation (`BackButton` & `useSafeBackNavigation`)

### Implementation
- **Custom Hook**: `client/src/hooks/useSafeBackNavigation.js`
  - Inspects `location.state.from` for explicit originating routes.
  - Checks `window.history.length > 2` before invoking `navigate(-1)` to prevent exiting the application or encountering blank windows.
  - Automatically redirects to a safe fallback (`/dashboard` or parent workflow route) on direct visits or refreshed browser sessions.
- **Reusable Component**: `client/src/components/common/BackButton.jsx`
  - Rendered at the top of all workflow pages via `DashboardLayout`.
  - Accessible label, high contrast styling, keyboard focus indicators, and touch-friendly target area.

### Keyboard Shortcuts
- **`Alt + Left Arrow`**: Triggers safe backward navigation globally across all authenticated pages (automatically bypassed when active inside inputs or textareas).

---

## 3. Workflow-Specific Navigation Fallbacks

| Current Page | Back Navigation Fallback | State / Context Preservation |
|---|---|---|
| **Subject Detail** (`/subjects/:subjectId`) | `/subjects` | Preserves selected subject and loaded topics |
| **Active Quiz Session** (`/quizzes/:quizId/take`) | `/quizzes` | Prompts confirmation before abandoning in-progress questions |
| **Quiz Results** (`/quiz-results/:attemptId`) | `/quizzes` & `/dashboard` | Preserves attempt score history, link to Mistake Book |
| **Practice Engine** (`/mistake-book/practice`) | `/mistake-book` | Retains mistakes status and session outcomes |
| **Exam Paper Generator** (`/exam-paper-generator`) | `/dashboard` | Preserves preselected `subjectId` from query params |
| **Important Topics** (`/important-topics`) | `/dashboard` | Preserves preselected `subjectId` from query params |
| **Materials / Short Notes** (`/materials`) | `/dashboard` | Preserves filtered `subjectId` from query params |

---

## 4. Mobile Layout & Persistent Dashboard Access

- **Mobile Drawer**: Responsive hamburger trigger in `Topbar` opens drawer with instant navigation to Dashboard, Subjects, Materials, Question Bank, Quizzes, Mistake Book, Exam Paper Generator, and Important Topics.
- **Brand Click & Header Links**: Brand header navigates directly to `/dashboard`.
- **Global Breadcrumb / Back Bar**: Integrated into `DashboardLayout`, appearing below the topbar and above page content on all non-root pages.
