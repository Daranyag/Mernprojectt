# Module 5: Quiz and Question Bank Management

## Overview
**StudySense: Smart Study Evaluator and Personalized Learning Management System**
Module 5 implements Question Bank management, multiple-choice quiz creation, secure quiz-taking without answer leakage, authoritative server-side scoring, and attempt result evaluations.

---

## 1. Features Implemented

1. **Question Bank (`/question-bank`):**
   - Create, edit, list, and delete multiple-choice questions organized under user's subjects and topics.
   - Question text validation, minimum 2 options with unique IDs, correct option verification.
   - Difficulty level (`Easy`, `Medium`, `Hard`), optional tags, and answer explanations.
   - Filter questions by Subject, Topic, Difficulty, and search keyword.
2. **Quiz Management (`/quizzes`):**
   - Create and configure custom quizzes referencing question IDs from the user's question bank.
   - Supports optional shuffling for question sequence and option order.
   - Validates that all questions belong to the authenticated student and the selected subject.
   - Safely preserves attempt integrity when a quiz is deleted.
3. **Secure Quiz Taking (`/quizzes/:quizId/take`):**
   - Dedicated quiz-taking screen with responsive question navigation.
   - **Zero Answer Leakage:** Server completely omits `correctOptionId`, answer keys, and explanations before submission.
   - Clear indicators for answered vs unanswered questions.
   - Progress measured by questions completed out of total questions (**No timers or time-spent monitoring**).
4. **Authoritative Server-Side Scoring & Submission (`POST /api/quizzes/:id/submit`):**
   - Evaluates each answer on the server against the database record.
   - Client-supplied scores, correctness flags, or percentage overrides are strictly rejected.
   - Records genuine `score`, `percentage`, `correctAnswers`, `incorrectAnswers`, and `unansweredCount`.
5. **Quiz Results & Review (`/quiz-results/:attemptId`):**
   - Detailed per-question answer review clearly distinguishing student choice from correct answer.
   - Reveals authoritative explanations only after quiz completion.
   - Option to retry quiz if quiz still exists.
6. **Quiz History:**
   - Dedicated tab in Quizzes view showing chronologically sorted attempts with scores and direct links to result reviews.
7. **Dashboard Integration:**
   - Real-time calculation of `quizzesCompleted` and `averageQuizScore` aggregated across authentic database attempts.

---

## 2. Database Models Added

### A. Question Model (`server/models/Question.js`)
- `user`: ObjectId (ref: `User`, required, indexed)
- `subject`: ObjectId (ref: `Subject`, required, indexed)
- `topic`: ObjectId (ref: `Topic`, optional)
- `questionText`: String (5–2000 chars, required)
- `questionType`: Enum `['single_choice']` (required)
- `options`: Array of `{ id: String, text: String }` (min: 2, max: 8)
- `correctOptionId`: String (required, must match one option id)
- `explanation`: String (optional, max 2000 chars)
- `difficulty`: Enum `['Easy', 'Medium', 'Hard']` (default: `'Medium'`)
- `tags`: Array of Strings
- `isActive`: Boolean (default: `true`)

### B. Quiz Model (`server/models/Quiz.js`)
- `user`: ObjectId (ref: `User`, required, indexed)
- `title`: String (2–150 chars, required)
- `description`: String (max 1000 chars)
- `subject`: ObjectId (ref: `Subject`, required, indexed)
- `topics`: Array of ObjectId (ref: `Topic`)
- `questionIds`: Array of ObjectId (ref: `Question`, min: 1)
- `settings`: `{ shuffleQuestions: Boolean, shuffleOptions: Boolean }`
- `isPublished`: Boolean (default: `true`)

### C. QuizAttempt Model (`server/models/QuizAttempt.js`)
- `user`: ObjectId (ref: `User`, required, indexed)
- `quiz`: ObjectId (ref: `Quiz`, optional if deleted later)
- `quizTitleSnapshot`: String (required, preserved historical title)
- `subject`: ObjectId (ref: `Subject`, required)
- `score`: Number (server-calculated count of correct answers)
- `totalQuestions`: Number
- `correctAnswers`: Number
- `incorrectAnswers`: Number
- `unansweredCount`: Number
- `percentage`: Number (0–100)
- `results`: Array of `{ questionId, questionText, options, selectedOptionId, correctOptionId, isCorrect, explanation }`
- `completedAt`: Date (default: `Date.now`)

---

## 3. Backend REST APIs

Protected with `protect` middleware:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/questions` | List questions with search, subject, topic, difficulty filters |
| `POST` | `/api/questions` | Create question in Question Bank |
| `GET` | `/api/questions/:id` | Get question by ID |
| `PUT` | `/api/questions/:id` | Update question |
| `DELETE` | `/api/questions/:id` | Delete question (unlinks from future quizzes) |
| `GET` | `/api/quizzes` | List user quizzes |
| `POST` | `/api/quizzes` | Create quiz from Question Bank |
| `GET` | `/api/quizzes/:id` | Get quiz details |
| `GET` | `/api/quizzes/:id/take` | Sanitized quiz session (**correct answers stripped**) |
| `PUT` | `/api/quizzes/:id` | Update quiz |
| `DELETE` | `/api/quizzes/:id` | Delete quiz (retains historical attempt results) |
| `POST` | `/api/quizzes/:id/submit`| Authoritative server evaluation of submitted answers |
| `GET` | `/api/quiz-attempts` | List user's quiz attempts |
| `GET` | `/api/quiz-attempts/:id` | Get attempt evaluation results with review explanations |

---

## 4. Frontend Routes Added

- `/question-bank` — Question Bank management interface
- `/quizzes` — Saved Quizzes library & Attempt History tabs
- `/quizzes/:quizId/take` — Focused quiz-taking interface (no timers, clear progress)
- `/quiz-results/:attemptId` — Evaluated assessment results and per-question explanation review

---

## 5. Automated Verification Results

### Backend Automated Test Suite
Command: `npm test`
- **Total Tests:** 65 passed across 5 test suites (Auth, Dashboard, Subject/Topic, Study Materials, Quiz & Question Bank).
- **Failures:** 0.

### Frontend Production Build
Command: `npm run build`
- Vite build completed in 4.23s without errors.
