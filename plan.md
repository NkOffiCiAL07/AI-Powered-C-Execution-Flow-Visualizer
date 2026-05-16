# Traceon — Improvement & Feature Roadmap

> Last updated: 2026-05-17
> Current state: C / C++ / Python / Java debugger · Google OAuth · 5 themes · AI generate + explain · URL share · Trace export

---

## ✅ Completed

### ~~Phase 1 — Quick Fixes & Polish~~
- DocsPage updated for Python, `/generate` endpoint, FAQ accuracy
- LandingPage copy updated (C, C++, Python) · footer links wired · copyright dynamic
- Python `input()` detection in `handleAnalyze` / `handleRun`
- Stale `backend/.env` removed

### ~~Phase 2 — UX Improvements~~
- Monaco compilation error squiggles (C, C++, Python, Java error formats)
- Landing page theme-aware colours (light / dark / ocean / forest / midnight)
- Export execution trace as `.json` download
- Share execution via URL hash (`#lang=&code=`) · copy-to-clipboard

### ~~Phase 3 — Java Language Support~~
- `java_tracer.py` — reactive jdb session (background reader thread + queue)
- Java in `/analyze` and `/run` endpoints · OpenJDK 21 installed via Homebrew
- Java Monaco snippets (25 snippets) · `parseErrorMarkers` for `Main.java:LINE:` format
- Java in `LANG_OPTIONS`, default code template, `usesInput` guard, share URL

---

## Phase 4 — Backend Infrastructure & Data Security  *(Foundation)*

**Goal:** Prepare the database and API for persistent users, project hierarchies, and resource limits.

### 4.1 Database refactoring (`mongo_store.py`)
- **Users collection** — store `{ google_id, email, name, avatar_url, role, created_at }`
- **Projects collection** — `{ _id, owner_id, name, language, created_at, last_accessed }`; `owner_id` references Users
- **Files collection** — `{ _id, project_id, name, language, code, updated_at }`; `project_id` references Projects
- Add helper methods: `upsert_user`, `create_project`, `list_projects(owner_id)`, `get_file`, `upsert_file`, `delete_project`
- **Files:** `src/traceon/server/mongo_store.py`

### 4.2 API model expansion (`models.py`)
- Add strict Pydantic DTOs: `UserDTO`, `ProjectDTO`, `FileDTO`, `ProjectCreateRequest`, `FileUpsertRequest`
- Extend `AnalyzeCodeRequest` to accept optional `project_id` and `file_id` fields
- **Files:** `src/traceon/server/models.py`

### 4.3 Role-based access & JWT hardening
- Distinguish `role: "guest"` vs `role: "member"` in the JWT payload (injected at auth time)
- Add a reusable `require_member` FastAPI dependency that rejects guest tokens on protected routes
- **Files:** `src/traceon/server/auth.py`, `src/traceon/server/app.py`

### 4.4 Debugger guard on `/analyze`
- Require a valid `project_id` + `file_id` when `role == "member"` (guests still get sandboxed analysis)
- Validate that `project_id` belongs to the requesting user; return 403 otherwise
- **Files:** `src/traceon/server/app.py`

### 4.5 Resource limits (anti-bloat)
- Cap at **10 projects / user** and **5 files / project**; enforce at the API layer (return 429 with a clear message if exceeded)
- Add `GET /projects` and `GET /projects/{id}/files` list endpoints
- **Files:** `src/traceon/server/app.py`, `src/traceon/server/mongo_store.py`

### 4.6 Existing backend tasks (carried over)
- `MONGO_URI=mongodb://localhost:27017` placeholder in `.env.example`
- Production CORS: read `ALLOWED_ORIGINS` from env instead of `allow_origins=["*"]`
- Rate limiting on `/generate` and `/explain`: 10 req/min per IP (simple in-memory token bucket)
- README accuracy pass: remove unimplemented features, add setup instructions + screenshots
- **Files:** `.env.example`, `src/traceon/server/app.py`, `README.md`

---

## Phase 5 — Robust Google Auth & Account Linking

