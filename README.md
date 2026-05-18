# Traceon — AI-Powered Execution Flow Visualizer

Traceon is a web-based debugger that steps through C, C++, Python, and Java programs line by line, tracks every variable in real time, and uses Google Gemini to explain what the code is doing and why.

**Live demo:** https://frontend-gamma-vert-20.vercel.app

---

## What it does

- Write and run C, C++, Python, or Java code directly in the browser
- Step forward and backward through execution one line at a time
- Watch variables appear, change, and go out of scope as you step
- Visualize the execution call graph as it builds step by step
- Inspect the live call stack at every point in execution
- Click any step on the execution timeline to jump directly to it
- AI code generation — describe what you want, Gemini writes it
- AI code explanation — time complexity, space complexity, plain-English walkthrough
- Save projects and manage multiple files (signed-in users)
- Memory Spectrometer — visualize heap and stack usage per step
- Hotspot heatmap — see which lines execute most
- Five themes: Light, Dark, Nord, Solarized, High Contrast
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

# Google OAuth (optional — needed for Sign In)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# MongoDB (optional — omit to use in-memory storage)
MONGO_CONNECTION_STRING=mongodb+srv://...
MONGO_DB_NAME=traceon
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
2. Select a language (C, C++, Python, Java) from the dropdown
3. Write or paste code — or use AI Generate to have Gemini write it
4. Click **Analyze** to trace execution

| Control | Action |
|---|---|
| Next / → / N | Step forward |
| Back / ← / B | Step back |
| Space | Play / Pause |
| Timeline click | Jump to any step |
| Esc | Reset |
| ? | Keyboard shortcuts modal |

5. Click **Explain Code** (AI Insights tab) for an AI breakdown of complexity and logic.

---

## Deployment

The project is deployed at:

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
│   ├── api.py                     # REST endpoints
│   ├── session_manager.py         # In-memory session store + cleanup
│   ├── ai_service.py              # Gemini code generation & explanation
│   ├── auth.py                    # Google OAuth + JWT
│   ├── models.py                  # Shared Pydantic models
│   ├── mongo_store.py             # MongoDB persistence (optional)
│   ├── python_tracer.py           # Python step-by-step tracer
│   └── java_tracer.py             # Java bytecode tracer
│
├── frontend/src/
│   ├── App.js                     # Root — view routing, auth state
│   ├── theme.js                   # Theme context (5 themes)
│   ├── services/api.js            # Authenticated fetch wrapper
│   ├── components/
│   │   ├── LandingPage.js
│   │   ├── Header.js
│   │   ├── CppEditorPage.js       # Main editor + visualizer layout
│   │   ├── CodeEditor.js          # Monaco editor wrapper
│   │   ├── FlowVisualizer.js      # Call graph + variable cards
│   │   ├── ExecutionTimeline.js
│   │   ├── VariableTracker.js
│   │   ├── AiExplanation.js       # Gemini explanation panel
│   │   ├── OutputPanel.js
│   │   ├── LoginModal.js
│   │   ├── DocsPage.js
│   │   ├── PricingPage.js
│   │   └── CommunityPage.js
│   └── styles/                    # Per-component CSS
│
└── .github/workflows/
    └── deploy-frontend.yml        # Auto-deploy frontend to Vercel
```

---

## API reference

### `POST /analyze`

Compile and trace code, returning all execution snapshots.

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
      "call_stack": ["main"]
    }
  ],
  "total_recorded_steps": 12
}
```

### `POST /run`

Compile and run code, returning stdout/stderr.

### `POST /generate`

Generate code from a plain-English prompt using Gemini.

### `POST /explain`

Explain code — returns complexity analysis and walkthrough.

### `GET /health`

Returns `{"status": "ok"}`.

### `GET /health/db`

Returns `{"mongo_connected": true/false}`.

---

## Troubleshooting

**`LLDB not found`**
Install LLDB for your OS. On macOS: `xcode-select --install`.

**`Compilation failed`**
The API response includes the compiler output. Check for syntax errors or unsupported features.

**`StrEnum import error`**
Ensure Python 3.11 or higher is installed. `StrEnum` was added in 3.11.

**`Cannot connect to server` in the UI**
Make sure the backend is running on port 8000. Check `REACT_APP_API_URL` in `frontend/src/services/api.js`.

**Gemini returns empty / slow**
Ensure `GEMINI_API_KEY` is set and was generated from [aistudio.google.com](https://aistudio.google.com).

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
