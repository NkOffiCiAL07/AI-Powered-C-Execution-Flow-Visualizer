# Traceon Project Context

You are working on **Traceon** — an AI-powered C/C++/Python execution flow visualizer built with React + FastAPI + LLDB.

## Quick Facts
- **Root:** `/Users/nkofficial07/Desktop/Projects/AI-Powered-C-Execution-Flow-Visualizer/`
- **Frontend:** React 18, Monaco Editor, CSS variables (light theme default), no React Router (state-based view switching via `?v=` query params)
- **Backend:** FastAPI + uvicorn on port 8000, LLDB debugger (C/C++), sys.settrace (Python), Gemini AI
- **Frontend port:** 3000 | **Backend port:** 8000
- **Deployed:** Vercel (frontend) via GitHub Actions workflow `.github/workflows/deploy-frontend.yml`

## Architecture

### Views (controlled by `view` state in App.js, synced to `?v=` query param)
| View | Component | Status |
|------|-----------|--------|
| `landing` | `LandingPage.js` | ✅ Full |
| `dashboard` | `DashboardPage.js` | ✅ Full |
| `editor` | `CppEditorPage.js` | ✅ Full (C, C++, Python) |
| `visualizer` | inline in `App.js` | ✅ Full |
| `docs` | `DocsPage.js` | ⚠️ Stub content |
| `pricing` | `PricingPage.js` | ✅ CTAs wired |
| `community` | `CommunityPage.js` | ✅ Links wired |
| `settings` | `SettingsPage.js` | ✅ Sections implemented |

### Key Frontend Files
| File | Purpose |
|------|---------|
| `src/App.js` | Root: view switching, project state, API calls, AI+Code overlay |
| `src/contexts/AuthContext.js` | Auth state (user, login, logout, showLoginModal, sessionExpiredBanner) |
| `src/services/auth.js` | JWT decode, normalizeUser, restoreSession, serverLogout, TOKEN_KEY/USER_KEY |
| `src/services/api.js` | All fetch calls with auth header; dispatches `traceon:session-expired` on 401 |
| `src/theme.js` | ThemeProvider: 5 themes (light/dark/ocean/forest/midnight) |
| `src/index.css` | CSS variables — light (`:root`), dark (`.dark-theme`), theme variants |
| `src/components/Header.js` | Nav, theme picker, view switcher, user pill, sign-in/out |
| `src/components/LoginModal.js` | Google OAuth popup + guest sign-in; postMessage from backend popup |
| `src/components/FlowVisualizer.js` | Step debugger with play/pause/back/next/speed controls |
| `src/components/CodeEditor.js` | Monaco editor, per-theme Monaco themes, live syntax check markers |
| `src/components/CppEditorPage.js` | Compile & run, live syntax check (AbortController), AI+Code overlay |
| `src/components/AiExplanation.js` | Renders Gemini AI insights |
| `src/utils/logger.js` | Thin console logger wrapper |

### Key Backend Files
| File | Purpose |
|------|---------|
| `src/traceon/server/app.py` | FastAPI app: all execution endpoints + CORS + syntax check + wrap offsets |
| `src/traceon/server/auth.py` | Google OAuth, JWT issue/verify, JTI blocklist, rate limiting, state CSRF store |
| `src/traceon/server/ai_service.py` | Gemini AI: generate_code_ai + explain_code_ai, language-aware |
| `src/traceon/server/python_tracer.py` | Subprocess sys.settrace tracer, outputs JSON snapshots |
| `src/traceon/server/session_manager.py` | In-memory LLDB session store |
| `src/traceon/server/models.py` | All Pydantic models |
| `src/traceon/server/mongo_store.py` | Optional MongoDB persistence |