**Goal:** Fix the sign-in flow so every action is tracked to a verified identity.

### 5.1 Auth fix & user upsert (`auth.py`)
- On successful Google ID-token verification: **immediately upsert** the user record in MongoDB (`upsert_user`)
- Inject `user_id` (MongoDB `_id`), `email`, `name`, `avatar_url`, and `role: "member"` into the signed JWT
- Ensure the JWT secret is loaded from `JWT_SECRET` env var (not hardcoded)
- **Files:** `src/traceon/server/auth.py`

### 5.2 Frontend session–token alignment
- After login, decode the JWT in the React context and store the full `{ user_id, email, name, avatar_url, role }` object in state + `localStorage`
- Add an Axios / fetch interceptor that attaches `Authorization: Bearer <token>` to every API request
- On 401 response: clear local session, redirect to landing, show re-auth prompt
- Mirror `role` in React state so the UI knows immediately whether to show guest or member UI
- **Files:** `frontend/src/App.js`, `frontend/src/services/api.js`, `frontend/src/components/LoginModal.js`

---

## Phase 6 — Project Dashboard  *("The Sharp Interface")*

**Goal:** Professional management UI for authenticated members.

### 6.1 Dashboard view
- New `DashboardPage` component: grid of project cards showing name, language badge, and "Last edited" relative timestamp
- Empty state: friendly call-to-action with a "New Project" button
- Sidebar navigation with three items: **Playground** (guest-style sandbox), **My Projects** (this view), **Settings** (placeholder)
- Route: switching to `view === "dashboard"` from `App.js`
- **Files:** `frontend/src/components/DashboardPage.js` *(new)*, `frontend/src/App.js`, `frontend/src/styles/DashboardPage.css` *(new)*

### 6.2 Project creation flow
- Minimalist modal (name input + language selector) triggered from dashboard
- **Project templates** on creation: "Hello World", "Fibonacci", "Sorting Demo" for C, C++, Python, Java — fills the first file with working starter code
- `POST /projects` API call → store in MongoDB → navigate into the new project
- **Files:** `frontend/src/components/NewProjectModal.js` *(new)*, `src/traceon/server/app.py`

### 6.3 Guest-only universal sandbox
- Guests land directly in the existing editor (`view === "editor"`) — no project context required
- Members see the dashboard by default after login; can still open the sandbox via the **Playground** sidebar link
- **Files:** `frontend/src/App.js`

---

## Phase 7 — Multi-File Workspace & Editor Evolution

**Goal:** Upgrade the editor to handle project-level file management and auto-persistence.

### 7.1 File explorer sidebar
- Inside a project view, add a retractable left sidebar listing all files (`.c`, `.cpp`, `.py`, `.java`)
- Inline actions per file: **Add**, **Rename**, **Delete** (with confirmation for delete)
- Click a file to switch the editor to that file's content
- **Files:** `frontend/src/components/FileExplorer.js` *(new)*, `frontend/src/styles/FileExplorer.css` *(new)*, `frontend/src/App.js`

### 7.2 Auto-save (debounced sync)
- After 2–3 seconds of typing inactivity, call `PATCH /projects/{id}/files/{file_id}` with updated code
- Show a subtle "Saved" indicator in the header (fades out after 1.5s)
- No manual "Save" button needed — mirrors the VS Code / Replit experience
- **Files:** `frontend/src/App.js`, `src/traceon/server/app.py`

### 7.3 Context-aware header breadcrumb
- Update `Header.js` to show **Project Name / File Name** when inside a project view
- Clicking the project name navigates back to the dashboard
- **Files:** `frontend/src/components/Header.js`

---

## Phase 8 — Conditional UI & Feature Guards  *("Why" Tooltips)*

**Goal:** Clear, frictionless instructions for restricted features instead of silent blocks.

### 8.1 Adaptive Analyze button
| User state | Button label | Click action |
|---|---|---|
| Guest | "Sign in to Visualise" | Opens Google Login Modal |
| Member · no project | "Save to Project to Visualise" | Opens New Project modal; saves current code |
| Member · in project | "Analyze & Visualize" (normal) | Runs analysis |

