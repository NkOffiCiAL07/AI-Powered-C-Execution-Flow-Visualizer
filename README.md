# 🚀 AI-Powered C++ Code Flow Visualizer

An intelligent debugging and visualization tool that automatically executes C/C++ programs step-by-step using LLDB debugger and presents execution flow with variable tracking in a beautiful, interactive web UI.

**Live Step-Through Execution** • **Real-Time Variable Tracking** • **AI-Generated Explanations** • **Interactive Timeline**

---

## ✨ Features

### 🎯 Core Capabilities
- ✅ **Compile Any C/C++ Code** — Auto-wraps snippets without main()
- ✅ **Step-by-Step Execution** — Trace through code line by line
- ✅ **Real-Time Variable Tracking** — See all variables and their values
- ✅ **Execution Timeline** — Click any step to jump directly to it
- ✅ **Beautiful Web UI** — Modern, responsive interface with animations
- ✅ **Edit Code Anytime** — Switch between playback and edit modes
- ✅ **Multiple Examples** — Pre-loaded examples (Simple Math, Loops, Fibonacci)
- ✅ **Auto-Format Errors** — Clear, helpful compilation error messages

### 🎨 UI Enhancements
- Modern gradient backgrounds and shadows
- Smooth animations and transitions
- Color-coded variable cards
- Progress bar with visual feedback
- Responsive layout (40% editor, 60% visualizer)
- Bubble animations for variable changes

---

## 🏗️ Architecture

```
User Code (C/C++)
    ↓
Auto-wrap if no main() + Auto-include headers
    ↓
Compile (clang++ or g++)
    ↓
LLDB Debugger (step-by-step execution)
    ↓
Start Session + Store First Snapshot
    ↓
`Next` / `Back` API calls fetch one step at a time
  ↓
Optional MongoDB persistence for code + history metadata
    ↓
React Frontend (visualization & playback)
```

---

## 💻 Tech Stack

### Backend
- **Python 3.8+** — FastAPI web framework
- **LLDB** — Debugger for C/C++ execution
- **clang++/g++** — Compiler with debug symbols

### Frontend
- **React 18** — UI framework
- **CSS3** — Modern styling with gradients & animations
- **JavaScript ES6+** — Interactive controls

### Development
- **FastAPI** — RESTful API
- **CORS** — Cross-origin requests
- **Subprocess** — C++ compilation & debugging

---

## 📦 Installation & Setup

### Prerequisites
Ensure you have the following installed:

```bash
# Check Python version
python3 --version  # Should be 3.8+

# Check if clang++ is installed
clang++ --version

# Or g++
g++ --version

# Check if lldb is installed
lldb --version
```

On macOS, everything is typically included. On Linux:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install build-essential lldb

# Fedora
sudo dnf install gcc g++ clang lldb
```

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/NkOffiCiAL07/AI-Powered-C-Execution-Flow-Visualizer.git
cd AI-Powered-C-Execution-Flow-Visualizer
```

### 2. Set Up Backend

#### Option A: Virtual Environment (Recommended)
```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt
```

#### Option B: Direct Install
```bash
pip install fastapi uvicorn python-dotenv pydantic cors
```

### 3. Set Up Frontend

```bash
cd frontend

# Install Node dependencies
npm install

# (Optional) Check if React is set up
npm list react
```

### 4. Start the Backend Server
```bash
# From project root, with virtual environment activated
python run_server.py

# Or with explicit port
PYTHONPATH=src python -m uvicorn src.flowviz.server.app:app --host 0.0.0.0 --port 8000 --reload
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started server process [12345]
```

### 5. Start the Frontend Server
```bash
cd frontend

# Start React development server
npm start
```

**Expected output:**
```
webpack compiled successfully
Compiled successfully!

You can now view the app in your browser at:
  http://localhost:3000
```

---

## 🎮 Using the App