### API Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health check |
| GET | `/auth/google` | Start Google OAuth (rate-limited) |
| GET | `/auth/google/callback` | OAuth callback, issues JWT, closes popup via postMessage |
| POST | `/auth/logout` | Adds token JTI to blocklist (server-side revocation) |
| GET | `/auth/me` | Validate token, return user info |
| POST | `/check` | Live syntax check (clang -fsyntax-only); adjusts line offsets for code wrapping |
| POST | `/analyze` | Start debug session (C/C++ LLDB, Python tracer), return first snapshot |
| POST | `/analyze/{id}/step` | Step forward/back in execution |
| POST | `/run` | Compile & run; returns stdout/stderr |
| POST | `/explain` | Gemini AI explanation (language-aware) |
| POST | `/generate` | Gemini AI code generation from prompt (language-aware) |

## Auth System (Current State — Real, Not Mock)
- **Backend:** `src/traceon/server/auth.py` — Google OAuth2 with JWT (HS256), JTI blocklist for server-side logout
- **Frontend:** `AuthContext.js` provides `{ user, authLoading, login, logout, showLoginModal, setShowLoginModal }`
- `useAuth()` hook — throws if used outside `<AuthProvider>`
- `AuthProvider` wraps `<App>` in `index.js`
- Session restore on mount: validates against `/auth/me`, falls back to localStorage
- `traceon:session-expired` event dispatched from `api.js` on 401, handled in `AuthContext`
- Token stored in `localStorage` under key `traceon_auth_token`; user under `traceon_user`
- Guest users: `provider: "guest"`, `role: "guest"`, no token

## Language Support
| Language | Editor | Run | Debugger | Live Check | AI |
|----------|--------|-----|----------|------------|----|
| C        | ✅ | ✅ | ✅ LLDB | ✅ clang | ✅ |
| C++      | ✅ | ✅ | ✅ LLDB | ✅ clang | ✅ |
| Python   | ✅ | ✅ | ✅ sys.settrace | ✅ | ✅ |

## Live Syntax Check
- Debounced 1500ms; AbortController cancels stale in-flight requests on new keystrokes
- Backend wraps partial code with boilerplate before passing to clang; `_get_wrap_offsets` + `_adjust_error_lines` correct line numbers back to user's source
- Monaco `setModelMarkers` renders inline red squiggles

## Deployment
- **Frontend:** Vercel, auto-deploys on push to `main` when `frontend/**` changes
- **Workflow:** `.github/workflows/deploy-frontend.yml` — uses secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- **Vercel project root:** `frontend/` (set in Vercel dashboard project settings)
- **SPA rewrite:** `frontend/vercel.json` has `"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]`
- **Backend:** Not deployed (local/Docker only)

## Theme System
- **5 themes:** light (default), dark, ocean, forest, midnight
- `isDarkTheme(t)` from `theme.js` — use instead of `theme === "dark"`
- `setTheme(t)` stored in localStorage; `toggleTheme()` is removed
- Monaco editor themes: `traceon-light`, `traceon-dark`, `traceon-ocean`, `traceon-forest`, `traceon-midnight`
- Orange accent: `var(--primary)` = `#C96A48` (light) / `#D97757` (dark)

## Environment (.env at project root)
```
GEMINI_API_KEY=...             # Required for AI generate/explain
GOOGLE_CLIENT_ID=...           # Required for Google OAuth
GOOGLE_CLIENT_SECRET=...       # Required for Google OAuth
JWT_SECRET=...                 # Required — use a long random string in prod
MONGO_URI=...                  # Optional — enables session persistence
JWT_TTL_SECONDS=...            # Optional — default 3600
```

## Style Rules
- CSS variables only — never hardcode palette colors
- `var(--bg-card)`, `var(--text-primary)`, `var(--border)` for all components
- External links: always `<a href="..." target="_blank" rel="noopener noreferrer">` — never `<button onClick={() => window.open(...)}>`
- No emojis in UI unless user explicitly asks
- `isDarkTheme(theme)` for dark-vs-light logic

## Remaining To-Do
1. **P2** DocsPage: real content sections with in-page anchor scroll
2. **P4** Python sessions (`_python_sessions` in app.py) never expire — add TTL cleanup
3. **P5** README accuracy pass
