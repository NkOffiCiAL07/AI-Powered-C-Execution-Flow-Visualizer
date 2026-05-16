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

### ~~Phase 4 — Backend Infrastructure & Data Security~~
- MongoAppStore handling `users`, `projects`, and `files` collections
- Resource limits enforced: 10 projects/user, 5 files/project
- Security guards on `/analyze` to restrict guest access and verify ownership
- JWT role injection (`guest` vs `member`)

### ~~Phase 5 — Robust Google Auth & Account Linking~~
- Verified Google ID-token and users upserted into MongoDB upon callback.
- Persistent JWT contains secure user_id and role: "member".
- Frontend session aligned with JWT state; 401 interceptor handles expiration.

### ~~Phase 6 — Project Dashboard~~
- `DashboardPage` grid view for project management with relative timestamps.
- "Playground" (Sandbox) available for both guests and members.
- Sidebar navigation and project templates integrated.

### ~~Phase 7 — Multi-File & Auto-save~~
- `FileExplorer` component integrated with Project Dashboard
- Debounced auto-save (2s) for project files
- Context-aware header breadcrumbs (Project / File)

### ~~Phase 8 — Conditional UI & Feature Guards~~
- Adaptive "Visualise" button with status tooltips/locks
- `DebuggerRestricted` UI explaining why the debugger is locked for guests/sandboxed users

### ~~Phase 9 — Sharing & Collaboration~~
- Public `/view/{id}` endpoint for read-only project access.
- Permanent share links (`?v=view&pid=...`) load code and snapshots instantly.
- Execution snapshots persisted in MongoDB for every successful `/analyze` run.

---

## 🚀 Future Enhancements

| Feature | Description | Complexity |
|---|---|---|
| **Execution Diff** | Side-by-side diff of variable state between any two steps. | Medium |
| **Step-level AI** | Ask Gemini: "Why did x change on this line?" in the debugger. | High |
| **Trash Bin** | "Recently Deleted" section for project recovery. | Low |
| **Activity Heatmap** | Dashboard visualization of debugging activity. | Medium |
| **Mobile Debugger** | Tabbed layout for small screens (< 768px). | Medium |
| **VS Code Extension** | Packaging the tracers as an official plugin. | High |
| **Team Collab** | Real-time shared editing and execution via WebSockets. | Very High |
