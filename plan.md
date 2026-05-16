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

### ~~Phase 10 — Future Enhancements Delivered~~
- **Execution Diff:** Side-by-side diff of variable state via "Diff Mode" toggle.
- **Step-level AI:** "AI Explain" button for specific steps in the debugger.
- **Trash Bin:** "Recently Deleted" recovery via soft deletes in MongoDB.
- **Activity Heatmap:** Visual activity feed in the Dashboard.
- **Mobile Debugger:** Tabbed layout for small screens (< 768px).

---

## 💎 Phase 11 — Memory Spectrometer *(Next Major Release)*

**Goal:** Provide high-fidelity visualization of the Stack, Heap, and Pointer relationships.

### 11.1 Robust LLDB Data Extraction
- **Bug Fix:** Refactor `LLDBController.list_locals` to use `parray` or JSON-formatted output to handle complex C++ types (STL vectors, nested structs).
- **Address Mapping:** Extract memory addresses for every variable (`p &var`) to build a virtual memory map.
- **Pointer Dereferencing:** Automatically track what `ptr` points to in the current frame.

### 11.2 Memory Map UI
- New **Memory Spectrometer** tab in the debugger view.
- Visualise memory as a Contiguous Block list (Addresses + Hex values).
- **Pointer Arrows:** SVG lines connecting pointer variables to their target memory cells.
- Contiguous highlighting for arrays and structs.

### 11.3 Memory Safety Intelligence
- Automatically detect and highlight **Out-of-Bounds** access in the visualizer.
- Identify **Dangling Pointers** (pointers to deallocated or stack-expired memory).
- AI Insight: "Gemini, why is this pointer dereference unsafe at this step?"

---

## 🔥 Phase 12 — Hotspot Heatmap & Performance Profiler

**Goal:** Visualise execution density and identify performance bottlenecks.

### 12.1 Backend Metrics Collection
- **Hit Counting:** Update `collect_execution_timeline` to aggregate how many times each source line is visited.
- **Micro-timing:** Measure wall-clock time between debugger steps to provide a high-level performance estimate per line.
- **API Extension:** Include `execution_heatmap` data in the final `AnalyzeCodeResponse`.

### 12.2 Editor Heatmap Overlay
- **Monaco Gutter Integration:** Render a vertical "Heat Strip" next to line numbers.
- **Dynamic Coloring:** Use a gradient (Blue → Yellow → Red) to reflect line-hit frequency.
- **Metric Tooltips:** Show execution stats when hovering over line gutters in the editor.

### 12.3 AI Performance Audit
- **Optimization Button:** New action in the performance tab to send hot-path data to Gemini.
- **Algorithmic Refactoring:** AI suggestions focused on reducing time complexity for high-frequency code paths.

---

## 🚀 Future Roadmap

| Feature | Description | Complexity |
|---|---|---|
| **VS Code Extension** | Packaging the tracers as an official plugin. | High |
| **Team Collab** | Real-time shared editing and execution via WebSockets. | Very High |
