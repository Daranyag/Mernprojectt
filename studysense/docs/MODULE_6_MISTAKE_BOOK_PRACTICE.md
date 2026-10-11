# Module 6: Mistake Book and Practice Engine

## Overview
**StudySense: Smart Study Evaluator and Personalized Learning Management System**
Module 6 implements an automated **Mistake Book** that captures student misconceptions from completed quiz attempts, enables personal learning notes and review markers, and powers an interactive **Practice Engine** that re-evaluates answers on the server until mistakes are corrected.

---

## 1. Features Implemented

1. **Automatic Mistake Capture from Quizzes:**
   - Evaluated server-side during quiz submission (`POST /api/quizzes/:id/submit`).
   - Only genuinely incorrect answers (`isCorrect === false` and `selectedOptionId !== null`) are recorded.
   - Unanswered questions are not falsely categorized as conceptual mistakes.
   - Deduplication: Subsequent mistakes on the same question increment `incorrectCount` and reset status to `needs_review` rather than spawning duplicate database records.
2. **Mistake Book Management (`/mistake-book`):**
   - Browse saved mistakes by curriculum Subject and Topic.
   - Filter by status (`needs_review`, `practicing`, `corrected`) or `onlyMarked` for review.
   - Search across question text, answer explanations, and personal student notes.
   - Sort by Newest, Oldest, and Most Missed.
3. **Personal Learning Notes & Review Markers:**
   - Students can record custom learning notes explaining why they chose the wrong answer or memory anchors.
   - Star/Bookmark mistakes for targeted pre-exam review.
4. **Interactive Practice Engine (`/mistake-book/practice`):**
   - Practice all mistakes, a filtered subject/topic subset, or a single specific mistake.
   - **Zero Answer Leakage:** Server hides `correctOptionId` and explanations until practice submission.
   - One-by-one question view with clean option selection.
   - Instant server evaluation feedback with authoritative explanations.
   - Completion summary displaying questions attempted, corrected, and accuracy rate (**no timers or study-session monitoring**).
5. **Correction Policy:**
   - Status progression: `needs_review` -> `practicing` -> `corrected`.
   - Correct answer on practice moves mistake status to `corrected`.
   - If missed again on a quiz or practice retry, status returns to `needs_review`.
6. **Quiz Result & Dashboard Integration:**
   - Direct button on quiz completion screen to view and study mistakes from that attempt.
   - Real-time aggregation of `mistakesNeedingReview` and `mistakesCorrected` on the main dashboard.

---

## 2. Database Models Added

### A. Mistake Model (`server/models/Mistake.js`)
- `user`: ObjectId (ref `User`, required, indexed)
- `question`: ObjectId (ref `Question`, optional)
- `sourceQuiz`: ObjectId (ref `Quiz`, optional)
- `sourceAttempt`: ObjectId (ref `QuizAttempt`, optional, indexed)
- `subject`: ObjectId (ref `Subject`, required, indexed)
- `topic`: ObjectId (ref `Topic`, optional)
- `questionSnapshot`: String (required question text snapshot)
- `optionsSnapshot`: Array of `{ id: String, text: String }`
- `selectedOptionId`: String (initial incorrect answer)
- `correctOptionId`: String (authoritative correct option)
- `explanationSnapshot`: String (explanation snapshot)
- `personalNote`: String (student note, max 2000 chars)
- `isMarkedForReview`: Boolean (default `false`)
- `status`: Enum `['needs_review', 'practicing', 'corrected']` (default `'needs_review'`)
- `incorrectCount`: Number (default `1`)
- `correctPracticeCount`: Number (default `0`)
- `lastPracticedAt`: Date (default `null`)

### B. PracticeAttempt Model (`server/models/PracticeAttempt.js`)
- `user`: ObjectId (ref `User`, required, indexed)
- `mistake`: ObjectId (ref `Mistake`, required, indexed)
- `questionSnapshot`: String (required)
- `selectedOptionId`: String (required)
- `correctOptionId`: String (required)
- `isCorrect`: Boolean (server-calculated)
- `explanationSnapshot`: String
- `practicedAt`: Date (default `Date.now`)

---

## 3. Backend REST APIs Added

All endpoints protected by `protect` middleware:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/mistakes` | List mistakes with search, subject, topic, status filters |
| `GET` | `/api/mistakes/:id` | Get mistake detail with snapshots |
| `PATCH` | `/api/mistakes/:id` | Update personal note or review status |
| `PATCH` | `/api/mistakes/:id/review` | Toggle review marker flag |
| `DELETE` | `/api/mistakes/:id` | Delete mistake and practice history |
| `GET` | `/api/mistakes/practice/session` | Sanitized practice session (**correct answers stripped**) |
| `POST` | `/api/mistakes/:id/practice-result` | Server evaluation of student practice answer |
| `GET` | `/api/mistakes/practice/history` | List authenticated user's practice attempt history |

---

## 4. Frontend Routes Added

- `/mistake-book` — Mistake Book library with search, status filters, notes, and metrics.
- `/mistake-book/practice` — Practice Engine session with instant feedback and completion summary.

---

## 5. Verification Results

### Backend Automated Test Suite
Command: `npm test`
- **Total Tests:** 77 passed across 6 test suites (Auth, Dashboard, Subject/Topic, Study Materials, Quiz & Question Bank, Mistake Book & Practice Engine).
- **Failures:** 0.

### Frontend Production Build
Command: `npm run build`
- Vite build completed in 3.13s without errors.
