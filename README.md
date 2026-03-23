# 🚀 AI-Powered C++ Code Flow Visualizer (GDB-Based)

An intelligent debugging and visualization tool that automatically executes C++ programs step-by-step using GDB and presents execution flow with variable tracking and AI-generated insights.

---

## 🧩 Overview

This project combines:
- ⚙️ **GDB (GNU Debugger)** for execution
- 🧠 **AI layer** for explanations
- 🎨 **Visualization layer** for interactive understanding

It eliminates the need for manual debugging by automatically stepping through code and showing how variables change over time.

---

## 🎯 Features

- ✅ Automatic step-by-step execution  
- ✅ GDB integration (step in / step over / step out)  
- ✅ Real-time variable tracking  
- ✅ Execution timeline (state snapshots)  
- ✅ AI-based explanation of variable changes  
- ✅ CLI-based visualization (MVP)  
- 🚧 Web UI with animations (future)  

---

## 🏗️ Architecture

C++ Code + Input
↓
Compile with Debug Symbols (-g)
↓
GDB (MI Mode)
↓
Execution Controller
↓
State Extractor
↓
AI Explanation Layer
↓
Visualizer (CLI / Web)



## ⚙️ Tech Stack

### Core
- C++
- GDB (GNU Debugger)

### Backend
- Python (for controlling GDB + parsing output)

### AI Layer
- LLM API (optional)

### Frontend (Future)
- React
- D3.js / Framer Motion

---

## 📦 Installation

### 1. Clone Repository
```bash
git clone https://github.com/your-username/cpp-flow-visualizer.git
cd cpp-flow-visualizer
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Ensure GDB is Installed
```bash
gdb --version
```

If not installed:
```bash
sudo apt install gdb
```

---

## ▶️ Run the MVP

### 1. Compile sample C++ with debug symbols
```bash
mkdir -p build
g++ -g examples/simple.cpp -o build/simple
```

### 2. Run flow visualizer
```bash
PYTHONPATH=src python main.py build/simple --max-steps 50
```

Default backend is LLDB (recommended on macOS).

Use GDB explicitly if needed:
```bash
PYTHONPATH=src python main.py build/simple --backend gdb
```

### 3. Interactive stepping mode
```bash
PYTHONPATH=src python main.py build/simple --interactive
```

---

## 📁 Current Project Structure

```text
.
├── README.md
├── MVP.md
├── requirements.txt
├── main.py
├── examples/
│   └── simple.cpp
└── src/
    └── flowviz/
        ├── __init__.py
        ├── cli.py
        ├── executor.py
        ├── gdb_controller.py
        └── models.py
```

---

## ✅ Current MVP Status

- Implemented: GDB MI control, step execution, variable extraction, timeline snapshots, CLI rendering.
- Deferred: AI explanations and web UI.
