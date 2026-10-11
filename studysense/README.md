# StudySense: Smart Study Evaluator & Personalized LMS

> **MCA Project**: StudySense is a personalized learning management system designed to help students organize academic subjects and topics, assess learning through topic-based quizzes, review mistakes in an active mistake book, and plan revisions based on mastery metrics.

---

## 📌 Implementation Status

| Module | Title | Status | Details |
|---|---|---|---|
| **Module 1** | User Authentication | **Completed & Tested** | Secure HttpOnly Cookie JWT sessions, registration, login, logout, profile validation |
| **Module 2** | Main Dashboard | **Completed & Tested** | Responsive dashboard, real user greeting, genuine metric cards, honest empty states, theme toggle |
| **Module 3** | Subject & Topic Management | *Upcoming* | Organizing syllabi, units, and tracking topic mastery |
| **Module 4** | Quizzes & Knowledge Checks | *Upcoming* | Topic assessments, evaluation scoring, and automated evaluations |
| **Module 5** | Mistake Book | *Upcoming* | Question error logs, review workflows, mistake taxonomy |
| **Module 6** | Revision Planner | *Upcoming* | Spaced repetition intervals and review reminders |
| **Module 7** | Performance Analytics | *Upcoming* | Deep curriculum analytics and mastery graphs |

> **Important Scope Note**: StudySense focuses strictly on learning organization, quiz evaluations, topic mastery, and revision planning. It intentionally **does not** include study session trackers, Pomodoro timers, total hours studied, daily streaks, or time monitoring.

---

## 🗂 Actual Folder Structure

```
studysense/
├── client/
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   ├── src/
│   │   ├── main.jsx                       # React entry point
│   │   ├── App.jsx                        # Route hierarchy (Protected & Public routes)
│   │   ├── index.css                      # Tailwind base & utilities
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Alert.jsx              # Status alerts & banners
│   │   │   │   ├── Button.jsx             # Accessible button variants
│   │   │   │   ├── Input.jsx              # Form input with validation states
│   │   │   │   ├── LoadingScreen.jsx      # Full-screen session loader
│   │   │   │   └── Navbar.jsx             # Public & authenticated navbar
│   │   │   ├── dashboard/
│   │   │   │   ├── DashboardError.jsx     # Error state with Retry action
│   │   │   │   ├── DashboardSkeleton.jsx  # Shimmer loading skeleton
│   │   │   │   ├── QuizPerformanceSection.jsx # Quiz evaluation widget
│   │   │   │   ├── RecentActivitySection.jsx  # Activity log widget
│   │   │   │   ├── RevisionOverviewSection.jsx # Revision overview widget
│   │   │   │   ├── Sidebar.jsx            # Desktop & responsive mobile drawer
│   │   │   │   ├── SubjectOverviewSection.jsx # Subject & topic mastery widget
│   │   │   │   ├── SummaryCard.jsx        # Metric summary card
│   │   │   │   ├── Topbar.jsx             # Top bar with user chip & theme toggle
│   │   │   │   └── WelcomeSection.jsx     # Student welcome banner
│   │   │   └── layouts/
│   │   │       ├── AuthLayout.jsx         # Layout for login/register
│   │   │       ├── DashboardLayout.jsx    # Shell for dashboard workspace
│   │   │       └── MainLayout.jsx         # Base layout wrapper
│   │   ├── context/
│   │   │   ├── AuthContext.jsx            # Authentication state & actions
│   │   │   └── ThemeContext.jsx           # Dark / Light theme toggle
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx          # Student sign-in page
│   │   │   │   └── RegisterPage.jsx       # Student sign-up page
│   │   │   └── dashboard/
│   │   │       └── DashboardPage.jsx      # Main dashboard view
│   │   ├── routes/
│   │   │   ├── ProtectedRoute.jsx         # Guard for authenticated routes
│   │   │   └── PublicRoute.jsx            # Guard for guest-only pages
│   │   └── services/
│   │       ├── api.js                     # Axios client with interceptors
│   │       ├── authService.js             # Auth endpoints client
│   │       └── dashboardService.js        # Dashboard API client
│   └── dist/                              # Production build output
├── server/
│   ├── package.json
│   ├── server.js                          # Express server entry point
│   ├── app.js                             # Express application configuration
│   ├── config/
│   │   └── db.js                          # Mongoose connection with fallback
│   ├── controllers/
│   │   ├── auth.controller.js             # Auth route handlers
│   │   └── dashboard.controller.js        # Dashboard summary handler
│   ├── middleware/
│   │   ├── auth.middleware.js             # JWT verification (Cookie & Bearer)
│   │   ├── error.middleware.js            # Centralized error handler
│   │   ├── rateLimiter.middleware.js      # Auth rate limiter
│   │   └── validation.middleware.js       # Request validation
│   ├── models/
│   │   └── User.js                        # User Mongoose model
│   ├── routes/
│   │   ├── index.js                       # Centralized /api router
│   │   ├── auth.routes.js                 # /api/auth endpoints
│   │   ├── dashboard.routes.js            # /api/dashboard endpoints
│   │   └── health.routes.js               # /api/health endpoint
│   ├── services/
│   │   ├── auth.service.js                # Auth business logic
│   │   └── dashboard.service.js           # Dashboard metrics aggregation
│   ├── tests/
│   │   ├── auth.test.js                   # Node test runner for Module 1
│   │   └── dashboard.test.js              # Node test runner for Module 2
│   └── utils/
│       ├── response.utils.js              # Standardized JSON response envelope
│       └── token.utils.js                 # JWT sign/verify & cookie management
└── docs/
    └── MODULE_2_DASHBOARD.md              # Module 2 technical specification
```

