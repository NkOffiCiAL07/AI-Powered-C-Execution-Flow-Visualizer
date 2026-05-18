# Contributing to Traceon

Thank you for your interest in contributing. This document covers how to get set up, how to make changes, and how to submit them.

---

## Getting started

### 1. Fork and clone

```bash
git clone https://github.com/YOUR_USERNAME/AI-Powered-C-Execution-Flow-Visualizer.git
cd AI-Powered-C-Execution-Flow-Visualizer
```

### 2. Create a branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-name
```

### 3. Set up the dev environment

See [SETUP.md](./SETUP.md) for full instructions. Quick version:

```bash
# Backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in GEMINI_API_KEY and JWT_SECRET

# Frontend
cd frontend && npm install && cd ..
```

---

## Running locally

**Terminal 1 — backend:**
```bash
source venv/bin/activate
python run_server.py
```

**Terminal 2 — frontend:**
```bash
cd frontend
npm start
```

---

## Key files

### Backend (`src/traceon/server/`)

| File | What it does |
|---|---|
| `app.py` | FastAPI app, CORS, startup/shutdown |
| `api.py` | All REST endpoints (`/analyze`, `/run`, `/generate`, `/explain`) |
| `session_manager.py` | In-memory session store + auto-cleanup |
| `ai_service.py` | Gemini code generation and explanation |
| `auth.py` | Google OAuth + JWT |
| `models.py` | Pydantic data models (requires Python 3.11+) |
| `mongo_store.py` | MongoDB persistence layer |
| `python_tracer.py` | Python step-by-step execution tracer |
| `java_tracer.py` | Java bytecode execution tracer |

### Frontend (`frontend/src/`)

| File | What it does |
|---|---|
| `App.js` | Root component — view routing, auth state, tab management |
| `theme.js` | Theme context (Light, Dark, Nord, Solarized, High Contrast) |
| `services/api.js` | Authenticated fetch wrapper, `REACT_APP_API_URL` base |
| `components/CppEditorPage.js` | Main editor + visualizer layout |
| `components/FlowVisualizer.js` | Call graph panel + variable cards |
| `components/CodeEditor.js` | Monaco editor wrapper |
| `components/AiExplanation.js` | Gemini explanation panel |
| `components/LandingPage.js` | Marketing landing page |

---

## Making changes

### Adding a backend endpoint

1. Add the route in `src/traceon/server/api.py`
2. Add any new request/response models in `src/traceon/server/models.py`
3. Call it from the frontend via `frontend/src/services/api.js`

### Adding a frontend component

1. Create `frontend/src/components/MyComponent.js`
2. Create `frontend/src/styles/MyComponent.css`
3. Import and use it in `App.js` or the relevant parent component

### Adding a language

1. Add a tracer in `src/traceon/server/` (follow `python_tracer.py` as a reference)
2. Register it in `api.py`'s language dispatch
3. Add the language option to the dropdown in `frontend/src/App.js`
4. Update the language list in `LandingPage.js` copy

---

## Testing

There are no automated tests yet. Test manually:

1. Load each built-in example and step through it
2. Write custom code in each language (C, C++, Python, Java)
3. Test AI Generate and AI Explain
4. Test Sign In / Sign Out flow
5. Check browser console (F12) for errors

**Example programs for each language:**

```cpp
// C++ — fibonacci
int fib(int n) { return n <= 1 ? n : fib(n-1) + fib(n-2); }
int main() { int x = fib(5); }
```

```python
# Python — list comprehension
nums = [1, 2, 3, 4, 5]
squares = [n * n for n in nums]
```

```java
// Java — loop
public class Main {
    public static void main(String[] args) {
        int sum = 0;
        for (int i = 1; i <= 5; i++) sum += i;
    }
}
```

---

## Submitting changes

### Commit message format

```
<type>: <short description>

<optional body>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `ci`

**Examples:**
```
feat: add Rust language support
fix: prevent AI explanation from truncating at 2048 tokens
docs: update SETUP.md with Java prerequisites
style: remove emojis from pricing page
```

### Creating a pull request

```bash
git push origin feature/your-feature-name
```

Then open a PR on GitHub. Include:
- What the change does
- How to test it
- Screenshots for UI changes

---

## Code style

### Python
- PEP 8
- Type hints on function signatures
- No bare `except:` — always catch a specific exception

### JavaScript / React
- Functional components with hooks (no class components)
- No PropTypes required — the codebase uses plain JS
- CSS custom properties (`var(--token)`) for all colors and spacing — no hardcoded hex values

### CSS
- All colors via CSS variables defined in `frontend/src/index.css`
- Per-component CSS files in `frontend/src/styles/`

---

## Getting help

- Check [README.md](./README.md) and [SETUP.md](./SETUP.md)
- Open a GitHub issue for bugs or feature requests
- Contact: nishantkumar19041@gmail.com
