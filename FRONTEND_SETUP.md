# 🚀 C Execution Flow Visualizer - Frontend UI

Interactive web-based visualization of C/C++ code execution with real-time variable tracking and animated state transitions.

## 🎯 Features

- **Live Code Editor** - Write and analyze C/C++ code in real-time
- **Animated Execution Flow** - Watch variables change as code executes step-by-step
- **Variable Tracking** - See all variables and their values at each execution step
- **Execution Timeline** - Interactive timeline of all execution steps with syntax highlighting
- **Detailed Output** - Expandable table showing detailed state at each step
- **Playback Controls** - Play, pause, step forward/backward through execution
- **Speed Control** - Adjust animation speed from 0.5x to 20x

## 📋 Prerequisites

### Backend
- Python 3.10+
- FastAPI
- pexpect
- LLDB or GDB debugger (macOS/Linux)

### Frontend
- Node.js 16+
- npm or yarn

## 🚀 Getting Started

### 1. Start the Backend Server

From the project root:

```bash
# Activate virtual environment (if created)
source venv/bin/activate

# Run the backend server (port 8000)
python3 run_server.py
```

The server should output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 3. Start the Frontend Development Server

```bash
npm start
```

The browser will automatically open at `http://localhost:3000`

## 📸 How to Use

1. **Enter C Code** - Paste or write C/C++ code in the left editor panel
2. **Click "Analyze & Run"** - The system will compile and execute your code
3. **View Execution Flow** - Watch the animated visualization of your code execution:
   - **📍 Current Location** - Shows the current file, line, and function
   - **📦 Variables** - Displays all variables in scope with their values
   - **📊 Execution Timeline** - Shows all executed steps (click to jump to any step)
4. **Control Playback**:
   - ⏮️ **Restart** - Go back to step 1
   - ▶️ **Play/Pause** - Start and stop the animation
   - ⬅️ **Previous** / **Next ➡️** - Step manually through execution
5. **Switch Views**:
   - **Execution Flow** - Animated visualization of variables changing
   - **Output & Details** - Detailed table with all execution information

## 🎨 UI Components

### Header
- Title and description
- "Analyze & Run" button with loading state
- Shows when analysis is in progress

### Code Editor (Left Panel)
- Textarea for C/C++ code
- Shows line count and character count
- Monospace syntax-friendly font

### Execution Flow Visualizer (Right Panel - Flow Tab)
- **Controls** - Play/pause, step navigation, speed adjustment
- **Step Indicator** - Current step with progress bar
- **Location Panel** - Current file, line number, function name
- **Variables Grid** - Interactive cards showing variables with animations
  - Variables that changed highlight in orange
  - Flash animation when values change
  - Shows previous value with transition arrow
- **Timeline** - Horizontal timeline of all steps
  - Click any step to jump
  - Completed steps turn green
  - Current step pulses blue
  - Hover for tooltip with step info

### Output Panel (Right Panel - Output & Details Tab)
- Expandable table of all execution steps
- Shows step number, line, function, variable count, changed variables
- Click row to expand and see detailed state
- Lists all variables and their values at that step

## 🎬 Animation Features

- **Variable Flash** - Changed variables flash in orange
- **Progress Bar** - Animated progress showing how far through execution you are
- **Timeline Pulse** - Current step pulses blue on the timeline
- **Smooth Transitions** - All value changes animate smoothly
- **Slide-in Effects** - Components smoothly appear

## 🛠️ Environment Variables

Create a `.env` file in the `frontend` directory (optional):

```env
REACT_APP_API_URL=http://localhost:8000
```

If not set, defaults to `http://localhost:5000`

## 🔧 Troubleshooting

### "Failed to connect to server"
- Ensure backend is running on `http://localhost:8000`
- Check that CORS is enabled on the server
- Look for error messages in browser console (F12)

### "Compilation failed"
- Check that your C code is valid
- Verify clang++ or g++ is installed
- Try simpler code snippets first

### "LLDB: command not found"
- Install LLDB: `brew install lldb` (macOS) or `apt install lldb` (Linux)
- LLDB is usually included with Xcode on macOS

### Frontend not loading
- Clear browser cache: Ctrl+F5 (Windows/Linux) or Cmd+Shift+R (macOS)
- Check that `npm install` completed successfully
- Try `npm start` again

## 📊 Example Code

Paste this into the editor to test:

```cpp
#include <iostream>

int factorial(int n) {
    int result = 1;
    for (int i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

int main() {
    int x = 5;
    int y = 10;
    int sum = x + y;
    
    std::string message = "Hello";
    
    for (int i = 0; i < 3; i++) {
        sum += i;
    }
    
    int fact = factorial(x);
    
    std::cout << "Sum: " << sum << std::endl;
    
    return 0;
}
```

Then click "Analyze & Run" and watch the animation!

## 🎯 Performance Tips

- **Large number of steps**: Increase animation speed to quickly see summary
- **Complex code**: Use timeline to jump between important steps
- **Deep nesting**: Variable tracker auto-scrolls to show all variables

## 📝 Keyboard Shortcuts (Future)

Planned shortcuts:
- `Space` - Play/Pause
- `Left/Right Arrow` - Previous/Next step
- `Home/End` - First/Last step

## 🤝 Architecture

```
Frontend (React)
  ↓ HTTP POST /analyze (C code)
  ↓
Backend (FastAPI)
  ↓ 
Compiler (clang++/g++)
  ↓
Debugger (LLDB/GDB)
  ↓ capture execution steps
Execution Timeline
  ↓ return snapshots
  ↓
Frontend displays animation
```

## 📚 Learn More

- [React Documentation](https://react.dev)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [LLDB Documentation](https://lldb.llvm.org/)
