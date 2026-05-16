# Traceon Project Context

You are working on **Traceon** — an AI-powered C/C++/Python execution flow visualizer built with React + FastAPI + LLDB.

## Quick Facts
- **Root:** `/Users/nkofficial07/Desktop/Projects/AI-Powered-C-Execution-Flow-Visualizer/`
- **Frontend:** React 18, Monaco Editor, CSS variables (light theme default), no React Router (state-based view switching)
- **Backend:** FastAPI + uvicorn on port 8000, LLDB debugger (C/C++), sys.settrace (Python), Gemini AI
- **Run:** `npm run dev` from root (starts both backend + frontend)
- **Frontend port:** 3000 | **Backend port:** 8000

## Architecture

### Views (controlled by `view` state in App.js)
| View | Component | Status |
|------|-----------|--------|
| `landing` | `LandingPage.js` | ✅ Full |
| `editor` | `CppEditorPage.js` | ✅ Full (C, C++, Python) |
| `visualizer` | inline in `App.js` | ✅ Full (C, C++, Python) |
| `docs` | `DocsPage.js` | ⚠️ Stub |
| `pricing` | `PricingPage.js` | ⚠️ Buttons unwired |
| `community` | `CommunityPage.js` | ⚠️ Buttons unwired |

### Key Frontend Files
| File | Purpose |
|------|---------|
| `src/App.js` | Root: all state, view switching, API calls, auth, AI+Code overlay for debugger |
| `src/theme.js` | ThemeProvider: 5 themes (light/dark/ocean/forest/midnight), `setTheme()`, `isDarkTheme()` |
| `src/index.css` | CSS variables — light (`:root`), dark (`.dark-theme`), ocean/forest/midnight variants |
| `src/services/api.js` | All fetch calls: analyzeCode, runCode, stepAnalyzeSession, explainCode, generateCode |
| `src/components/Header.js` | Nav, theme picker dropdown (5 themes with swatches), view switcher, user pill |
| `src/components/FlowVisualizer.js` | Step debugger with play/pause/back/next/speed controls |
| `src/components/CodeEditor.js` | Monaco editor, per-theme Monaco themes, C/C++/Python snippets & completions |
| `src/components/CppEditorPage.js` | Compile & run for C/C++/Python, AI+Code floating overlay |
| `src/components/AiExplanation.js` | Renders Gemini AI insights (explanation, complexity, key points) |
| `src/components/LoginModal.js` | Mock auth modal — creates guest user from email |

### Key Backend Files
| File | Purpose |
|------|---------|
| `src/traceon/server/app.py` | FastAPI app: /health /analyze /run /explain /generate + CORS; Python session store |
| `src/traceon/server/ai_service.py` | Gemini AI via `google-genai`; generate_code_ai + explain_code_ai, language-aware |
| `src/traceon/server/python_tracer.py` | Standalone subprocess: sys.settrace tracer, outputs JSON snapshots to stdout |
| `src/traceon/server/session_manager.py` | In-memory session store, LLDB controller lifecycle (C/C++) |
| `src/traceon/server/mongo_store.py` | Optional MongoDB persistence (disabled if no `MONGO_URI`) |
| `src/traceon/server/models.py` | All Pydantic models; ExplainCodeRequest has `language` field |

### API Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health check |
| POST | `/analyze` | Start debug session (C/C++ via LLDB, Python via python_tracer.py), return first snapshot |
| POST | `/analyze/{id}/step` | Step forward/back in execution |
| POST | `/run` | Compile & run (C/C++), or `python3 main.py` directly; returns stdout/stderr |
| POST | `/explain` | Gemini AI code explanation (language-aware) |
| POST | `/generate` | Gemini AI code generation from natural language prompt (language-aware) |

## Language Support
| Language | Editor | Run | Debugger | AI Generate | AI Explain |
|----------|--------|-----|----------|-------------|------------|
| C        | ✅ | ✅ | ✅ LLDB | ✅ | ✅ |
| C++      | ✅ | ✅ | ✅ LLDB | ✅ | ✅ |
| Python   | ✅ | ✅ | ✅ sys.settrace | ✅ | ✅ |

