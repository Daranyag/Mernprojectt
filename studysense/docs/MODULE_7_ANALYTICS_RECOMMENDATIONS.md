# Module 7: Performance Analytics and Smart Recommendations

## Overview
**StudySense: Smart Study Evaluator and Personalized Learning Management System**  
Module 7 implements an end-to-end, data-driven **Performance Analytics and Smart Recommendation Engine** that calculates authentic student progress metrics and delivers personalized, explainable recommendations using strictly real database records.

---

## 1. Features Implemented

1. **Overall Performance KPI Aggregation:**
   - Total completed quiz attempts.
   - Total questions presented across completed quizzes.
   - Total questions answered (excluding intentionally skipped / unanswered questions).
   - Question-level Accuracy percentage (`totalCorrect / totalAnswered * 100`).
   - Average Quiz Score percentage (arithmetic mean of completed attempt scores).
   - Distinct subjects assessed in quizzes vs total enrolled curriculum subjects.
   - Active open mistakes requiring review (sourced from Module 6 Mistake Book).

2. **Subject-wise Performance Breakdown:**
   - Evaluates completed quiz attempts, average scores, accuracy, and question counts per subject.
   - Distinguishes unassessed curriculum subjects (`isAssessed: false`, `accuracy: null`) from failing grades, avoiding false 0% penalty representations.
   - Correlates unresolved mistakes with respective subjects.

3. **Topic-wise Performance & Readiness Classification:**
   - Aggregates question-level accuracy and answered question volume per topic.
   - **Rigorous Readiness Rule:** Requires a minimum sample size of **3 answered questions** before applying proficiency labels, eliminating single-question distortion:
     - `Strong`: Accuracy $\ge 80\%$ with $\ge 3$ questions.
     - `Proficient`: Accuracy $60\% - 79\%$ with $\ge 3$ questions.
     - `Needs Practice`: Accuracy $< 60\%$ with $\ge 3$ questions.
     - `Needs Data`: $< 3$ questions evaluated (explicitly requests further quizzes before judging competence).
   - Tracks open mistakes linked to each topic with direct review actions.

4. **Chronological Evaluation Trends:**
   - Chronological historical results with actual completion timestamps (`completedAt`), passing thresholds, and percentage scores.
   - No fabricated dates or synthetic data points.

5. **Deterministic Smart Recommendations Engine:**
   - 100% data-driven, explainable, rule-based recommendations per authenticated student (no paid AI APIs or external hallucinated suggestions).
   - Each recommendation includes:
     - Clear Title & Category.
     - Objective Data Evidence ("Why we recommend this").
     - Priority (`HIGH`, `MEDIUM`, `LOW`, `INFO`).
     - Real Subject/Topic link.
     - Direct, functional action button (`/mistake-book`, `/quizzes`, `/subjects/:id`).

6. **Dashboard Integration (Module 2):**
   - Seamless addition of Performance Analytics callout banner and quick links on the main dashboard.
   - Interactive link to `/analytics` from the Quiz Performance overview card.

7. **Strict Educational Constraints Preserved:**
   - **NO timetable or revision calendar** added.
   - **NO Pomodoro timers, study sessions, study-hour tracking, duration tracking, streaks, or productivity monitoring**.

---

## 2. Metric Formulas and Data Sources

| Metric | Source Collection | Formula / Definition | Handling of Empty / Unanswered |
| :--- | :--- | :--- | :--- |
| **Total Attempts** | `QuizAttempt` | Count of attempts where `status: 'completed'` and `user: authUser` | Returns `0` if no attempts exist. |
| **Questions Answered** | `QuizAttempt.answers` | Count of questions where `selectedOptionId !== null` | Unanswered questions (`selectedOptionId === null`) are excluded. |
| **Question Accuracy** | `QuizAttempt.answers` | $\frac{\text{Total Correct Answers}}{\text{Total Answered Questions}} \times 100$ | Returns `null` if 0 questions answered; avoids division by zero. |
| **Average Quiz Score** | `QuizAttempt` | $\frac{1}{N} \sum_{i=1}^{N} \text{attempt.scorePercentage}$ | Returns `null` if 0 completed attempts exist. |
| **Subject Accuracy** | `QuizAttempt.answers` | Correct answers for that subject $\div$ answered questions for that subject $\times 100$ | Returns `null` with `isAssessed: false` if no attempts exist. |
| **Topic Readiness** | `QuizAttempt.answers` | Accuracy evaluated against thresholds **only when** $\text{questionsAnswered} \ge 3$ | Classified as `Needs Data` if $< 3$ questions. |
| **Open Mistakes** | `Mistake` | Count where `user: authUser` and `status: 'needs_review'` | Returns `0` if no active mistakes exist. |

