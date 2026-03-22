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

### 2. Install Dependencies
pip install -r requirements.txt

### 3. Ensure GDB is Installed
  gdb --version

If not installed:
  sudo apt install gdb