---

## 🚀 Getting Started Locally

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017/studysense`) or MongoDB Atlas URI

### 1. Backend Setup
Navigate to `server/`:
```bash
cd server
npm install
```

Configure `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/studysense?retryWrites=true&w=majority
LOCAL_MONGO_URI=mongodb://127.0.0.1:27017/studysense
JWT_SECRET=studysense_jwt_super_secure_random_key_2026_mca_project_987654321
JWT_EXPIRE=1d
COOKIE_SECRET=studysense_cookie_secure_sign_secret_key_88492047209
CLIENT_URL=http://localhost:5173
```

Start the backend:
```bash
npm run dev
# or: node server.js
```
The server will start at `http://localhost:5000`.

### 2. Frontend Setup
Navigate to `client/`:
```bash
cd client
npm install
```

Configure `client/.env`:
```env
VITE_API_BASE_URL=/api
```

Start Vite development server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🧪 Testing

Run backend test suites:
```bash
cd server
npm test
```
All 19 automated tests across `auth.test.js` and `dashboard.test.js` will execute.

Run frontend production build verification:
```bash
cd client
npm run build
```

---

## 📡 Dashboard API Endpoint

### `GET /api/dashboard/summary`
Requires valid HttpOnly session cookie (`studysense_token`) or `Authorization: Bearer <token>`.

#### Response Contract:
```json
{
  "success": true,
  "message": "Dashboard summary retrieved successfully",
  "data": {
    "user": {
      "id": "6732f9...",
      "name": "Student Name",
      "email": "student@example.com",
      "memberSince": "2026-10-11T14:00:00.000Z"
    },
    "summary": {
      "subjectsCount": 0,
      "topicsMastered": 0,
      "quizzesCompleted": 0,
      "averageQuizScore": null
    },
    "subjectProgress": [],
    "quizPerformance": [],
    "upcomingRevisions": [],
    "recentActivity": [],
    "meta": {
      "modulesImplemented": {
        "module1_auth": true,
        "module2_dashboard": true,
        "module3_subjects_topics": false,
        "module4_quizzes": false,
        "module5_mistakes": false,
        "module6_revisions": false
      }
    }
  }
}
```

---

## ⚠️ Known Limitations & Future Modules
- **Subjects and Topics**: Awaiting Module 3. Real subjects will populate the summary count and progress cards once the Mongoose models and controllers are added in Module 3.
- **Quizzes**: Awaiting Module 4. Quiz count and average score calculations will activate dynamically upon quiz attempts.
- **Revisions**: Awaiting Module 6. Spaced revision scheduling will display pending reviews.
- **No Deployment**: As required, deployment to cloud hosting is deferred until all 7 modules are completed and validated.
