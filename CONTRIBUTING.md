# 🤝 Contributing Guide

Thank you for your interest in contributing to the AI-Powered C++ Code Flow Visualizer! This document provides guidelines for contributing to the project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Making Changes](#making-changes)
5. [Testing](#testing)
6. [Submitting Changes](#submitting-changes)
7. [Coding Standards](#coding-standards)

---

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain a positive community

---

## Getting Started

### 1. Fork the Repository

```bash
# Click "Fork" on GitHub
git clone https://github.com/YOUR_USERNAME/AI-Powered-C-Execution-Flow-Visualizer.git
cd AI-Powered-C-Execution-Flow-Visualizer
```

### 2. Create a Branch

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Or bugfix branch
git checkout -b bugfix/your-bug-name
```

### 3. Set Up Development Environment

See [SETUP.md](./SETUP.md) for detailed instructions.

```bash
# Activate virtual environment
source venv/bin/activate

# Install development dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..
```

---

## Development Setup

### Run Both Servers

**Terminal 1 - Backend:**
```bash
source venv/bin/activate
python run_server.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### Development Tools

- **IDE:** VSCode recommended
- **Python Formatter:** black (optional)
- **Linter:** pylint/flake8 (optional)
- **Git Hook:** pre-commit (optional)

---

## Making Changes

### Backend Changes

**Location:** `src/flowviz/`

#### Key Files
- `server/app.py` — FastAPI application & `/analyze` endpoint
- `executor.py` — Execution timeline collection
- `lldb_controller.py` — LLDB debugger control
- `models.py` — Data models

#### Example: Adding a New Feature

1. **Create feature branch:**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Implement changes:**
   ```python
   # In src/flowviz/server/app.py
   @app.post("/new-endpoint")
   def new_endpoint(request: NewRequest):
       # Your code here
       pass
   ```

3. **Test locally:**
   ```bash
   # Run backend and test with curl
   curl -X POST http://localhost:8000/new-endpoint \
     -H "Content-Type: application/json" \
     -d '{"key": "value"}'
   ```

### Frontend Changes

**Location:** `frontend/src/`

#### Key Files
- `App.js` — Main app component, routing
- `components/` — React components
- `services/api.js` — API calls
- `styles/` — CSS files

#### Example: Adding a New Component

1. **Create component file:**
   ```bash
   touch frontend/src/components/NewComponent.js
   ```

2. **Implement component:**
   ```jsx
   import React from "react";
   import "../styles/NewComponent.css";

   export default function NewComponent({ prop1, prop2 }) {
     return (
       <div className="new-component">
         {/* Your JSX here */}
       </div>
     );
   }
   ```

3. **Add styling:**
   ```bash
   touch frontend/src/styles/NewComponent.css
   ```

4. **Import in App.js:**
   ```jsx
   import NewComponent from "./components/NewComponent";
   ```

5. **Use in component:**
   ```jsx
   <NewComponent prop1={value1} prop2={value2} />
   ```

---

## Testing

### Manual Testing

1. **Test with examples:**
   - Load each pre-made example
   - Verify playback works
   - Check variable tracking

2. **Test with custom code:**
   - Simple snippets (no main)
   - Complete programs
   - Edge cases (empty, complex)

3. **Test error handling:**
   - Syntax errors
   - Compilation errors
   - Runtime errors

### Example Test Cases

```cpp
// Test 1: Simple arithmetic (no main)
int x = 5;
int y = 10;
int z = x + y;

// Test 2: Loop with update
vector<int> nums = {1, 2, 3};
int sum = 0;
for (int n : nums) {
    sum += n;
}

// Test 3: Conditional logic
int age = 15;
string status;
if (age >= 18) {
    status = "adult";
} else {
    status = "minor";
}
```

### Browser Testing

- Test in Chrome, Firefox, Safari
- Check responsive design (resize window)
- Verify mobile layout (DevTools)
- Check console for errors (F12 → Console)

---

## Submitting Changes

### 1. Commit Your Changes

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add new feature description"
# or
git commit -m "fix: describe the bug fix"
# or
git commit -m "docs: update documentation"
```

### Commit Message Convention

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style (no logic change)
- `refactor:` Code restructuring
- `perf:` Performance improvement
- `test:` Tests

**Examples:**
```
feat(compiler): auto-wrap code snippets

fix(ui): correct variable card layout

docs(readme): add setup instructions

style(css): improve button styling
```

### 2. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 3. Create a Pull Request

1. Go to GitHub
2. Click "Compare & pull request"
3. Fill in PR title and description
4. Reference related issues (e.g., `Fixes #123`)
5. Click "Create pull request"

### 4. PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation update
- [ ] Performance improvement

## Testing
Describe how you tested this:
- [ ] Tested with example code
- [ ] Tested with custom code
- [ ] All examples still work

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed changes
- [ ] Tested in browser
- [ ] No new warnings/errors
- [ ] Documentation updated

## Related Issues
Closes #123
```

---

## Coding Standards

### Python

- **Style:** PEP 8
- **Line length:** 100 characters
- **Imports:** Alphabetical order
- **Docstrings:** For all functions

```python
def compile_and_trace(c_code: str, user_input: str = "") -> dict:
    """
    Compile C code and trace execution.
    
    Args:
        c_code: C/C++ source code
        user_input: Standard input for program
        
    Returns:
        Dictionary with compilation result and trace
        
    Raises:
        ValueError: If code is invalid
    """
    pass
```

### JavaScript/React

- **Style:** Airbnb style guide
- **Components:** Functional components with hooks
- **Props:** PropTypes or TypeScript
- **CSS:** BEM naming convention

```jsx
import React, { useState } from "react";
import PropTypes from "prop-types";
import "./MyComponent.css";

function MyComponent({ title, onAction }) {
  const [state, setState] = useState(null);

  const handleClick = () => {
    setState(true);
    onAction?.();
  };

  return (
    <div className="my-component">
      <h1 className="my-component__title">{title}</h1>
      <button
        className="my-component__btn"
        onClick={handleClick}
      >
        Click me
      </button>
    </div>
  );
}

MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
  onAction: PropTypes.func,
};

MyComponent.defaultProps = {
  onAction: null,
};

export default MyComponent;
```

### CSS

- **BEM Convention:** `.block__element--modifier`
- **Colors:** Use CSS variables from `:root`
- **Responsive:** Mobile-first approach

```css
.my-component {
  display: flex;
  gap: 16px;
}

.my-component__title {
  font-size: 18px;
  color: var(--text-primary);
}

.my-component__btn {
  padding: 10px 16px;
  background: var(--accent-blue);
  border: none;
  border-radius: 6px;
}

.my-component__btn:hover {
  background: var(--accent-blue-dark);
}

@media (max-width: 768px) {
  .my-component {
    flex-direction: column;
  }
}
```

---

## Common Tasks

### Add a New Example

1. **Create C++ file:**
   ```bash
   cat > examples/my_example.cpp << 'EOF'
   // Your code here
   EOF
   ```

2. **Add to App.js:**
   ```jsx
   const EXAMPLE_CODES = {
     // ... existing examples
     myExample: `// Your code here`,
   };
   ```

3. **Add button to UI:**
   ```jsx
   <button
     className={`example-btn ${selectedExample === "myExample" ? "active" : ""}`}
     onClick={() => handleLoadExample("myExample")}
   >
     My Example
   </button>
   ```

### Update API Endpoint

1. **Modify `/analyze` endpoint in `src/flowviz/server/app.py`**
2. **Update request/response models in `src/flowviz/server/models.py`**
3. **Update frontend API call in `frontend/src/services/api.js`**
4. **Update component to use new data in `frontend/src/components/`**

### Performance Optimization

- Profile with browser DevTools (F12 → Performance)
- Check backend response time (Network tab)
- Optimize render with React DevTools
- Use memoization for expensive components

---

## Getting Help

- **Documentation:** Check README.md and SETUP.md
- **Issues:** Look for similar GitHub issues
- **Discussions:** Join project discussions
- **Contact:** Reach out to maintainers

---

## Recognition

Contributors will be recognized in:
- README.md contributors section
- GitHub contributors page
- Release notes

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT).

---

**Welcome to the project! Happy coding! 🚀**