- Implement as a single `AnalyzeButton` component that reads `user` + `currentProject` from context
- **Files:** `frontend/src/components/AnalyzeButton.js` *(new)*, `frontend/src/App.js`

### 8.2 Tooltip / inline explanation
- Add a `?` icon next to locked features that shows a one-line tooltip explaining why it is locked and how to unlock it
- Keep the 1 px border, IDE-density aesthetic throughout
- **Files:** `frontend/src/components/Tooltip.js` *(new)*

---

## Phase 9 — Sharing & Collaboration  *(Bonus / Viral Growth)*

**Goal:** Leverage the database for read-only project sharing.

### 9.1 Read-only share link for saved projects
- "Share" button on any saved project generates a persistent URL: `/view/proj_<id>`
- Backend: `GET /view/{project_id}` returns project + file list + **pre-computed** last execution snapshot (no new compute)
- Frontend: `ShareViewPage` component — read-only code viewer + step-through navigator with no edit or run controls
- **Files:** `frontend/src/components/ShareViewPage.js` *(new)*, `src/traceon/server/app.py`

### 9.2 Snapshot persistence (prerequisite for 9.1)
- Store the last execution result (snapshots array) alongside the file record in MongoDB on each successful `/analyze` call
- Serialize snapshots as BSON (up to 500 steps); older runs overwrite in-place
- **Files:** `src/traceon/server/mongo_store.py`, `src/traceon/server/app.py`

### 9.3 Execution diff view *(from old P5)*
- Side-by-side diff of variable state between any two selected steps
- Useful for "what changed between step 5 and step 12?"
- Surface as a panel inside `FlowVisualizer`

### 9.4 AI step-level explanations *(from old P5)*
- When user clicks a specific snapshot node, ask Gemini: "What is happening at this exact line and why did these variables change?"
- More granular than the current whole-code explanation; displayed in a popover

---

## Phase 10 — Longer Term / Ambitious

### 10.1 Mobile-responsive debugger
- Side-by-side panel layout breaks on screens < 768 px
- On mobile: replace with a tabbed layout (Code tab / Debugger tab); `resize-divider` becomes a tab bar

### 10.2 VS Code extension
- Package LLDB + Python + Java tracer backend as a VS Code extension
- Frontend visualizer hosted as a VS Code WebView panel

### 10.3 Execution replay & time-travel
- Scrubber bar across the full snapshot timeline — drag to any step instantly
- Complements the existing Next/Back stepper

### 10.4 Team collaboration (multi-user)
- Shared projects: owner can invite collaborators by email
- Real-time cursor presence (WebSocket) — show who is viewing which file

---

## Summary Table

| Phase | Focus | Est. Time | Priority |
|-------|-------|-----------|----------|
| ~~**P1 — Quick Fixes**~~ | Docs, copy, links, Python detection | 1–2 hrs | ✅ Done |
| ~~**P2 — UX**~~ | Monaco errors, dark landing, export, share URL | 2–4 hrs | ✅ Done |
| ~~**P3 — Java**~~ | jdb tracer, editor snippets, JDK install | 4–6 hrs | ✅ Done |
| **P4 — DB & Security** | Mongo collections, DTOs, JWT roles, resource caps | 3–5 hrs | **Next** |
| **P5 — Auth Hardening** | Upsert on login, token alignment, 401 interceptor | 2–3 hrs | High |
| **P6 — Dashboard** | Project grid, creation modal, templates, sidebar nav | 4–6 hrs | High |
| **P7 — Multi-File** | File explorer, auto-save, breadcrumb header | 4–6 hrs | High |
| **P8 — Feature Guards** | Adaptive Analyze button, tooltips, IDE polish | 2–3 hrs | Medium |
| **P9 — Sharing** | Read-only share URLs, snapshot persistence, diff view | 4–6 hrs | Medium |
| **P10 — Ambitious** | Mobile, VS Code ext, replay scrubber, team collab | Days | Long term |