### In Your Browser
1. Open **[http://localhost:3000](http://localhost:3000)**
2. You'll see:
   - **Left Panel** — Code editor
   - **Right Panel** — Execution visualizer

### Workflow

#### Writing Code
- Type C/C++ code in the left editor
- Code can be complete programs or snippets (no main() needed)
- Supported: variables, loops, conditionals, functions, vectors, strings

#### Running Code
1. Click **"Analyze & Run"** button in the header
2. Backend compiles and starts a debug session
3. Click **Next ▶** to fetch each step from the API in real time
4. Execution state appears on the right showing:
   - Current line (➤ arrow)
   - Variables at that step
   - Step count and progress bar
   - Plain-English explanation

#### Controls
- **◀ Back / Next ▶** — API-driven manual step navigation
- **Timeline click** — Jump among already-recorded steps
- **✏️ Edit Code** — Exit playback, switch to editing mode

### Optional MongoDB persistence
If you want to persist input code + step history metadata, set:

```bash
export MONGO_CONNECTION_STRING="mongodb+srv://..."
export MONGO_DB_NAME="flowviz"                 # optional
export MONGO_COLLECTION_NAME="execution_sessions"  # optional
```

#### Loading Examples
Click any example button:
- **Simple Math** — Basic arithmetic
- **Counting Loop** — Loop variable tracking
- **If Statement** — Conditional execution
- **🔢 Fibonacci** — Complex example with functions

---

## 📁 Project Structure

```
.
├── README.md                          # This file
├── requirements.txt                   # Python dependencies
├── run_server.py                      # Backend server entry point
│
├── frontend/                          # React UI
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js                    # Main app component
│   │   ├── App.css                   # App styling
│   │   ├── index.js
│   │   ├── index.css
│   │   ├── components/
│   │   │   ├── CodeEditor.js         # Code input/viewer
│   │   │   ├── FlowVisualizer.js     # Main visualizer
│   │   │   ├── ExecutionTimeline.js  # Timeline component
│   │   │   ├── VariableTracker.js    # Variable display
│   │   │   ├── OutputPanel.js        # Output view
│   │   │   └── Header.js             # Header with buttons
│   │   ├── services/
│   │   │   └── api.js                # API calls to backend
│   │   └── styles/
│   │       ├── CodeEditor.css
│   │       ├── FlowVisualizer.css
│   │       ├── VariableTracker.css
│   │       ├── ExecutionTimeline.css
│   │       ├── OutputPanel.css
│   │       └── Header.css
│   ├── package.json
│   └── package-lock.json
│
├── src/                               # Python backend
│   └── flowviz/
│       ├── __init__.py
│       ├── cli.py                    # CLI interface
│       ├── executor.py               # Execution controller
│       ├── models.py                 # Data models
│       ├── gdb_controller.py         # GDB MI control
│       ├── lldb_controller.py        # LLDB MI control
│       └── server/
│           ├── __init__.py
│           ├── app.py                # FastAPI application ⭐ IMPROVED
│           ├── api.py                # API endpoints
│           ├── session_manager.py    # Session management
│           └── models.py             # Pydantic models
│
├── examples/                          # Example C++ programs
│   ├── simple.cpp
│   ├── functions_example.cpp
│   └── simple_gdb.cpp
│
└── build/                             # Compiled binaries (generated)
```

---

## 🔧 API Endpoints

### POST `/analyze` — Compile & Execute Code

**Request:**
```json
{
  "code": "int x = 5; int y = 10; int z = x + y;"
}
```

**Response:**
```json
{
  "snapshots": [
    {
      "step": 1,
      "location": {"file": "...", "line": 23, "function": "main"},
      "variables": {"x": "5"},
      "changed_variables": ["x"]
    },
    ...
  ],
  "total_steps": 45
}
```

### GET `/health` — Health Check

Returns `{"status": "ok"}` if backend is running.

---

## 🐛 Troubleshooting

### "Compilation failed" Error
**Issue:** Code has syntax errors  
**Solution:** Check error message, fix code, try again

### "LLDB not found"
**Issue:** LLDB debugger not installed  
**Solution:**
```bash
# macOS
brew install lldb

# Linux (Debian)
sudo apt install lldb

# Linux (Fedora)
sudo dnf install lldb
```

### Port Already in Use
**Issue:** Port 8000 or 3000 is already in use  
**Solution:**
```bash
# Find and kill process on port 8000
lsof -i :8000
kill -9 <PID>

# Or use different ports
PYTHONPATH=src python -m uvicorn src.flowviz.server.app:app --port 8001
# Update frontend API_BASE_URL in src/services/api.js
```

### No Variables Shown
**Issue:** LLDB may not be capturing local variables  
**Solution:** Ensure code compiles with `-g` flag (automatic in this project)

---

## 🎓 Example Code Snippets

### Simple Loop
```cpp
for (int i = 0; i < 5; i++) {
    cout << i << endl;
}
```

### Array Operations
```cpp
int arr[] = {10, 20, 30};
int sum = 0;
for (int i = 0; i < 3; i++) {
    sum += arr[i];
}
```

### String Manipulation
```cpp
string name = "John";
string greeting = "Hello, " + name;
cout << greeting << endl;
```

### Vector Usage
```cpp
vector<int> nums = {1, 2, 3, 4, 5};
for (int num : nums) {
    cout << num << " ";
}
```

---

## 📈 Recent Improvements (v1.1)

### Compiler Enhancements
- ✅ Auto-wrap code snippets without `main()` function
- ✅ Auto-include common headers (`iostream`, `vector`, `string`, `cmath`)
- ✅ Fallback compiler support (clang++ → g++)
- ✅ Better error messages with clear formatting

### UI/UX Improvements
- ✅ Modern gradient backgrounds and shadows
- ✅ Edit Code button to switch modes
- ✅ Reset playback on example load
- ✅ Improved button styling with hover effects
- ✅ Better error display with warning icon
- ✅ Progress bar with glow effect
- ✅ Responsive layout

---

## 📝 License

This project is licensed under the MIT License. See LICENSE file for details.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

---

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the maintainers.

---

**Happy Debugging! 🎉**
