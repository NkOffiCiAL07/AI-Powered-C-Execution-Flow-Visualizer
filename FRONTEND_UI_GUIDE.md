# 🎯 Frontend UI - Debug Values Animation

## Overview

The frontend UI is now complete with full animated visualization of C/C++ code execution. Variables change in real-time as the code executes step by step, with smooth animations highlighting what changed.

## ✨ What's New - Frontend Components

### 6 New React Components
1. **Header** - Navigation with Analyze button
2. **CodeEditor** - Code input with line/char count
3. **FlowVisualizer** - Main animated visualization
4. **VariableTracker** - Variable display with animations
5. **ExecutionTimeline** - Interactive step timeline
6. **OutputPanel** - Detailed execution table

### 9 New CSS Files
- Professional dark theme with gradients
- Smooth animations and transitions
- Responsive grid layouts
- Interactive cards and buttons
- Color-coded variable tracking

## 🎬 Animation Features

### Variable Changes Flash
When a variable's value changes, it:
- Highlights in **orange**
- Flashes with animated glow effect
- Shows the **previous value** with arrow
- Gets a pulsing **"NEW"** badge

### Timeline Animation
- **Blue pulse** on current step
- **Green checkmark** for completed steps
- Click any step to jump to that point
- Hovers show step details

### Smooth Playback
- **Auto-play** starts automatically
- **Play/Pause** controls
- **Speed adjustment** (0.5x to 20x)
- **Step navigation** (Previous/Next)
- **Restart** to go back to beginning

## 🚀 Getting Started with Frontend

### 1. Start Backend Server
```bash
python3 run_server.py
```
Server runs on: `http://localhost:8000`

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 3. Start Frontend Dev Server
```bash
npm start
```
Opens automatically at: `http://localhost:3000`

## 📊 What You'll See

### Live Example
Paste this C++ code and click "Analyze & Run":

```cpp
#include <iostream>

int main() {
    int x = 5;
    int y = 10;
    int sum = x + y;
    
    std::cout << "Sum: " << sum << std::endl;
    
    return 0;
}
```

### Animation Shows:
1. **Step 1** - x changes from uninitialized → 5 (flashes orange)
2. **Step 2** - y changes from uninitialized → 10 (flashes orange)
3. **Step 3** - sum changes from uninitialized → 15 (flashes orange)
4. Each step shows current line and function
5. Timeline at bottom updates as you progress

## 🎮 Playback Controls

### Buttons
- **⏮️ Restart** - Go to step 1
- **▶️ Play** - Start animation (changes to ⏸️)
- **⏸️ Pause** - Stop animation
- **⬅️ Prev** - Previous step
- **Next ➡️** - Next step

### Speed Control
Slider adjusts animation speed:
- Left = faster (up to 20x)
- Right = slower (down to 0.5x)
- Shows multiplier (e.g., "2x")

## 📋 Tabs

### Execution Flow Tab (Default)
- **📍 Location Panel** - Current file, line, function
- **📦 Variables** - All variables with animated cards
- **📊 Timeline** - Interactive step timeline

### Output & Details Tab
- **Table view** - All steps with metadata
- **Expandable rows** - Click to see full details
- **Variable list** - All values at that step
- **Changed indicators** - Shows what changed

## 🎨 Visual Feedback

### Variable Cards
- **Blue titles** - Variable names
- **Dark backgrounds** - Current values
- **Orange borders** - Just changed
- **Flash animation** - When changing
- **Arrows & badges** - Show transitions

### Timeline
- **Blue dot with glow** - Current step (pulsing)
- **Green dots** - Completed steps
- **Gray dots** - Future steps
- **Hover tooltips** - Step info

### Progress Bar
- **Blue to purple gradient fill**
- **Animates as execution progresses**
- **Shows percentage complete**

## 🔧 Technical Details

### Backend Integration
- **Endpoint**: `POST /analyze`
- **Input**: C code string
- **Output**: JSON with execution snapshots
- **Format**: 
  ```json
  {
    "snapshots": [
      {
        "step": 1,
        "location": {"file": "...", "line": 10, "function": "main"},
        "variables": {"x": "5", "y": "10"},
        "changed_variables": ["x"]
      },
      ...
    ],
    "total_steps": 50
  }
  ```

