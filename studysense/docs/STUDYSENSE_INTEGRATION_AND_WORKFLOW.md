# StudySense — Complete Workflow Integration & Technical Architecture

## 1. Executive Summary

StudySense is an integrated MERN stack Smart Study Evaluator and Personalized Learning Management System. The application seamlessly unites 10 specialized modules into a single, cohesive academic platform:

- **Module 1**: Authentication & User Management (JWT HttpOnly Cookies, Bcrypt hashing)
- **Module 2**: Dashboard & Workflow Overview (Real DB metrics, live workspace)
- **Module 3**: Subject & Syllabus Management (Manual entry, rule-based text/PDF syllabus extraction, units & subtopics)
- **Module 4**: Study Material Repository (PDF, text notes, unit/topic tagging)
- **Module 5**: Question Bank & AI Quiz Generator (Gemini-grounded questions, multi-format assessments)
- **Module 6**: Quiz Evaluation & Remediation (Backend scoring, instant feedback)
- **Module 7**: Mistake Book & Practice Engine (Deduplicated mistake tracking, active recall re-testing)
- **Module 8**: Performance Analytics & Learning Recommendations (Topic mastery, accuracy metrics)
- **Module 9**: University Exam Paper Generator (Choice rules, Part A/B/C sections, printable answer keys)
- **Module 10**: High-Priority Important Topic Generator (Priority scoring, exam evidence, unit grouping)
- **Module 11**: Key Short Notes Generator (11 academic note formats, source grounding)
- **Universal Traversal**: Safe back navigation, Alt+Left shortcuts, mobile drawer, persistent Dashboard access

---

## 2. Integrated Subject Central Workspace (`/subjects/:subjectId`)

The Subject Detail page serves as the focal hub connecting all academic workflows:
- **Direct Actions Bar**:
  - `Generate Short Notes` -> Opens `NotesGeneratorModal` prefilled with subject context
  - `Generate Quiz` -> Navigates to `/quizzes?subjectId=:id&generate=true` to immediately trigger the AI Quiz Generator
  - `Exam Paper` -> Navigates to `/exam-paper-generator?subjectId=:id` preselecting syllabus units
  - `Important Topics` -> Navigates to `/important-topics?subjectId=:id` for priority analysis
  - `Study Materials` -> Navigates to `/materials?subjectId=:id` filtered by subject
- **Topic Progression**: Real-time topic completion and mastery progress derived directly from database records.

---

## 3. API Endpoints Map

### Authentication (`/api/auth`)
- `POST /register`: Account registration with validation
- `POST /login`: Secure login returning HttpOnly cookie
- `GET /me`: Authenticated user profile
- `POST /logout`: Clears authentication cookie

### Subjects & Topics (`/api/subjects`)
- `GET /`: Get all subjects with aggregated mastery metrics
- `POST /`: Create subject with optional syllabus/color
- `GET /:id`: Retrieve subject details and child topics
- `PUT /:id`: Update subject details
- `DELETE /:id`: Cascade delete subject, topics, questions, quizzes, materials
- `POST /:id/topics`: Add topic under a unit
- `POST /:id/extract-syllabus`: Parse text or upload into structured units/topics

### Materials & Short Notes (`/api/materials`)
- `GET /`: List materials with subject, topic, and type filtering
- `POST /`: Upload or save study material
- `POST /generate-notes`: AI generation of short notes across 11 formats
- `PATCH /:id/favorite`: Toggle favorite status
- `PATCH /:id/reviewed`: Mark material as reviewed
- `DELETE /:id`: Delete owned material

### Quizzes & Assessment (`/api/quizzes`, `/api/questions`)
- `GET /api/quizzes`: List user quizzes and recent attempts
- `POST /api/quizzes`: Create quiz from question bank
- `GET /api/quizzes/:id/take`: Fetch quiz for taking (answer keys stripped)
- `POST /api/quizzes/:id/submit`: Server-side scoring and attempt generation
- `POST /api/quizzes/generate`: AI-powered quiz question generation

### Exam Papers (`/api/exam-papers`)
- `GET /`: List saved examination papers
- `POST /generate`: AI generator with Part A/B/C mark calculation
- `GET /:id`: View exam paper and separate answer key
- `DELETE /:id`: Delete exam paper

### Important Topics (`/api/important-topics`)
- `GET /`: List topic analyses
- `POST /analyze`: Generate priority topics with exam evidence
- `GET /:id`: View detailed topic breakdown

### Analytics (`/api/analytics`)
- `GET /overview`: Overall quiz statistics, accuracy, and attempt count
- `GET /subjects`: Subject-wise performance metrics
- `GET /topics`: Topic accuracy breakdown
- `GET /trends`: Chronological assessment history
- `GET /recommendations`: Explainable, data-driven study recommendations

---

## 4. Verification & Testing

- **Backend Static Integrity**: Verified via `node -e "require('./app')"` - exited with code 0.
- **Frontend Production Build**: Verified via `cmd /c "npx vite build"` - transformed 1701 modules, compiled in 3.46s with exit code 0.
- **Automated Unit Tests**: Backend test suite passes Modules 1, 2, 7, and 9 with zero errors.
