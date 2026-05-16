# Traceon — AI-Powered C++ Execution Flow Visualizer

Traceon is a web-based debugger that steps through C/C++ programs line by line using LLDB, tracks every variable in real time, and uses Google Gemini to explain what the code is doing and why.

---

## What it does

- Compile and execute any C/C++ code directly in the browser
- Step forward and backward through execution one line at a time
- Watch variables appear, change, and go out of scope as you step
- Inspect the live call stack at every point in execution
- Click any step on the execution timeline to jump directly to it
- Ask Gemini to explain the code — time complexity, space complexity, a plain-English walkthrough
- Switch between edit mode and playback mode without losing your session
- Light and dark themes

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Monaco Editor, CSS custom properties |
| Backend | Python 3.10+, FastAPI, Uvicorn |
| Debugger | LLDB (step-by-step C/C++ execution) |
| Compiler | clang++ (falls back to g++) |
| AI | Google Gemini 2.5 Flash via `google-genai` SDK |
| Database | MongoDB (optional — graceful fallback to in-memory) |

---

## Prerequisites

- **macOS or Linux** (Windows not tested)
- Python 3.10+
- Node.js 18+ and npm
- LLDB and clang++

```bash
# macOS — Xcode command-line tools include clang++ and lldb
xcode-select --install

# Ubuntu / Debian
sudo apt install build-essential clang lldb

# Fedora
sudo dnf install gcc-c++ clang lldb
```

---

## Setup

### 1. Clone

```bash
git clone https://github.com/NkOffiCiAL07/AI-Powered-C-Execution-Flow-Visualizer.git
cd AI-Powered-C-Execution-Flow-Visualizer
```

### 2. Backend

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_key_here
# Optional — omit to use in-memory session storage
MONGO_URI=mongodb://localhost:27017
```

Get a free Gemini API key at [aistudio.google.com](https://aistudio.google.com).

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
2. Write or paste C/C++ code in the editor (no `main()` required — it is auto-wrapped)
3. Click **Analyze & Visualize** in the header
4. Use the playback controls to step through execution:

| Control | Action |
|---------|--------|
| Next | Advance one line |
| Back | Go back one line |
| Play / Pause | Auto-step at 1 s intervals |
| Timeline click | Jump to any recorded step |
| Space | Play / Pause |
| → or N | Step forward |
| ← or B | Step back |
| Esc | Reset |

5. Click **Explain Code** to get an AI breakdown of time complexity, space complexity, and a section-by-section walkthrough.

---

## Project structure

```
.
├── run_server.py              # Backend entry point
├── requirements.txt
│
├── src/traceon/
│   ├── executor.py            # Compile + LLDB session lifecycle
│   ├── lldb_controller.py     # LLDB MI protocol wrapper
│   ├── models.py              # Shared data models
│   └── server/
│       ├── app.py             # FastAPI app + CORS
│       ├── api.py             # REST endpoints
│       ├── session_manager.py # In-memory session store
│       ├── ai_service.py      # Gemini integration
│       └── mongo_store.py     # MongoDB persistence (optional)
│
└── frontend/src/
    ├── App.js                 # Root — view routing, auth state
    ├── theme.js               # Light / dark theme context
    ├── components/
    │   ├── LandingPage.js
    │   ├── Header.js
    │   ├── CppEditorPage.js   # Main editor + visualizer layout
    │   ├── CodeEditor.js      # Monaco editor wrapper
    │   ├── FlowVisualizer.js  # Step viewer + variable cards
    │   ├── ExecutionTimeline.js
    │   ├── VariableTracker.js
    │   ├── AiExplanation.js   # Gemini explanation panel
    │   ├── OutputPanel.js
    │   ├── LoginModal.js
    │   ├── DocsPage.js
    │   ├── PricingPage.js
    │   └── CommunityPage.js
    └── styles/                # Per-component CSS
```

---

## API reference

### `POST /analyze`

Compile code and return all execution snapshots.

```json
// Request
{ "code": "int x = 5;\nint y = x * 2;" }

// Response
{
  "session_id": "abc123",
  "snapshots": [
    {
      "step": 1,
      "location": { "file": "tmp.cpp", "line": 3, "function": "main" },
      "variables": { "x": "5" },
      "changed_variables": ["x"]
    }
  ],
  "total_steps": 12
}
```

### `POST /run`

Compile and run code, returning stdout and stderr.

### `GET /health`

Returns `{ "status": "ok" }`.

---

## Troubleshooting

**`LLDB not found`**
Install the LLDB package for your OS (see Prerequisites above). On macOS, running `xcode-select --install` is usually enough.

**`Compilation failed`**
The error message returned by the API includes the compiler output. Check for missing semicolons, undeclared variables, or unsupported C++ standard features.

**Port conflict**
```bash
lsof -i :8000 | awk 'NR>1 {print $2}' | xargs kill -9
```

**Gemini returns empty / slow**
Make sure `GEMINI_API_KEY` is set in `.env` and that the key was generated from [aistudio.google.com](https://aistudio.google.com) (not a GCP project with free-tier quota disabled).

**No variables shown**
Code is compiled with `-g` automatically. If variables still don't appear, check that LLDB has permission to attach to processes (`sudo DevToolsSecurity -enable` on macOS).

---

## License

MIT — see [LICENSE](LICENSE).

---

## Contributing

Issues and pull requests are welcome. For larger changes, open an issue first to discuss the approach.
