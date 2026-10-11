# Module 10: Important Topic Generator

## Overview
**StudySense: Smart Study Evaluator and Personalized Learning Management System**  
Module 10 implements the **Important Topic Generator**, empowering students to analyze syllabus units and study materials to identify high-weightage topics, key concepts, formulas, revision priorities, and examination question formats without guesswork.

---

## 1. Features Implemented

1. **Intelligent Syllabus & Material Analysis:**
   - Evaluates subject syllabus units or uploaded notes (PDFs, PPTX, pasted text, URLs).
   - Generates structured revision items including unit/chapter, core concepts, subtopics, and formulas/definitions.
   - Categorizes priority into `High`, `Medium`, and `Low` with objective academic evidence.
   - Suggests applicable question formats (MCQ, Very Short Answer, Short Answer, 10-Mark Essay) and mark allocations.

2. **Source Grounding Modes:**
   - **Selected Materials Only:** Strictly restricted to uploaded documents and lecture notes.
   - **Subject Curriculum:** Identifies foundational pillars based on standard university degree syllabi.
   - **Combined Scope:** Blends provided materials with standard syllabus concepts.

3. **Two Dashboard Visualizations:**
   - **Priority View:** Groups topics into High, Medium, and Low revision tiers.
   - **Unit View:** Organizes topics by chapters and curriculum units.

4. **In-Place Revision Status Tracking:**
   - Simple, student-friendly revision markers:
     - `Not Reviewed`
     - `Need More Practice`
     - `Revised`
     - `Understood`
   - Real-time persistence per user analysis without tracking study time, Pomodoros, or streaks.

5. **Direct Integration with StudySense Ecosystem:**
   - **Generate Quiz:** Pre-selects subject and topic in the Quiz Generator (`/quizzes`).
   - **Generate Exam Paper:** Transfers subject context into the Exam Paper Generator (`/exam-paper-generator`).
   - Clean printable/exportable list format.

---

## 2. API Endpoints

All endpoints are protected by `protect` middleware and enforce owner-level access controls:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/important-topics/analyze` | Run AI topic analysis on syllabus/materials. |
| `GET` | `/api/important-topics` | List saved topic analyses for authenticated user. |
| `GET` | `/api/important-topics/:id` | Get single analysis with full topic items. |
| `PATCH` | `/api/important-topics/:id/topics/:topicId/status` | Update topic revision status. |
| `POST` | `/api/important-topics/:id/regenerate` | Regenerate analysis using existing parameters. |
| `DELETE` | `/api/important-topics/:id` | Delete saved analysis record. |

---

## 3. Frontend Routes

- Route: `/important-topics` (`ImportantTopicsPage.jsx`)
- Integrated in the main sidebar under `Important Topics`.

---

## 4. How to Run Locally in CMD

To run StudySense, open two separate Command Prompt (CMD) windows:

### Terminal 1: Backend Server
```cmd
cd d:\mernprojectttt\studysense\server
npm run dev
```

### Terminal 2: Frontend Client
```cmd
cd d:\mernprojectttt\studysense\client
npm run dev
```
*(Access client at `http://localhost:5173`).*