---

## 3. Recommendation Rules and Thresholds

| Category | Priority | Trigger Condition | Action Target | Explanation Reason |
| :--- | :--- | :--- | :--- | :--- |
| `REVIEW_MISTAKES` | `HIGH` | User has $\ge 1$ mistake in status `needs_review` | `/mistake-book` | Real count of saved misconceptions needing review. |
| `PRACTICE_WEAK_TOPIC` | `HIGH` | Topic accuracy $< 60\%$ with sample size $\ge 3$ answered questions | `/quizzes` | Topic accuracy and question counts provided directly in message. |
| `UNASSESSED_SUBJECT` | `MEDIUM` | Registered curriculum subject has 0 quiz attempts | `/quizzes` | Subject has not been evaluated yet; prompts taking a diagnostic quiz. |
| `REINFORCE_STRONG_TOPIC`| `LOW` | Topic accuracy $\ge 80\%$ with $\ge 3$ answered questions | `/quizzes` | Acknowledges strong mastery and encourages ongoing retention. |
| `GET_STARTED` | `INFO` | User has 0 completed quiz attempts across all subjects | `/quizzes` | Actionable empty-data guidance for new students. |

---

## 4. Backend APIs Implemented

All endpoints require active session authentication (`protect` middleware) and automatically enforce user-level data isolation:

- `GET /api/analytics/overview`
  - Returns overall KPI metrics (`totalAttempts`, `totalQuestions`, `totalAnswered`, `totalCorrect`, `overallAccuracy`, `averageQuizPercentage`, `assessedSubjectsCount`, `mistakesNeedingReview`, `mistakesCorrected`).
- `GET /api/analytics/subjects`
  - Returns subject-level performance objects (`subjectId`, `subjectName`, `subjectCode`, `isAssessed`, `attemptsCount`, `questionsAnswered`, `correctCount`, `accuracy`, `averageScore`, `mistakesCount`).
- `GET /api/analytics/topics?subjectId=:optionalId`
  - Returns topic-level readiness objects (`topicId`, `topicName`, `subjectId`, `subjectName`, `questionsAnswered`, `correctCount`, `accuracy`, `readiness`, `mistakesCount`).
- `GET /api/analytics/trends?limit=15`
  - Returns chronologically ordered completed quiz attempts with scores, passing status, and timestamps.
- `GET /api/analytics/recommendations`
  - Returns deterministic prioritized recommendations based on the student's actual performance history.

---

## 5. Automated Tests Executed

Automated tests for Module 7 were executed using the Node.js native test runner against `server/tests/analytics.test.js`:

1. `GET /api/analytics/overview rejects unauthenticated request with 401` — **PASS**
2. `GET /api/analytics/overview returns genuine empty state for user with no quiz attempts` — **PASS**
3. `User data isolation: User 1 and User 2 metrics are strictly separated` — **PASS**
4. `Overall accuracy and average score calculate correctly excluding unanswered questions` — **PASS**
5. `GET /api/analytics/subjects distinguishes assessed subjects from unassessed subjects` — **PASS**
6. `Smart recommendations engine generates explainable suggestions based on real mistakes and topic accuracy` — **PASS**

### Total Full-Stack Test Suite Status
```
✔ StudySense Authentication API (Module 1) (13 tests) - PASS
✔ StudySense Dashboard API (Module 2) (6 tests) - PASS
✔ StudySense Subject & Topic API (Module 3) (15 tests) - PASS
✔ StudySense Study Materials & Notes API (Module 4) (16 tests) - PASS
✔ StudySense Quiz & Question Bank API (Module 5) (15 tests) - PASS
✔ StudySense Mistake Book & Practice Engine API (Module 6) (12 tests) - PASS
✔ StudySense Performance Analytics & Recommendations API (Module 7) (6 tests) - PASS

ℹ tests: 83 passed, 0 failed (7 test suites)
```

### Frontend Build Verification
`npm run build` executed in `client/` and succeeded with **0 errors**:
- Transformed 1690 modules.
- Created `dist/index.html` and bundled assets cleanly.

---

## 6. How to Run Locally in CMD

To run StudySense, open two separate Command Prompt (CMD) windows:

### Terminal 1: Backend Server
```cmd
cd d:\mernprojectttt\studysense\server
npm run dev
```
*(Server will start on port 5000 with MongoDB connected).*

### Terminal 2: Frontend Client
```cmd
cd d:\mernprojectttt\studysense\client
npm run dev
```
*(Client will start on Vite, typically http://localhost:5173).*
