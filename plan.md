# Traceon — Improvement & Feature Roadmap

> Last updated: 2026-05-17
> Current state: C / C++ / Python / Java debugger · Google OAuth · 5 themes · AI generate + explain + optimize · URL share · Trace export · Multi-file projects · Trash bin · Activity heatmap · Memory Spectrometer · Hotspot heatmap

---

## ✅ Completed

### ~~Phase 1–3 — Language Support, Quick Fixes & Polish~~
- DocsPage, LandingPage copy, footer, Python/Java support
- Monaco error squiggles, export trace, share via URL hash
- Java tracer (jdb), Java snippets, all four languages wired

### ~~Phase 4–5 — Backend Infrastructure & Auth~~
- MongoAppStore (users / projects / files), resource limits (10 proj / 5 files)
- Google OAuth → JWT with `role: "member"`, 401 interceptor, session persistence

### ~~Phase 6–7 — Project Dashboard & Multi-File~~
- DashboardPage grid, project templates, Playground sandbox
- File explorer sidebar, debounced auto-save (2s), breadcrumb header

### ~~Phase 8 — Feature Guards~~
- Adaptive "Debug" button with lock+tooltip for guest/no-project states
- `DebuggerRestricted` full-page UI for locked debugger

### ~~Phase 9 — Sharing~~
- Public `/view/{id}` read-only endpoint, persistent share links, snapshots in MongoDB

### ~~Phase 10 — Advanced Debugger Features~~
- Execution Diff mode, step-level AI, Trash Bin (soft deletes), Activity Heatmap, mobile layout

### ~~Phase 11 — Memory Spectrometer~~
- Memory Spectrometer tab in debugger, block-level memory visualization, pointer dereferencing

### ~~Phase 12 — Hotspot Heatmap & Performance~~
- Monaco gutter heat strip (Blue → Yellow → Red), execution hit counts, AI Optimize button

---

## 🐛 Priority 1 — Critical Bugs & Broken Interactions

### B1. Dead footer links (LandingPage)
- **Files:** `LandingPage.js` ~line 543–547
- **Bug:** "Privacy Policy", "Terms of Service", "Cookie Policy" in the footer have no `href` and no `onClick` — completely non-functional anchor tags
- **Fix:** Either link to real pages or remove them; at minimum add `type="button"` and a "Coming Soon" toast

### B2. Settings page is empty
- **Files:** `DashboardPage.js` ~line 356–361
- **Bug:** The Settings nav item and sidebar button both work, but the page renders a completely blank area — no content whatsoever
- **Fix:** Implement basic settings panel (see P13 below) or add a visible "Coming Soon" card

### B3. Activity heatmap uses random fake data
- **Files:** `DashboardPage.js` ~line 278–280
- **Bug:** `Math.random()` populates the activity calendar — the heatmap shows fictional usage data to real users
- **Fix:** Either track real last-accessed timestamps per project and derive a heatmap from `project.last_accessed`, or remove the heatmap entirely until real data is available

### B4. Auto-save fires for guest users
- **Files:** `App.js` ~line 529–544
- **Bug:** The auto-save `useEffect` runs even when `user.role === "guest"` — guests have no auth token, so every save attempt silently fails with a 401 that pollutes the console
- **Fix:** Add `if (!user || user.role === "guest") return;` guard at the top of the effect

### B5. `handleOpenProject` doesn't clear stale run results
- **Files:** `App.js` ~line 374–404
- **Bug:** Opening a project from the dashboard doesn't reset `runResult`, `runError`, or `analysisResult`, so the previous session's output/errors remain visible in the new project's editor
- **Fix:** Add `setRunResult(null); setRunError(null); setAnalysisResult(null);` inside `handleOpenProject`

### B6. Breadcrumb shows `undefined` when file is missing
- **Files:** `Header.js` ~line 71–82
- **Bug:** `currentProject.file` can be `null` during initial project load (async fetch); the breadcrumb renders "undefined" briefly before the file loads
- **Fix:** Guard with `currentProject?.file?.name ?? "Loading…"` or hide the file portion until it's populated

### B7. LandingPage social icon links are `<a href="#0">`
- **Files:** `LandingPage.js` ~line 509–514
- **Bug:** Social icon links are `<a href="#0">` which is not valid HTML and causes page-top scroll on click
- **Fix:** Change to `<button type="button">` or use proper `href` with `target="_blank" rel="noopener"`

---

## 🔧 Priority 2 — UI/UX Fixes (Visible Polish)

### U1. AI explanation has no text formatting
- **Files:** `AiExplanation.js` ~line 64
- **Bug:** Explanation text is dumped as a single unformatted block — no line breaks, headers, or code snippets even when the AI returns markdown
- **Fix:** Parse and render markdown in the explanation field (use `react-markdown` or a simple regex pass for `**bold**`, `` `code` ``, `\n\n` paragraphs)

