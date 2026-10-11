# Module 9: Exam Paper Generator

## Overview
**StudySense: Smart Study Evaluator and Personalized Learning Management System**  
Module 9 implements a comprehensive **University Examination Paper Generator** that allows authenticated students and teachers to create structured, print-ready examination question papers with sections, internal-choice rules, authoritative model answer keys, and component marking schemes.

---

## 1. Features Implemented

1. **Structured Examination Paper Blueprint Configuration:**
   - Multi-part blueprints (e.g. Part A: Very Short Answers, Part B: Short Answers, Part C: Essays).
   - Internal-choice rules (e.g., *Answer any 2 out of 3 questions; each carries 10 marks*).
   - Dynamic distinction between **Total Available Marks** (e.g., 60 marks presented) and **Required Attempted Marks** (e.g., 50 marks to answer).
   - Customizable exam title, optional institution/university header, course code, duration, and instructions to candidates.

2. **Multi-Source Knowledge Grounding:**
   - **Uploaded Materials Only:** Strictly restricted to selected uploaded documents (PDFs, PPTX presentations, pasted notes) without inventing outside facts.
   - **Subject Curriculum:** Generated from standard university MCA / Computer Science degree syllabus standards.
   - **Combined Scope:** Prioritizes uploaded documents and fills remaining section requirements from curriculum knowledge.

3. **Bloom's Taxonomy & Difficulty Configuration:**
   - Easy (Foundational definitions, terms, and syntax).
   - Medium (Balanced university examination level).
   - Hard (Analytical, design, architecture, and problem-solving).
   - Mixed (Comprehensive spectrum across all cognitive levels).

4. **Model Answers & Descriptive Marking Rubrics:**
   - 1-2 Mark Questions: Direct questions with concise 1-2 sentence model answers.
   - 5 Mark Questions: Conceptual explanations with 2-part grading criteria.
   - 10 & 14 Mark Questions: Full university-style essay questions with structured outlines (Introduction, Architecture/Core Mechanism, Working, Advantages/Disadvantages, Conclusion) and itemized marking schemes.
   - MCQs: 4 options with authoritative single correct keys and explanations.

5. **Preview, In-Place Editing, and Single-Question Regeneration:**
   - Interactive preview resembling official printed university examination question papers.
   - Regenerate individual questions with AI without re-running the entire paper.
   - Duplicate papers, edit drafts, and finalize completed question papers.

6. **Print & PDF Export Engine:**
   - Clean, professional CSS print stylesheet hiding dashboard navigation, action bars, and non-printable controls.
   - Candidate Name and Register Number examination header blocks.
   - 3 Dedicated Print Modes:
     1. **Question Paper Only:** Clean examination paper for student candidates.
     2. **Answer Key & Rubrics Only:** Evaluation guide for examiners.
     3. **Full Document:** Complete paper followed by answer key on a clean page break.

---

## 2. API Endpoints

All endpoints are protected by `protect` middleware and enforce owner-level access controls:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/exam-papers` | List saved papers for authenticated user. |
| `GET` | `/api/exam-papers/:id` | Retrieve single exam paper with sections and questions. |
| `POST` | `/api/exam-papers/generate` | Generate complete paper via AI blueprint. |
| `PUT` | `/api/exam-papers/:id` | Update draft paper contents or marks. |
| `POST` | `/api/exam-papers/:id/finalize` | Finalize draft paper. |
| `POST` | `/api/exam-papers/:id/duplicate` | Duplicate an existing paper. |
| `POST` | `/api/exam-papers/:id/regenerate-question` | Regenerate a single question via AI. |
| `DELETE` | `/api/exam-papers/:id` | Delete an exam paper. |

---

## 3. Frontend Routes

- Route: `/exam-paper-generator` (`ExamPaperGeneratorPage.jsx`)
- Integrated in the main sidebar under `Exam Paper Generator`.

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
