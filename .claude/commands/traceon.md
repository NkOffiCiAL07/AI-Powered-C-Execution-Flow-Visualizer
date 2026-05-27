# Traceon Project Context

You are working on **Traceon** — an AI-powered C/C++/Python/Java execution flow visualizer built with React + FastAPI + LLDB.

## Quick Facts
- **Root:** `/Users/nkofficial07/Desktop/Projects/AI-Powered-C-Execution-Flow-Visualizer/`
- **Frontend:** React 18, Monaco Editor, CSS variables (light theme default), no React Router (state-based view switching via `?v=` query params)
- **Backend:** FastAPI + uvicorn on port 8000, LLDB debugger (C/C++), sys.settrace (Python), Gemini AI
- **Frontend port:** 3000 | **Backend port:** 8000
- **Deployed:** Vercel (frontend) via GitHub Actions `.github/workflows/deploy-frontend.yml`
- **Live URL:** https://frontend-gamma-vert-20.vercel.app

## Architecture

### Views (controlled by `view` state in App.js, synced to `?v=` query param)
| View | Component | Status |
|------|-----------|--------|
| `landing` | `LandingPage.js` | ✅ Full — stats counter, testimonials, animated hero |
| `dashboard` | `DashboardPage.js` | ✅ Full |
| `editor` | `CppEditorPage.js` | ✅ Full — C, C++, Python, Java |
| `visualizer` | inline in `App.js` | ✅ Full |
| `docs` | `DocsPage.js` | ✅ Full content |
| `pricing` | `PricingPage.js` | ✅ CTAs wired |
| `community` | `CommunityPage.js` | ✅ Links wired |
| `news` | `NewsPage.js` | ✅ Release notes |

### Key Frontend Files
| File | Purpose |
|------|---------|
| `src/App.js` | Root: view switching, project state, all API calls, confetti, onboarding tour, floating AI FAB |
| `src/contexts/AuthContext.js` | Auth state (user, login, logout, showLoginModal, sessionExpiredBanner) |
| `src/services/auth.js` | JWT decode, normalizeUser, restoreSession, serverLogout |
| `src/services/api.js` | All fetch calls with auth header; dispatches `traceon:session-expired` on 401 |
| `src/theme.js` | ThemeProvider: 5 themes (light/dark/ocean/forest/midnight) |
| `src/index.css` | CSS variables + global styles including: AI FAB, perf badge, share toast, view transitions, stat cards, testimonials |
| `src/components/LandingPage.js` | Landing page + animated stats (IntersectionObserver count-up) + testimonials carousel |
| `src/components/Header.js` | Nav, theme picker, view switcher, user pill |
| `src/components/CppEditorPage.js` | Editor layout — run/debug/generate/optimize + floating AI Explain FAB |
| `src/components/CodeEditor.js` | Monaco editor, heatmap decorations, share button, breakpoint gutter |
| `src/components/FlowVisualizer.js` | Step debugger: play/pause/step controls, draggable scrubber, perf badge, call graph |
| `src/components/CodeFlowGraph.js` | Interactive SVG execution trace flowchart (pan/zoom, node detail panel) |
| `src/components/MemorySpectrometer.js` | Heap/stack allocation visualizer |
| `src/components/BreakpointsPanel.js` | Breakpoint hit list |
| `src/components/OnboardingTour.js` | First-run 4-step spotlight tooltip tour (localStorage-gated) |
| `src/components/AiExplanation.js` | Renders Gemini AI insights |
| `src/components/ExecutionTimeline.js` | Step timeline strip |
| `src/components/VariableTracker.js` | Live variable table with diff highlighting |

### Key Backend Files
| File | Purpose |
|------|---------|
| `src/traceon/server/app.py` | FastAPI app: all execution endpoints + CORS + syntax check |
| `src/traceon/server/auth.py` | Google OAuth, JWT issue/verify, JTI blocklist, rate limiting, CSRF state store |
| `src/traceon/server/ai_service.py` | Gemini AI: generate_code_ai + explain_code_ai + optimize_code_ai |
| `src/traceon/server/python_tracer.py` | Subprocess sys.settrace tracer, outputs JSON snapshots |
| `src/traceon/server/session_manager.py` | In-memory LLDB session store |
| `src/traceon/server/models.py` | All Pydantic models |
| `src/traceon/server/mongo_store.py` | Optional MongoDB persistence |
| `src/traceon/server/news.py` | Release notes feed |

### API Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health check |
| GET | `/auth/google` | Start Google OAuth (rate-limited) |
| GET | `/auth/google/callback` | OAuth callback, issues JWT, closes popup via postMessage |
| POST | `/auth/logout` | Adds token JTI to blocklist |
| GET | `/auth/me` | Validate token, return user info |
| POST | `/check` | Live syntax check (clang -fsyntax-only) |
| POST | `/analyze` | Start debug session, return first snapshot |
| POST | `/analyze/{id}/step` | Step forward/back/in/out in execution |
| POST | `/run` | Compile & run; returns stdout/stderr |
| POST | `/explain` | Gemini AI explanation with complexity analysis |
| POST | `/generate` | Gemini AI code generation from prompt |
| POST | `/optimize` | AI perf recommendations using hotspot data |

## Feature Map (what's built)