**Python Debugger Notes:**
- `python_tracer.py` is run as a subprocess; it captures all `call`/`line`/`return` events via `sys.settrace`
- Snapshots are pre-computed (max 250 steps), stored in `_python_sessions` dict in `app.py`
- Step API serves snapshots from the pre-computed list; last step returns `status: EXITED`
- Stdout is captured inside the tracer (redirected to StringIO) so it doesn't mix with JSON output

## Theme System
- **5 themes:** light (default), dark, ocean, forest, midnight
- Body class strategy: all dark variants get `.dark-theme` + theme-specific class (e.g., `.theme-ocean`)
- `isDarkTheme(t)` helper exported from `theme.js` — use instead of `theme === "dark"`
- `setTheme(t)` replaces old `toggleTheme()` — stored in localStorage
- Header has a palette-icon dropdown showing all 5 themes with colored swatches
- Monaco editor themes: `traceon-light`, `traceon-dark`, `traceon-ocean`, `traceon-forest`, `traceon-midnight`
- CSS theme classes: `.dark-theme`, `.theme-ocean`, `.theme-forest`, `.theme-midnight`

## AI + Code Overlay
- Both editor page and debugger mode have a floating AI overlay triggered by "AI + Code" button
- Overlay: `position: absolute` with backdrop blur, sits over the left editor panel
- Enter submits, Escape closes; input auto-focuses on open
- On submit: calls `/generate` with the prompt + current language → inserts returned code into Monaco editor

## Auth System (Current State)
- **Mock only** — `LoginModal.js` uses `setTimeout(1500)` to fake login
- No backend auth endpoints
- User stored in `localStorage` as `traceon_user`
- Unauthenticated users are redirected to landing page
- Header "Sign In" button calls `onSignIn` prop → opens LoginModal

## AI Insights (Gemini)
- `GEMINI_API_KEY` in `.env` at project root
- Model: `gemini-2.5-flash`
- Fallback: `_static_explanation()` when no key or quota exceeded
- **Known issue:** Key from billed GCP project may have `limit: 0` free tier — regenerate from aistudio.google.com if AI fails

## Environment (.env at project root)
```
GEMINI_API_KEY=...          # Required for AI generate/explain
MONGO_URI=...               # Optional — enables session persistence
```

## Remaining To-Do (Priority Order)
1. **P2** DocsPage: replace `href="#"` links with in-page anchor scroll + real content sections
2. **P2** PricingPage: wire "Get Started" → editor, "Contact Sales" → `mailto:nishantkumar19041@gmail.com`
3. **P2** CommunityPage: wire "View Repository" → GitHub repo, "Join Server" → Discord/placeholder
4. **P3** LandingPage "View Demo" button → add `onClick={() => onStart()}`
5. **P3** Replace mock auth with real GitHub OAuth (or rename to "Continue as Guest")
6. **P4** Session memory cleanup — Python sessions (`_python_sessions`) never expire
7. **P4** Delete stale `backend/.env` (references Flask, backend is FastAPI)
8. **P5** README accuracy pass (remove unimplemented features, add Python + theme docs)

## Common Tasks

### Start dev servers
```bash
npm run dev          # both backend + frontend
npm run dev:backend  # backend only (port 8000)
npm run dev:frontend # frontend only (port 3000)
```

### Kill stale backend process
```bash
lsof -ti :8000 | xargs kill -9
```

### Test AI explain endpoint (language-aware)
```bash
curl -s -X POST http://localhost:8000/explain \
  -H "Content-Type: application/json" \
  -d '{"code":"print(\"hello\")", "language":"python"}'
```

### Test AI generate endpoint
```bash
curl -s -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"fibonacci sequence", "language":"cpp"}'
```

### Test Python debugger
```bash
curl -s -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"code":"x = 1\ny = x + 1\nprint(y)", "lang":"python"}'
```

## Style Rules
- CSS variables only — never hardcode palette colors in component CSS
- Orange accent `var(--primary)` = `#C96A48` on light, `#D97757` on dark (ocean: `#58A6FF`, forest: `#57C87A`, midnight: `#A855F7`)
- All new components: use `var(--bg-card)`, `var(--text-primary)`, `var(--border)` etc.
- No emojis in UI unless user explicitly asks
- `isDarkTheme(theme)` for any dark-vs-light conditional logic — never compare `theme === "dark"` directly