### U2. Complexity detection is fragile
- **Files:** `AiExplanation.js` ~line 40–46
- **Bug:** `string.includes("O(n)")` won't catch `O(2^n)`, `O(n²)`, `O(n log n)` correctly — wrong colour badges appear for non-trivial complexities
- **Fix:** Improve pattern matching: classify anything with `^`, `2^`, `n!`, or `factorial` as HIGH; `n log n` or `n²` as MEDIUM; `n)` or `n²)` needs regex not `includes`

### U3. Variable names truncate without tooltip in timeline
- **Files:** `ExecutionTimeline.css`, `FlowVisualizer.js`
- **Bug:** Long variable names (e.g. `myLongVariableName`) are truncated with `text-overflow: ellipsis` but have no tooltip — the full value is invisible
- **Fix:** Add `title={variable.name}` to the span, or use a CSS tooltip on hover

### U4. Nav active state missing on Docs / Pricing / Community
- **Files:** `Header.js`
- **Bug:** The header nav links for `/docs`, `/pricing`, `/community` don't receive the `.active` class when those views are displayed — users can't tell which page they're on
- **Fix:** The `view` prop is already passed to Header; apply `.active` class when `view === "docs"` etc.

### U5. Discord button opens `mailto:` instead of Discord invite
- **Files:** `CommunityPage.js` ~line 70–79
- **Bug:** "Join Server" button calls `mailto:nishantkumar19041@gmail.com` — completely wrong action for a Discord button
- **Fix:** Use a real Discord invite URL, or show a "Coming Soon" state with explanation

### U6. Community events section has hardcoded past dates
- **Files:** `CommunityPage.js` ~line 88–102
- **Bug:** Events like "Traceon Beta Launch Webinar" are hardcoded with specific dates that have already passed — looks stale
- **Fix:** Either remove the Events section or replace with "No upcoming events scheduled" placeholder

### U7. GitHub star count is hardcoded
- **Files:** `LandingPage.js` ~line 466
- **Bug:** Star count displays `"12.4k"` regardless of actual star count — misleading social proof
- **Fix:** Fetch real count from `https://api.github.com/repos/NkOffiCiAL07/AI-Powered-C-Execution-Flow-Visualizer` on mount, fallback to `"★"` if fetch fails

### U8. Output Panel expand toggle is wired up but dead
- **Files:** `OutputPanel.js` ~line 35–43
- **Bug:** `expandedSteps` state and toggle logic exist but no expand button is rendered in the UI — the state is never mutated
- **Fix:** Either add expand/collapse UI or delete the dead state and toggle function

### U9. `DebuggerRestricted` secondary button uses inline styles
- **Files:** `DebuggerRestricted.js`
- **Bug:** Primary and secondary action buttons use inconsistent styling (one uses className, the other inline `style={{}}`) — visual inconsistency on locked debugger page
- **Fix:** Extract both buttons to the same CSS class system

---

## 🧹 Priority 3 — Code Quality & Dead Code

### Q1. Duplicate `LangDropdown` component
- **Files:** `App.js` lines 92–125, `CppEditorPage.js` lines 13–46
- **Problem:** Identical component defined twice — any change must be made in two places
- **Fix:** Extract to `components/LangDropdown.js`, import in both

### Q2. Dead `stepEmoji()` function
- **Files:** `FlowVisualizer.js` line 36–38
- **Problem:** Function is defined, called, and always returns `null` — pure dead code
- **Fix:** Delete it and all call sites

### Q3. Unused `expandedSteps` state in OutputPanel
- **Files:** `OutputPanel.js` ~line 5
- **Problem:** State declared and updated but never read — dead code
- **Fix:** Delete along with the unused toggle handler (see U8)

### Q4. `console.error` leaking into auto-save
- **Files:** `App.js` ~line 514
- **Problem:** Silent `console.error` for auto-save failures gives no user feedback and pollutes the dev console in production
- **Fix:** Track auto-save error in state and show a subtle "Auto-save failed" indicator in the breadcrumb area

### Q5. Unused `currentLang` variable in Header
- **Files:** `Header.js` ~line 59
- **Problem:** Variable assigned but never used — dead assignment
- **Fix:** Delete the variable

### Q6. `NewProjectModal` doesn't validate project name whitespace
- **Files:** `NewProjectModal.js`
- **Problem:** A project named `"   "` (spaces only) passes the truthy check and gets created with a blank name
- **Fix:** Use `.trim().length > 0` before enabling the Create button

---

## 🆕 Priority 4 — New Features

### P13. Settings Page (Account & Preferences)
**Goal:** Give users a real settings panel instead of a blank placeholder.