### Editor (`CppEditorPage` + `CodeEditor`)
- Monaco editor with per-theme syntax highlighting (5 themes)
- Live syntax check with inline error squiggles (debounced 1500ms, AbortController)
- Breakpoint gutter — click line number to toggle; persisted to localStorage
- Execution heatmap — gutter color bars (blue/yellow/red) based on hit count after debug
- Share Code button — encodes code+lang to URL hash, copies to clipboard, shows toast
- Floating AI Explain FAB — always visible bottom-right; shows guest lock / loading / ready states
- AI Generate overlay — describe in natural language, Gemini writes the code
- Save / file management (signed-in users with active project)

### Debugger (`FlowVisualizer`)
- Step Over / Step Into / Step Out / Back controls
- Auto-play with configurable speed (150ms–2000ms)
- Play mode toggle: Step In or Step Over during auto-play
- Breakpoint auto-pause — stops at breakpointed lines during play, shows Resume badge
- Draggable timeline scrubber — click or drag the progress bar to jump to any visited step; red markers at breakpoint positions
- Performance Score Badge — ⚡ Blazing (≤20 steps) / 🟡 Moderate (≤120) / 🔴 Heavy (>120)
- Execution state panel — current line badge, function badge, variable change cards
- Call graph — live SVG showing function call relationships
- Keyboard shortcuts: Arrow keys, Space, F5

### Code Flow Graph (`CodeFlowGraph`)
- Interactive SVG flowchart from execution trace
- Language-aware node type detection: C/C++, Python, Java
- Node types: entry, exit, condition, else, loop, call, return, func-def, noise (filtered)
- Back-edge detection via execution order (loop back-edges drawn on left side)
- Detail panel: code, type badge, exec count, first/last step, variables table, call stack, visit chips
- Per-node clipPath to prevent text overflow
- Pan (drag), zoom (scroll wheel), reset button
- Resets on new analysis session

### Landing Page
- Animated stats counter (IntersectionObserver scroll trigger, count-up animation)
- Testimonials carousel (auto-rotates every 4s, dot navigation)
- Smooth view transitions (fade+slide CSS animation on every page switch)

### App-Wide
- Floating AI Insights FAB in visualizer — always visible, loading/disabled states
- First-run onboarding tour — 4 steps, spotlight cutout, `traceon_tour_done` localStorage flag
- Smooth view transitions — `view-enter` CSS keyframe on every `key={view}` change
- Google OAuth sign-in; JWT stored in localStorage; server-side logout via JTI blocklist

## Auth System
- **Backend:** `src/traceon/server/auth.py` — Google OAuth2 popup flow, JWT (HS256), JTI blocklist
- **Frontend:** `AuthContext.js` → `{ user, authLoading, login, logout, showLoginModal }`
- Redirect URI: `http://localhost:8000/auth/google/callback` — must be in Google Cloud Console → OAuth client → **Authorized redirect URIs** (NOT JavaScript origins)
- Token: `localStorage["traceon_auth_token"]`; User: `localStorage["traceon_user"]`
- Guest users: `provider: "guest"`, `role: "guest"`, no token; only Run is available

## Language Support
| Language | Editor | Run | Debugger | Live Check | AI | Flow Graph |
|----------|--------|-----|----------|------------|----|------------|
| C        | ✅ | ✅ | ✅ LLDB | ✅ clang | ✅ | ✅ |
| C++      | ✅ | ✅ | ✅ LLDB | ✅ clang | ✅ | ✅ |
| Python   | ✅ | ✅ | ✅ sys.settrace | ✅ | ✅ | ✅ |
| Java     | ✅ | ✅ | ✅ JVM tracer | ✅ | ✅ | ✅ |

## Deployment
- **Frontend:** Vercel, auto-deploys on push to `main` when `frontend/**` changes
- **Workflow:** `.github/workflows/deploy-frontend.yml` — uses secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- **Vercel project root:** `frontend/`
- **SPA rewrite:** `frontend/vercel.json` → `"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]`

## Theme System
- **5 themes:** light (default), dark, ocean, forest, midnight
- `isDarkTheme(t)` from `theme.js` — use instead of `theme === "dark"`
- Orange accent: `var(--primary)` = `#C96A48` (light) / `#D97757` (dark)
- Monaco themes: `traceon-light`, `traceon-dark`, `traceon-ocean`, `traceon-forest`, `traceon-midnight`

## Style Rules
- CSS variables only — never hardcode palette colors
- `var(--bg-card)`, `var(--text-primary)`, `var(--border)` for all components
- External links: always `<a href="..." target="_blank" rel="noopener noreferrer">`
- `isDarkTheme(theme)` for dark-vs-light logic
- AI buttons: use the floating FAB pattern — not inline action buttons in toolbars

## Environment (.env at project root)
```
GEMINI_API_KEY=...             # Required for AI generate/explain/optimize
GOOGLE_CLIENT_ID=...           # Required for Google OAuth
GOOGLE_CLIENT_SECRET=...       # Required for Google OAuth
JWT_SECRET=...                 # Required — long random string
OAUTH_REDIRECT_URI=...         # Default: http://localhost:8000/auth/google/callback
FRONTEND_ORIGIN=...            # Default: http://localhost:3000
MONGO_URI=...                  # Optional — enables persistence
JWT_TTL_SECONDS=...            # Optional — default 7 days
```

## Remaining To-Do
1. **P4** Python sessions (`_python_sessions` in app.py) never expire — add TTL cleanup
2. **P4** Java support in debugger fully tested end-to-end
3. **P5** Community page — real forum/thread functionality