### Animation Loop
```javascript
1. User clicks "Analyze & Run"
2. Code sent to backend
3. Backend compiles and debugs
4. Returns snapshots
5. Frontend creates timer
6. Every ~500ms: next step
7. State updates trigger re-render
8. CSS animations play
9. Loop until end or user pauses
```

## 💡 Tips for Best Results

### Good Test Cases
```cpp
// Simple arithmetic
int main() {
    int a = 5;
    int b = 3;
    int c = a + b;
    return 0;
}

// With loop
int main() {
    int sum = 0;
    for (int i = 1; i <= 5; i++) {
        sum += i;
    }
    return 0;
}

// With function
int add(int x, int y) { return x + y; }
int main() {
    int result = add(3, 4);
    return 0;
}
```

### Speed Tips
- Use **faster speed** (left slider) for long executions
- Use **slower speed** (right slider) to study details
- Use **Manual stepping** (Prev/Next) for deep analysis

## 🐛 Troubleshooting

### Frontend Won't Load
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
npm start
```

### API Connection Error
- Check backend is running: `curl http://localhost:8000/health`
- Check CORS is enabled (it is!)
- Check frontend URL: `http://localhost:3000`

### Code Won't Compile
- Use valid C/C++ code
- Include necessary headers (`#include <iostream>`)
- Test with simple code first
- Check compiler output in browser console

### No Variables Show
- Some optimizations hide variables
- Use `-O0` flag (already set)
- Use `stdout` to debug
- Test with simpler code

## 📚 Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/          # 6 React components
│   │   ├── Header.js
│   │   ├── CodeEditor.js
│   │   ├── FlowVisualizer.js
│   │   ├── VariableTracker.js
│   │   ├── ExecutionTimeline.js
│   │   └── OutputPanel.js
│   ├── styles/              # 7 CSS files
│   │   ├── Header.css
│   │   ├── CodeEditor.css
│   │   ├── FlowVisualizer.css
│   │   ├── VariableTracker.css
│   │   ├── ExecutionTimeline.css
│   │   └── OutputPanel.css
│   ├── services/
│   │   └── api.js          # API client
│   ├── App.js              # Main component
│   ├── App.css             # Layout styles
│   ├── index.js            # React entry
│   └── index.css           # Global theme
├── package.json
└── .env                    # (optional) API URL config

src/flowviz/server/
├── app.py                  # FastAPI app with ✨ NEW /analyze endpoint
├── api.py                  # Session APIs
├── models.py               # Pydantic models
└── session_manager.py      # Session management
```

## 🎓 Learning Path

1. **Start Simple** - Run demo example
2. **Try Loops** - Understand variable iterations
3. **Add Functions** - See function calls
4. **Complex Logic** - Try conditionals
5. **Debug Mode** - Use pause to inspect

## 🚀 Performance Notes

- Works smoothly with up to **150 steps**
- **Auto-optimized** rendering
- **GPU-accelerated** animations
- **Responsive** on all screen sizes

## 🔮 Next Steps

Planned enhancements:
- [ ] Syntax highlighting in editor
- [ ] Line number indicators
- [ ] Code highlighting during execution
- [ ] Memory visualizer (heap/stack)
- [ ] Call stack visualization
- [ ] Keyboard shortcuts
- [ ] Export execution data
- [ ] Share visualization URLs
- [ ] Theme switcher

## 💬 Questions?

Check:
1. [FRONTEND_SETUP.md](./FRONTEND_SETUP.md) - Setup instructions
2. [FRONTEND_IMPLEMENTATION.md](./FRONTEND_IMPLEMENTATION.md) - Technical details
3. Browser console (F12) - Error messages
4. Terminal output - Backend logs

---

**Now you can visually debug C code! 🎉**

Start the backend, start the frontend, paste code, and watch it execute with live variable tracking!