- **13.1 Theme preference persistence:** Save selected theme to user's MongoDB document so it restores on next login across devices
- **13.2 Profile display:** Show Google avatar, name, email, member since date
- **13.3 Account actions:** "Sign Out of all devices" (invalidate token server-side), "Delete Account" with confirmation
- **13.4 Editor preferences:** Default language, font size (14/16/18px), tab size (2/4)
- **Files to create:** `SettingsPage.js`, `SettingsPage.css`
- **Backend needed:** `PUT /users/me/preferences` endpoint, `DELETE /users/me` endpoint

### P14. Project Search & Filter in Dashboard
**Goal:** Make projects findable as the library grows.

- **14.1** Search input in dashboard header that filters the project grid by name in real-time (client-side, no API call)
- **14.2** Filter chips: All | C++ | C | Python | Java — clicking narrows grid
- **14.3** Sort toggle: Last Modified | Created Date | Name (A-Z)
- **Files:** `DashboardPage.js`, `DashboardPage.css`

### P15. File Rename in Editor Sidebar
**Goal:** Complete the file management workflow — users can add and delete files but can't rename them.

- **15.1** Double-click on filename in sidebar enters inline rename mode (input replaces the label)
- **15.2** Press Enter to confirm, Escape to cancel — calls `PUT /projects/{id}/files/{fid}` with new name
- **15.3** Detect language from new filename extension and update `file.language`
- **Files:** `CppEditorPage.js`, `CppEditorPage.css`, `api.js`

### P16. Keyboard Shortcuts Help Overlay
**Goal:** Make power-user shortcuts discoverable.

- **16.1** Press `?` anywhere (or button in header) to open a clean shortcuts modal
- **16.2** Table of shortcuts: Run (`Ctrl+Enter`), Analyze (`Ctrl+Shift+Enter`), Save (`Ctrl+S`), Next Step, Prev Step, Toggle theme, etc.
- **16.3** Wire up any shortcuts that are documented but not yet implemented (e.g. `Ctrl+S` to trigger Save button in editor)
- **Files:** `KeyboardShortcutsModal.js`, add listener in `App.js`

### P17. Real Activity Tracking
**Goal:** Replace the fake random heatmap with meaningful data.

- **17.1 Backend:** Add `last_accessed: datetime` and `run_count: int` fields to Project documents; increment on every `/analyze` and `/run` call
- **17.2 Frontend:** Derive heatmap data from `project.last_accessed` timestamps over the last 52 weeks
- **17.3** Show actual per-project run count on project cards ("42 runs")
- **Files:** `mongo_store.py`, `app.py`, `DashboardPage.js`

### P18. Markdown Rendering in AI Explanations
**Goal:** AI responses contain markdown that currently displays as raw `**text**` and `` `code` `` — make them readable.

- **18.1** Add `react-markdown` (already in many React projects or use a lightweight custom parser)
- **18.2** Render fenced code blocks with syntax highlighting in the explanation panel
- **18.3** Ensure the same rendering applies to step-level AI explanations in the debugger
- **Files:** `AiExplanation.js`, `AiExplanation.css`

### P19. Auto-save Visual Indicator
**Goal:** Users don't know when their code was last saved — adds anxiety for new users.

- **19.1** Show a subtle "Saved just now" / "Saving…" / "Unsaved changes" badge near the breadcrumb in the editor header
- **19.2** Expose the auto-save error state (currently silent) as "Auto-save failed — click to retry"
- **Files:** `CppEditorPage.js`, `CppEditorPage.css`, `App.js`

---

## 🔮 Priority 5 — Future Roadmap

| Feature | Description | Complexity |
|---|---|---|
| **Project Export** | Download a `.zip` of all files in a project | Medium |
| **Execution Replay** | Scrubber to jump to any step instantly (no re-analyze) | Medium |
| **Diff on File Switch** | Show what changed in variables between the last run and now | Medium |
| **VS Code Extension** | Package tracers as an official VS Code plugin | High |
| **Team Collab** | Real-time shared editing via WebSockets | Very High |
| **Mobile Responsive** | Full touch support for the debugger on tablets/phones | High |
| **Custom Templates** | Let users save their own project templates | Medium |
| **Project Pinning** | Pin frequently-used projects to top of dashboard | Low |
| **Webhook / API Access** | Programmatic code execution via REST API key | High |

---

## 📋 Implementation Order (Suggested)

```
Sprint 1 (this week):   B1–B7  (all critical bugs — 1–2h each)
Sprint 2 (next):        U1–U9  (visible polish — improves first impressions)
Sprint 3:               Q1–Q6  (cleanup — reduces debt before new features)
Sprint 4:               P14, P15, P18 (search/filter, file rename, markdown AI)
Sprint 5:               P13 (settings page — largest new feature)
Sprint 6:               P16, P17, P19 (shortcuts, real activity, save indicator)
Later:                  Priority 5 roadmap items
```
