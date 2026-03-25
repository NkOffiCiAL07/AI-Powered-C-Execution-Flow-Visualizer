# 🛠️ Setup & Installation Guide

Complete step-by-step guide to set up and run the AI-Powered C++ Code Flow Visualizer on your machine.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [System Requirements](#system-requirements)
3. [Installation Steps](#installation-steps)
4. [Running the Project](#running-the-project)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Make sure you have the following installed on your system:

### Required
- **Python 3.8+**
- **Node.js 14+** and **npm**
- **C++ Compiler** (clang++ or g++)
- **LLDB debugger**

### Recommended
- **Git** (for cloning the repository)
- **macOS** or **Linux** (tested environments)

---

## System Requirements

### macOS
All tools come pre-installed:
```bash
# Verify installations
python3 --version
node --version
npm --version
clang++ --version
lldb --version
```

### Linux (Ubuntu/Debian)
```bash
# Update package manager
sudo apt update

# Install Python
sudo apt install python3 python3-pip python3-venv

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs

# Install build tools
sudo apt install build-essential lldb clang llvm
```

### Linux (Fedora/RHEL)
```bash
# Install Python
sudo dnf install python3 python3-pip

# Install Node.js
sudo dnf install nodejs

# Install build tools
sudo dnf install gcc g++ clang lldb llvm-devel
```

### Windows (WSL2 Recommended)
```bash
# In WSL2 Ubuntu terminal
sudo apt update
sudo apt install python3 python3-pip python3-venv nodejs npm build-essential lldb clang
```

---

## Installation Steps

### Step 1: Clone the Repository

```bash
git clone https://github.com/NkOffiCiAL07/AI-Powered-C-Execution-Flow-Visualizer.git
cd AI-Powered-C-Execution-Flow-Visualizer
```

### Step 2: Set Up Backend Environment

#### Option A: Using Virtual Environment (Recommended)

```bash
# Create virtual environment
python3 -m venv venv

# Activate it
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

#### Option B: Using Conda

```bash
conda create -n flowviz python=3.9
conda activate flowviz
```

### Step 3: Install Backend Dependencies

```bash
# Make sure you're in the virtual environment
pip install --upgrade pip

# Install requirements
pip install -r requirements.txt
```

**Expected packages:**
- fastapi
- uvicorn
- pydantic
- python-multipart
- python-dotenv
- cors
- pymongo (optional, for MongoDB session history persistence)

### Step 4: Set Up Frontend

Navigate to frontend directory:

```bash
cd frontend

# Install Node dependencies
npm install

# Verify React installation
npm list react react-dom
```

<details>
<summary><strong>If npm install fails:</strong></summary>

```bash
# Clear npm cache
npm cache clean --force

# Remove package-lock.json and node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

</details>

### Step 5: Verify Installation

#### Backend Check
```bash
# Return to project root
cd ..

# Activate virtual environment
source venv/bin/activate  # macOS/Linux

# Check Python packages
pip list | grep fastapi

# Test import
python3 -c "import fastapi; print('FastAPI OK')"
```

#### Frontend Check
```bash
cd frontend

# Check Node version
node --version

# Check React
npm list react
```

#### Compiler Check
```bash
# Check C++ compiler
clang++ --version
# or
g++ --version

# Check LLDB
lldb --version
```

---

## Running the Project

### Option 1: Two-Terminal Setup (Recommended for Development)

**Terminal 1 - Backend:**
```bash
# From project root
source venv/bin/activate  # Activate virtual environment

# Start backend server
python run_server.py
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started server process [PID]
```

**Terminal 2 - Frontend:**
```bash
# From project root
cd frontend

# Start React dev server
npm start
```

**Expected output:**
```
webpack compiled successfully

Compiled successfully!

You can now view the app in your browser at:
  http://localhost:3000
```

### Option 2: Manual Server Start

If `run_server.py` doesn't work, start manually:

```bash
# From project root
source venv/bin/activate

# Set environment variable and run
PYTHONPATH=src python -m uvicorn src.flowviz.server.app:app --host 0.0.0.0 --port 8000 --reload
```

### Option 3: Docker (Optional)

If you prefer containerization:

```bash
# Build image
docker build -t flowviz .

# Run container
docker run -p 8000:8000 -p 3000:3000 flowviz
```

---

## Verification

### Step 1: Check Backend Health

```bash
# In a new terminal, with backend running
curl http://localhost:8000/health
```

**Expected response:**
```json
{"status":"ok"}
```

### Step 2: Open the App

1. Open your browser
2. Navigate to **http://localhost:3000**
3. You should see:
   - Left panel: Code editor
   - Right panel: Visualizer (empty initially)
   - Header: "Analyze & Run" button

### Step 3: Test with Example

1. Click **"Simple Math"** button
2. Click **"Analyze & Run"** button
3. You should see:
   - Code highlighted line by line
   - Variables updating on the right
   - Timeline at the bottom

---

## Troubleshooting

### Backend Issues

#### "Port 8000 already in use"
```bash
# macOS/Linux - Find process using port
lsof -i :8000

# Kill process
kill -9 <PID>

# Or use different port
PYTHONPATH=src python -m uvicorn src.flowviz.server.app:app --port 8001
```

#### "ModuleNotFoundError: No module named 'fastapi'"
```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

#### "LLDB not found"
```bash
# macOS
brew install lldb

# Ubuntu/Debian
sudo apt install lldb

# Fedora
sudo dnf install lldb
```

#### "Compilation failed" when running code
- Check code syntax
- Ensure all headers are valid C++
- Try a simple example first

### Frontend Issues

#### "npm: command not found"
```bash
# Install Node.js from https://nodejs.org/
# or use package manager:
brew install node  # macOS
sudo apt install nodejs npm  # Linux
```

#### "Port 3000 already in use"
```bash
# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Or let React choose a different port
cd frontend
PORT=3001 npm start
```

#### "Module not found" errors
```bash
# From frontend directory
rm -rf node_modules package-lock.json
npm install
npm start
```

### Connection Issues

#### Frontend can't connect to backend
1. Make sure backend is running on `http://localhost:8000`
2. Check CORS settings in `src/flowviz/server/app.py`
3. Check browser console for errors (F12 → Console)
4. Verify API URL in `frontend/src/services/api.js`

#### "Failed to fetch" errors
```bash
# Check if backend is running
curl http://localhost:8000/health

# Check API endpoint
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"code": "int x = 5;"}'
```

---

## Project Structure After Setup

```
.
├── venv/                    # Python virtual environment
├── frontend/
│   ├── node_modules/        # Node dependencies
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
├── src/
│   └── flowviz/
│       └── ...
├── examples/
├── README.md
├── SETUP.md                 # This file
├── requirements.txt
├── run_server.py
└── ...
```

---

## Development Workflow

### Making Changes to Backend

1. Backend auto-reloads with `--reload` flag
2. Make changes to files in `src/flowviz/`
3. Refresh browser to see changes

### Making Changes to Frontend

1. Frontend auto-reloads on save
2. Edit files in `frontend/src/`
3. Changes appear automatically in browser

### Adding New Examples

1. Create C++ file in `examples/`
2. Add to `EXAMPLE_CODES` in `frontend/src/App.js`
3. Add button to UI in `App.js`

---

## Performance Tips

1. **Close unused programs** — Free up memory for compilation
2. **Use small examples** — Start simple, increase complexity
3. **Adjust max-steps** — Reduce from 150 for faster execution
4. **Use Slow speed** — Default is 1500ms, good for learning

---

## Next Steps

1. ✅ Open http://localhost:3000
2. ✅ Try loading examples
3. ✅ Write your own C++ code
4. ✅ Step through execution
5. ✅ Explore variables at each step

---

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review error messages in browser console (F12)
3. Check terminal output for backend errors
4. Open an issue on GitHub

---

**You're all set! Happy coding! 🚀**
