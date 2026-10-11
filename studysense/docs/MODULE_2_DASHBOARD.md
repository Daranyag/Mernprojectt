# StudySense — Module 2: Main Dashboard Architecture & Implementation

## 1. Overview
Module 2 establishes the student workspace for StudySense: Smart Study Evaluator and Personalized Learning Management System. It introduces the main layout shell, navigation system, personalized greeting, metric overview cards, and dedicated sections for future curriculum features.

In accordance with strict project specifications, **no study monitoring features** (such as session tracking, Pomodoro timers, total hours studied, streaks, or productivity monitoring) are implemented. The dashboard strictly focuses on learning organization, quiz evaluations, topic mastery, and revision planning.

---

## 2. Architecture & Design Principles

### A. Frontend Architecture
- **Framework**: React 18 with Vite.
- **Styling**: Tailwind CSS with class-based light/dark theme toggle (`ThemeContext`).
- **Icons**: Lucide React (`LayoutDashboard`, `BookOpen`, `HelpCircle`, `Award`, `CalendarCheck`, etc.).
- **Component Breakdown**:
  - `DashboardPage.jsx`: Main state coordinator handling `loading`, `error`, `retrying`, and `data` states.
  - `DashboardLayout.jsx`: Master layout containing `Sidebar` and `Topbar`.
  - `Sidebar.jsx`: Responsive desktop navigation and mobile drawer with badges for upcoming modules.
  - `Topbar.jsx`: Sticky header containing breadcrumb, theme toggle, student badge, and logout action.
  - `WelcomeSection.jsx`: Dynamic student greeting banner using authenticated user's real name.
  - `SummaryCard.jsx`: Metric presentation card supporting counts, averages, and empty state badges.
  - `SubjectOverviewSection.jsx`: Subject progression and curriculum mastery section.
  - `QuizPerformanceSection.jsx`: Quiz assessment results and accuracy display.
  - `RevisionOverviewSection.jsx`: Spaced revision reminders.
  - `RecentActivitySection.jsx`: Academic milestones and events.
  - `DashboardSkeleton.jsx`: Shimmer skeleton loading state.
  - `DashboardError.jsx`: Error state displaying issue details and a working Retry button.

### B. Backend Architecture
- **Framework**: Express.js with Node.js in MVC pattern.
- **Route**: `GET /api/dashboard/summary` mounted in `server/routes/dashboard.routes.js`.
- **Middleware**: `protect` middleware (`server/middleware/auth.middleware.js`) verifying JWT from HttpOnly cookie or Authorization header.
- **Controller**: `server/controllers/dashboard.controller.js`.
- **Service**: `server/services/dashboard.service.js`.
- **Database Model**: `User` (and safe dynamic query checks for upcoming models).

---

## 3. API Request Flow

```
1. Client loads /dashboard
2. ProtectedRoute checks AuthContext.isLoading & AuthContext.isAuthenticated
3. DashboardPage calls dashboardService.getSummary() via Axios (withCredentials: true)
4. Express receives GET /api/dashboard/summary
5. auth.middleware.js verifies HttpOnly 'studysense_token' cookie or Bearer token
6. req.user populated from User.findById(decoded.id)
7. dashboard.controller.js delegates to dashboard.service.js with req.user.id
8. dashboard.service.js queries User record & counts user-scoped data
9. Standardized envelope returned:
   {
     "success": true,
     "message": "Dashboard summary retrieved successfully",
     "data": { ... }
   }
10. DashboardPage displays personalized metrics or honest empty states
```

---

## 4. Metric Calculations & Honesty Guarantees

| Metric | Source Model | Value When Unimplemented / Empty | Never Allowed |
|---|---|---|---|
| **Total Subjects** | `Subject` (Module 3) | `0` | Fabricated mock subjects |
| **Topics Mastered** | `Topic` (Module 3) | `0` | Fake mastery percentages |
| **Quizzes Completed** | `Quiz` (Module 4) | `0` | Synthetic test attempts |
| **Average Quiz Score** | `Quiz` (Module 4) | `null` (Displayed as `'N/A'`) | Random percentage numbers |
| **Study Hours / Time** | **Not in scope** | **Omitted completely** | Timers, Pomodoro, streaks |

All metrics reflect genuine database records belonging to the authenticated user (`{ user: req.user.id }`).

---

## 5. Empty-State Behavior
When a student has no records or when future modules are not yet implemented:
- **Subjects Section**: Displays an informative card: *"Your subjects will appear here. Subject & Topic Management is scheduled next for Module 3."*
- **Quiz Performance**: Displays: *"No quiz evaluations yet. Quiz functionality will be unlocked in Module 4: Quizzes."*
- **Revision Planner**: Displays: *"No scheduled revisions. Personalized revision planning will be introduced in Module 6: Revision Planner."*
- **Recent Activity**: Displays: *"No recent learning activity yet. Your learning activity stream will track completed topic evaluations..."*
- **Sidebar**: Nav items for Modules 3-7 are labeled with distinct badges (e.g. `Module 3`, `Module 4`) and disabled to prevent broken navigation.

---

## 6. Authentication Integration
- Protected by `ProtectedRoute.jsx`. Unauthenticated visits to `/dashboard` immediately redirect to `/login` with location state preserved.
- Direct API endpoint `GET /api/dashboard/summary` returns `401 Unauthorized` without credentials.
- Logout terminates session on server via `POST /api/auth/logout` (clearing `studysense_token` HttpOnly cookie) and clears client React state, redirecting to `/login`.

---

## 7. Testing & Verification Performed

### Backend Tests (`server/tests/dashboard.test.js`)
- ✅ `GET /api/dashboard/summary` rejects unauthenticated requests with 401.
- ✅ `GET /api/dashboard/summary` rejects invalid/forged bearer tokens with 401.
- ✅ `GET /api/dashboard/summary` returns 200 OK for authenticated user with HttpOnly cookie.
- ✅ Returns authentic empty metrics without mock data.
- ✅ Strict user data isolation: User A receives only User A's data, User B receives only User B's data.
- ✅ Metadata payload confirms implementation status flags.

### End-to-End Browser Verification
- Tested with Chrome via automated browser subagent:
  1. Unauthenticated redirect from `/dashboard` to `/login`.
  2. Registration of new student account.
  3. Immediate redirect to `/dashboard` with student's real name.
  4. Inspection of summary cards (`0`, `0`, `0`, `N/A`).
  5. Dark/Light mode theme toggle execution.
  6. Logout execution and session termination.
  7. Route protection check post-logout.

### Build Verification
- Client production build (`npm run build`) succeeded with zero errors.

---

## 8. Known Limitations & Next Steps
- **Limitation**: Currently only `User` model exists. Subjects, topics, quizzes, and revisions will populate dynamically as subsequent modules are developed.
- **Next Recommended Step**: **Module 3: Subject & Topic Management**, which will introduce the `Subject` and `Topic` models and enable syllabus organization.
