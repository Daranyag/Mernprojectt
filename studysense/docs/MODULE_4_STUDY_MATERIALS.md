# Module 4: Study Materials & Notes Management

## Overview
**StudySense: Smart Study Evaluator and Personalized Learning Management System**
Module 4 adds comprehensive support for organizing study notes and external reference materials (documentation, articles, video lectures, papers) associated with subjects and topics created in Module 3.

---

## 1. Features Implemented

1. **Dual Material Types:**
   - **Notes (`note`):** Rich text study notes, lecture summaries, key exam concepts, code snippets.
   - **External Resources (`resource`):** URLs to online documentation, tutorials, repository references, and study guides with safe external link rendering.
2. **Curriculum Hierarchy Association:**
   - Must belong to an existing Subject owned by the authenticated student.
   - Optionally attached to a specific Topic within that Subject.
   - If a subject is deleted, associated materials are cleanly cascaded.
   - If a topic is deleted, the material's topic link is safely unlinked (`topic = null`) preserving student notes.
3. **Review & Favorite Workflow:**
   - **Starred Favorites (`isFavorite`):** Quick filter and access to high-priority study materials.
   - **Reviewed Status (`isReviewed`):** Mark notes or links as studied/reviewed without tracking timers or productivity monitoring.
4. **Search, Filter & Sorting:**
   - Search across material title, content/description, and tags.
   - Filter by Subject, Topic, Type (`note` vs. `resource`), Starred Favorites, and Reviewed status.
   - Sort by Newest, Oldest, Title (A-Z), and Title (Z-A).
5. **Tags Support:**
   - Flexible keyword tagging (`#algorithms`, `#exam-prep`, `#cheatsheet`).
6. **Dashboard Overview Integration:**
   - Summary statistics for Study Notes, External Resources, and Starred Favorites on the main dashboard with direct navigation to the materials library.

---

## 2. Database Schema (`StudyMaterial`)

Defined in [server/models/StudyMaterial.js](file:///d:/mernprojectttt/studysense/server/models/StudyMaterial.js):

| Field | Type | Required | Description / Rules |
| :--- | :--- | :--- | :--- |
| `user` | `ObjectId` (ref `User`) | Yes | Scoped to authenticated user; indexed |
| `subject` | `ObjectId` (ref `Subject`) | Yes | References verified user subject |
| `topic` | `ObjectId` (ref `Topic`) | No | Optional; must belong to specified subject |
| `type` | `String` (`enum: ['note', 'resource']`) | Yes | Defaults to `'note'` |
| `title` | `String` (1–150 chars) | Yes | Trimmed title of the material |
| `content` | `String` (max 20,000 chars) | Cond. | Required for `note`; optional description for `resource` |
| `url` | `String` (max 2,048 chars) | Cond. | Required for `resource`; validated HTTP/HTTPS URI |
| `tags` | `[String]` | No | Sanitized, lowercase trimmed tags (max 10 tags, 30 chars each) |
| `isFavorite` | `Boolean` | No | Defaults to `false` |
| `isReviewed` | `Boolean` | No | Defaults to `false` |
| `createdAt` / `updatedAt` | `Date` | Auto | Standard Mongoose timestamps |

### Compound Indexes:
- `{ user: 1, subject: 1 }`
- `{ user: 1, type: 1 }`
- `{ user: 1, isFavorite: 1 }`
- `{ user: 1, createdAt: -1 }`
- Text search indexing on `title`, `content`, and `tags`.

---

## 3. Backend REST APIs

Base prefix: `/api/materials` (Protected via `authenticateToken` middleware):

| Method | Endpoint | Description | Request Body / Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/materials` | List user materials with filters | `?search=...&subject=...&topic=...&type=...&isFavorite=...&isReviewed=...&sortBy=...&sortOrder=...` |
| `GET` | `/api/materials/:id` | Get single material | Params: `:id` |
| `POST` | `/api/materials` | Create note or resource | `{ title, type, subject, topic?, content?, url?, tags?, isFavorite? }` |
| `PUT` | `/api/materials/:id` | Update material | `{ title, subject, topic?, content?, url?, tags?, isFavorite?, isReviewed? }` |
| `DELETE` | `/api/materials/:id` | Delete material | Params: `:id` |
| `PATCH` | `/api/materials/:id/favorite` | Toggle favorite flag | Toggles `isFavorite: !current` |
| `PATCH` | `/api/materials/:id/reviewed` | Toggle reviewed flag | Toggles `isReviewed: !current` |

---

## 4. Frontend Routes & UI

- **Route:** `/materials` (Protected by `ProtectedRoute`)
- **Navigation:** Added to sidebar navigation in [client/src/components/dashboard/Sidebar.jsx](file:///d:/mernprojectttt/studysense/client/src/components/dashboard/Sidebar.jsx).
- **Components:**
  - `MaterialsPage.jsx`: Main library with top filter bar, search input, stats bar, and responsive grid.
  - `MaterialCard.jsx`: Card showing subject color pill, topic tag, star toggle, review badge toggle, preview snippet, and action menu.
  - `MaterialModal.jsx`: Modal for creating and editing notes or resources with subject-filtered topic picker.
  - `MaterialViewModal.jsx`: Reader view for full notes and safe external links (`rel="noopener noreferrer"`).
  - `ConfirmModal.jsx`: Permanent deletion confirmation modal.

---

## 5. Automated Test Results

Ran with native Node.js test runner: `node --test tests/*.test.js`

```text
▶ StudySense Authentication API (Module 1)
  ✔ 13 tests passed
✔ StudySense Authentication API (Module 1) (1518ms)

▶ StudySense Dashboard API (Module 2)
  ✔ 6 tests passed
✔ StudySense Dashboard API (Module 2) (1191ms)

▶ StudySense Study Materials & Notes API (Module 4)
  ✔ POST /api/materials rejects unauthenticated request with 401
  ✔ POST /api/materials creates a valid study note
  ✔ POST /api/materials rejects note without content with 400
  ✔ POST /api/materials creates a valid external resource with URL
  ✔ POST /api/materials rejects external resource with invalid URL with 400
  ✔ POST /api/materials rejects linking to another user subject with 404
  ✔ POST /api/materials rejects topic not belonging to selected subject with 400
  ✔ GET /api/materials returns only authenticated user materials
  ✔ GET /api/materials filters by type, favorite, and search term
  ✔ PATCH /api/materials/:id/favorite toggles favorite boolean
  ✔ PATCH /api/materials/:id/reviewed toggles reviewed boolean
  ✔ User isolation: User 2 cannot view, update, favorite, or delete User 1 material
  ✔ PUT /api/materials/:id updates material content and tags
  ✔ DELETE /api/materials/:id deletes material for owner
  ✔ Deleting a topic unlinks its topic field on existing material without deleting the material
  ✔ Deleting a subject cascades and permanently deletes its study materials
✔ StudySense Study Materials & Notes API (Module 4) (1430ms)

▶ StudySense Subject & Topic API (Module 3)
  ✔ 15 tests passed
✔ StudySense Subject & Topic API (Module 3) (1253ms)

ℹ tests 50
ℹ suites 4
ℹ pass 50
ℹ fail 0
```

---

## 6. Frontend Build Verification

Executed: `npm run build` in `client/`
- Vite production build succeeded in 4.50s without errors:
  - `dist/assets/index-CYW5FJ34.css` (48.65 kB)
  - `dist/assets/index-CVe4VGyn.js` (363.64 kB)
