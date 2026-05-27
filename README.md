# Traceon — AI-Powered Execution Flow Visualizer

Traceon is a web-based debugger that steps through C, C++, Python, and Java programs line by line, tracks every variable in real time, visualizes execution as an interactive flow graph, and uses Google Gemini to explain what the code is doing and why.

**Live demo:** https://frontend-gamma-vert-20.vercel.app

---

## What it does

### Core Debugger
- Write and run C, C++, Python, or Java code directly in the browser
- Step forward and backward through execution one line at a time (Step Over / Step Into / Step Out)
- Auto-play execution with configurable speed; pauses automatically at breakpoints
- Watch variables appear, change, and go out of scope as you step
- Set breakpoints by clicking the editor gutter — jump to next breakpoint with F5
- Visualize the execution call graph as it builds step by step
- Inspect the live call stack at every point in execution
- Memory Spectrometer — visualize heap and stack allocations per step

### Code Flow Graph
- Interactive SVG flowchart built from the actual execution trace
- Every unique (function, line) pair becomes a node; click to expand for full detail
- Node detail panel: code snippet, execution count, first/last step, live variables, call stack, visit chips
- Language-aware node type detection (condition, loop, func-def, call, return, else) for C/C++, Python, Java
- Pan, zoom, and drag the graph; nodes link to the execution step via visit chips

### Editor & Sharing
- Monaco Editor with syntax highlighting, bracket matching, and live error squiggles (clang-based)
- Share Code — one-click button encodes your code + language into a shareable URL
- AI Generate — describe what you want, Gemini writes it
- AI Explain (floating FAB) — plain-English breakdown with time/space complexity
- AI Optimize — uses live hotspot data to recommend targeted optimizations

### Visual Features
- Execution Heatmap — color-coded gutter bars (blue → yellow → red) showing how often each line ran
- Playback Scrubber — drag the progress bar to jump to any execution step; breakpoints shown as red markers
- Performance Score Badge — Blazing / Moderate / Heavy label based on execution step count
- Smooth view transitions — fade+slide between every page
- Animated Stats on landing page — scroll-triggered count-up (50k+ traces, 4 languages, 200ms, 99.9%)
- Testimonials carousel — rotating social-proof cards
- First-run onboarding tour — 4-step spotlight walkthrough for new users

### Platform
- Google OAuth sign-in + JWT authentication
- Projects & multi-file management (Dashboard)
- Save projects, switch files, rename, delete
- Five themes: Light (default), Dark, Nord, Solarized, High Contrast
- Keyboard shortcuts for every action

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Monaco Editor, CSS custom properties |
| Backend | Python 3.12, FastAPI, Uvicorn |
| Debugger | LLDB (C/C++), pexpect tracer (Python), bytecode tracer (Java) |
| Compilers | clang/gcc (C/C++), Python 3, OpenJDK |
| AI | Google Gemini 2.5 Flash via `google-genai` SDK |
| Auth | Google OAuth 2.0 + JWT |
| Database | MongoDB Atlas (optional — graceful fallback to in-memory) |
| Frontend hosting | Vercel |
| Backend hosting | Railway (Docker) |

---

## Prerequisites

- **Python 3.11+** (3.12 recommended)
- **Node.js 18+** and npm
- **clang / LLDB** for C/C++ debugging
- **Java JDK 17+** for Java execution

```bash
# macOS — Xcode command-line tools include clang and lldb
xcode-select --install
brew install openjdk@17

# Ubuntu / Debian
sudo apt install build-essential clang lldb default-jdk

# Fedora
sudo dnf install gcc-c++ clang lldb java-17-openjdk
```

---

## Local setup

### 1. Clone

```bash
git clone https://github.com/NkOffiCiAL07/AI-Powered-C-Execution-Flow-Visualizer.git
cd AI-Powered-C-Execution-Flow-Visualizer
```

### 2. Backend

```bash
python3 -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_key_here         # aistudio.google.com — free
JWT_SECRET=any_long_random_string

# Google OAuth — required for Sign In with Google
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
# Register http://localhost:8000/auth/google/callback in Google Cloud Console
# under Credentials → OAuth Client → Authorized redirect URIs

# MongoDB (optional — omit to use in-memory storage)
MONGO_URI=mongodb+srv://...
```

### 3. Frontend

```bash
cd frontend
npm install
```

---

## Running locally

**Terminal 1 — backend**

```bash
source venv/bin/activate
python run_server.py
# Listening on http://127.0.0.1:8000
```

**Terminal 2 — frontend**

```bash
cd frontend
npm start
# Opens http://localhost:3000
```

---

## Usage

1. Open `http://localhost:3000`
2. Sign in with Google (or use Guest mode for Run-only access)
3. Create a project from the Dashboard, then open it in the Editor
4. Select a language (C, C++, Python, Java) from the dropdown
5. Write or paste code — or click **Generate** to have Gemini write it
6. Click **Run** (`⌘↵`) to compile and execute
7. Click **Debug** to launch the step-through debugger

### Debugger controls

| Control | Action |
|---|---|
| Step / → | Step over (next line) |
| Into / ↓ | Step into function call |
| Out / ↑ | Step out of current function |
| Back / ← | Step back |
| Space | Play / Pause auto-play |
| Scrubber drag | Jump to any visited step |
| F5 | Continue to next breakpoint |
| Click gutter | Toggle breakpoint |
| ? | Keyboard shortcuts modal |

