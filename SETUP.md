# Traceon — Local Setup Guide

Complete step-by-step guide to run Traceon on your machine.

---

## Prerequisites

| Tool | Minimum version | Required for |
|---|---|---|
| Python | 3.11+ | Backend |
| Node.js | 18+ | Frontend |
| npm | 9+ | Frontend |
| clang / gcc | any | C/C++ compilation |
| lldb | any | C/C++ step debugging |
| Java JDK | 17+ | Java execution |

### macOS

```bash
# Xcode tools include clang, gcc, and lldb
xcode-select --install

# Java
brew install openjdk@17

# Verify
python3 --version   # 3.11+
node --version      # 18+
clang++ --version
lldb --version
java --version
```

### Ubuntu / Debian

```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv
sudo apt install build-essential clang lldb
sudo apt install default-jdk

# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs
```

### Fedora / RHEL

```bash
sudo dnf install python3 python3-pip
sudo dnf install gcc-c++ clang lldb
sudo dnf install java-17-openjdk
sudo dnf install nodejs
```

### Windows (WSL2)

```bash
# In WSL2 Ubuntu terminal
sudo apt update
sudo apt install python3 python3-pip python3-venv nodejs npm
sudo apt install build-essential clang lldb default-jdk
```

---

## Installation

### 1. Clone

```bash
git clone https://github.com/NkOffiCiAL07/AI-Powered-C-Execution-Flow-Visualizer.git
cd AI-Powered-C-Execution-Flow-Visualizer
```

### 2. Backend — Python environment

```bash
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Backend — environment variables

Create a `.env` file in the project root:

```env
# Required — get free key at aistudio.google.com
GEMINI_API_KEY=your_gemini_api_key

# Required — any long random string
JWT_SECRET=change_this_to_a_long_random_secret

# Google OAuth — needed for Sign In with Google
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_secret

# OAuth callback (change to your domain in production)
OAUTH_REDIRECT_URI=http://localhost:8000/auth/google/callback
FRONTEND_ORIGIN=http://localhost:3000

# MongoDB — optional, omit to use in-memory session storage
MONGO_CONNECTION_STRING=mongodb+srv://user:pass@cluster.mongodb.net/
MONGO_DB_NAME=traceon
MONGO_COLLECTION_NAME=execution_sessions
```

### 4. Frontend

```bash
cd frontend
npm install
cd ..
```

---

## Running locally

Open two terminals from the project root.

**Terminal 1 — backend**

```bash
source venv/bin/activate
python run_server.py
```

Expected output:
```
INFO:     Started server process
INFO:     Uvicorn running on http://127.0.0.1:8000
```

**Terminal 2 — frontend**

```bash
cd frontend
npm start
```

Expected output:
```
Compiled successfully!
You can now view the app in your browser at:
  http://localhost:3000
```

Open **http://localhost:3000** in your browser.

---

## Verify everything works

```bash
# Backend health
curl http://localhost:8000/health
# → {"status":"ok"}

# MongoDB connection (if configured)
curl http://localhost:8000/health/db
# → {"mongo_connected":true}
```

In the browser:
1. Select a language (C, C++, Python, Java)
2. Write a short program or click an example
3. Click **Analyze** — execution steps should appear on the right

---

## Docker (alternative to local setup)

If you prefer not to install compilers locally:

```bash
# Build the image (includes GCC, LLDB, Java JDK)
docker build -t traceon .

# Run backend
docker run -p 8000:8000 \
  -e GEMINI_API_KEY=your_key \
  -e JWT_SECRET=your_secret \
  traceon

# Run frontend separately (outside Docker)
cd frontend && npm start
```

---

## Troubleshooting

### `ImportError: cannot import name 'StrEnum'`
Python 3.10 or older is being used. Upgrade to Python 3.11+.

```bash
python3 --version       # must be 3.11+
which python3           # check which binary is being used
```

### `Port 8000 already in use`
```bash
lsof -i :8000 | awk 'NR>1 {print $2}' | xargs kill -9
```

### `LLDB not found`
```bash
# macOS
xcode-select --install

# Ubuntu
sudo apt install lldb
```

### `ModuleNotFoundError: No module named 'fastapi'`
Virtual environment is not activated:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Frontend can't connect to backend
1. Confirm the backend is running: `curl http://localhost:8000/health`
2. Check `frontend/src/services/api.js` — `API_BASE_URL` should resolve to `http://localhost:8000`
3. The `"proxy"` field in `frontend/package.json` handles this automatically in dev mode

### `npm install` fails
```bash
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## Project structure

```
.
├── run_server.py                  # Entry point — reads HOST/PORT/RELOAD from env
├── requirements.txt
├── Dockerfile                     # python:3.12-slim + GCC + LLDB + Java
├── .env                           # Local secrets (not committed)
├── .env.example                   # Template
│
├── src/traceon/server/
│   ├── app.py                     # FastAPI app + CORS + lifespan
│   ├── api.py                     # All REST endpoints
│   ├── session_manager.py         # Session store + auto-cleanup
│   ├── ai_service.py              # Gemini generation & explanation
│   ├── auth.py                    # Google OAuth + JWT
│   ├── models.py                  # Pydantic models (requires Python 3.11+)
│   ├── mongo_store.py             # MongoDB persistence
│   ├── python_tracer.py           # Python execution tracer
│   └── java_tracer.py             # Java execution tracer
│
├── frontend/
│   ├── package.json               # "proxy": "http://localhost:8000"
│   ├── vercel.json                # Vercel build config
│   └── src/
│       ├── App.js
│       ├── theme.js
│       ├── services/api.js        # REACT_APP_API_URL base URL
│       ├── components/
│       └── styles/
│
└── .github/workflows/
    └── deploy-frontend.yml        # Auto-deploys frontend to Vercel on push
```