8. Click the floating **AI Insights** button (bottom-right) for an AI breakdown of complexity and logic.
9. Switch to the **Flow Graph** tab to see the full execution trace as an interactive flowchart.

---

## Google OAuth Setup

1. Go to [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. Create an **OAuth 2.0 Client ID** (Web application type)
3. Under **Authorized JavaScript origins** add:
   - `http://localhost:3000`
   - `http://localhost:8000`
4. Under **Authorized redirect URIs** add:
   - `http://localhost:8000/auth/google/callback`
5. Copy the Client ID and Client Secret into your `.env` file

---

## Deployment

| Service | URL |
|---|---|
| Frontend (Vercel) | https://frontend-gamma-vert-20.vercel.app |
| Backend API (Railway) | https://traceon-backend-production.up.railway.app |

Auto-deploy is configured:
- **Frontend** — GitHub Actions deploys to Vercel on every push to `main` that touches `frontend/**`
- **Backend** — Railway rebuilds the Docker image on every push to `main` that touches `src/**`, `requirements.txt`, or `Dockerfile`

See [DEPLOY.md](./DEPLOY.md) for full deployment instructions.

---

## Project structure

```
.
├── run_server.py                  # Backend entry point
├── requirements.txt
├── Dockerfile                     # Python 3.12 + GCC + LLDB + Java
│
├── src/traceon/server/
│   ├── app.py                     # FastAPI app, CORS, lifespan
│   ├── auth.py                    # Google OAuth + JWT + JTI blocklist
│   ├── ai_service.py              # Gemini code generation & explanation
│   ├── models.py                  # Shared Pydantic models
│   ├── mongo_store.py             # MongoDB persistence (optional)
│   ├── python_tracer.py           # Python step-by-step tracer
│   ├── java_tracer.py             # Java bytecode tracer
│   └── news.py                    # Release notes feed
│
├── frontend/src/
│   ├── App.js                     # Root — view routing, auth state, all API calls
│   ├── theme.js                   # ThemeProvider (5 themes)
│   ├── services/api.js            # Authenticated fetch wrapper
│   ├── components/
│   │   ├── LandingPage.js         # Landing + stats counter + testimonials
│   │   ├── Header.js
│   │   ├── CppEditorPage.js       # Editor layout + run/debug/generate/optimize
│   │   ├── CodeEditor.js          # Monaco editor + heatmap + share button + breakpoints
│   │   ├── FlowVisualizer.js      # Debugger: controls, scrubber, perf badge, call graph
│   │   ├── CodeFlowGraph.js       # Interactive execution trace SVG flowchart
│   │   ├── ExecutionTimeline.js
│   │   ├── VariableTracker.js
│   │   ├── MemorySpectrometer.js  # Heap/stack visualizer
│   │   ├── BreakpointsPanel.js    # Breakpoint hit list
│   │   ├── AiExplanation.js
│   │   ├── OnboardingTour.js      # First-run spotlight tour
│   │   ├── OutputPanel.js
│   │   ├── LoginModal.js
│   │   ├── DocsPage.js
│   │   ├── PricingPage.js
│   │   ├── CommunityPage.js
│   │   ├── NewsPage.js
│   │   └── DashboardPage.js
│   └── styles/                    # Per-component CSS modules
│
└── .github/workflows/
    └── deploy-frontend.yml        # Auto-deploy frontend to Vercel
```

---

## API reference

### `POST /analyze`
Compile and trace code, returning a debug session with execution snapshots.

```json
// Request
{ "code": "int x = 5;\nint y = x * 2;", "language": "cpp" }

// Response
{
  "session_id": "abc123",
  "snapshots": [
    {
      "step": 1,
      "location": { "file": "tmp.cpp", "line": 3, "function": "main" },
      "variables": { "x": "5" },
      "changed_variables": ["x"],
      "call_stack": [{ "function": "main", "line": 3 }]
    }
  ],
  "total_recorded_steps": 12
}
```

### `POST /analyze/{id}/step`
Step forward or backward in an active debug session.
- `direction`: `"next"` | `"back"`
- `step_type`: `"step_over"` | `"step_in"` | `"step_out"`

### `POST /run`
Compile and run code; returns `stdout`, `stderr`, and `exit_code`.

### `POST /check`
Live syntax check (clang -fsyntax-only); returns inline error markers.

### `POST /generate`
Generate code from a natural-language prompt using Gemini.

### `POST /explain`
Return an AI-powered code explanation with complexity analysis.

### `POST /optimize`
Return targeted performance recommendations using live hotspot data.

### `GET /health`
Returns `{"status": "ok"}`.

---

## Troubleshooting

**`redirect_uri_mismatch` on Google sign-in**
Add `http://localhost:8000/auth/google/callback` to **Authorized redirect URIs** (not JavaScript origins) in your Google Cloud Console OAuth client.

**`LLDB not found`**
Install LLDB for your OS. On macOS: `xcode-select --install`.

**`Compilation failed`**
The API response includes compiler output. Check for syntax errors.

**`Cannot connect to server` in the UI**
Make sure the backend is running on port 8000: `python run_server.py`.

**Port conflict**
```bash
lsof -i :8000 | awk 'NR>1 {print $2}' | xargs kill -9
```

---

## License

MIT — see [LICENSE](LICENSE).

---

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.
