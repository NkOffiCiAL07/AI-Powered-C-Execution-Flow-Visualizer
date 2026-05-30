import React, { useState, useEffect } from 'react';
import '../styles/BlogPage.css';

/* ─────────────────────────────────────────────────────────────────────────────
   SEO-targeted articles
   Each article targets a high-intent search query CS students / devs use.
───────────────────────────────────────────────────────────────────────────── */
const ARTICLES = [
  {
    id: 'cpp-execution-visualizer',
    slug: 'cpp-execution-visualizer',
    title: 'C++ Execution Visualizer: See Exactly How Your Code Runs',
    subtitle: 'Step through every line, watch every variable change, trace every function call — in real time.',
    category: 'Tools',
    readTime: '6 min read',
    date: 'May 2025',
    tags: ['C++', 'Debugging', 'Visualization'],
    icon: 'play_circle',
    excerpt: 'Most C++ developers learn by reading code. The best ones learn by watching it run. A C++ execution visualizer turns abstract pointer arithmetic and recursive calls into something you can actually see.',
    content: `
## What is a C++ Execution Visualizer?

A **C++ execution visualizer** is a tool that runs your C++ program step by step and shows you exactly what happens at each line — which variables change, how the call stack grows, and what the memory looks like at any point in time.

Instead of reading 200 lines of code and trying to hold the execution state in your head, you *watch* it. Every assignment, every function call, every loop iteration — visualized live.

This is how experienced engineers mentally model their programs. Traceon makes that mental model visible.

---

## Why Existing Debuggers Fall Short

Traditional debuggers like GDB or LLDB are powerful — but they're designed for experts. They require:

- Learning complex command syntaxes (\`next\`, \`step\`, \`info locals\`, \`bt\`)
- Manually tracking which variables matter
- Context-switching between terminal, editor, and output

For students or developers new to C++, this cognitive overhead gets in the way of actually understanding the bug.

A visual execution tracer removes all of that friction.

---

## What You Can See with Traceon

When you run a program in Traceon's execution visualizer, you get:

### 1. Variable Inspector — Live Changes
Every variable in scope is shown in a sidebar. When a value changes, it's highlighted in real time. You can see:
\`\`\`c
int arr[] = {5, 3, 8, 1};
// As bubble sort runs, watch arr[0], arr[1]... swap in real time
\`\`\`

### 2. Call Stack Trace
See the exact call stack at every step. When a recursive function calls itself, each new frame appears. When it returns, the frame disappears. No more guessing where you are in a deep call chain.

### 3. Execution Call Graph
A graphical node graph shows which functions called which, how many times, and in what order. Invaluable for understanding complex codebases.

### 4. AI Step Explanation
Click any step and Traceon's AI explains what just happened in plain English:
> *"Line 14: The variable \`temp\` was assigned the value of \`arr[j]\` (which is 8). This is the first step of swapping two elements in the array."*

### 5. Timeline Scrubber
Jump to any point in execution — forward or backward. Drag the scrubber to replay a section. No restarting the program.

---

## When is a C++ Execution Visualizer Most Useful?

**Learning pointers:** Pointer arithmetic is famously confusing. Seeing \`*ptr++\` move through memory visually makes it click instantly.

**Debugging off-by-one errors:** Watch the loop counter and array index side by side. The bug is obvious when you see it execute.

**Understanding recursion:** Watch the call stack grow and shrink as a recursive function like merge sort or Fibonacci runs.

**Tracing memory allocation:** See heap allocations appear when \`new\` is called and disappear when \`delete\` runs.

---

## Try It Right Now

Traceon's C++ execution visualizer runs entirely in your browser. Paste any C or C++ program, click **Analyze & Debug**, and watch it execute step by step.

No installation. No GDB knowledge required. Just write C++ and see it run.
    `,
  },

  {
    id: 'debug-c-code-online',
    slug: 'debug-c-code-online',
    title: 'How to Debug C Code Online — The Visual Approach',
    subtitle: 'Skip the GDB learning curve. Here\'s how to find and fix C bugs faster using an online visual debugger.',
    category: 'Tutorial',
    readTime: '7 min read',
    date: 'May 2025',
    tags: ['C', 'Debugging', 'Online Tools'],
    icon: 'bug_report',
    excerpt: 'Debugging C code is notoriously hard. Between null pointer dereferences, off-by-one errors, and memory corruption, even experienced developers spend hours on a single bug. Online visual debuggers change this.',
    content: `
## Why Debugging C is Hard

C gives you direct access to memory — which is powerful, but also means bugs can be silent and devastating. Common C bugs include:

- **Null pointer dereferences** — segfault with no obvious cause
- **Buffer overflows** — writing past an array's end, corrupting other variables
- **Off-by-one errors** — iterating one index too many or too few
- **Uninitialized variables** — undefined behavior that changes run to run
- **Memory leaks** — allocated memory never freed

Most of these bugs are *timing* bugs — the corrupted value was written three functions ago, but the crash happens now. Traditional print-based debugging (\`printf\`) makes you guess where the problem started.

---

## The Old Way: printf Debugging

Most beginners debug C like this:

\`\`\`c
void bubble_sort(int arr[], int n) {
    printf("entering bubble_sort, n=%d\\n", n);
    for (int i = 0; i < n - 1; i++) {
        printf("outer loop i=%d\\n", i);
        for (int j = 0; j < n - i - 1; j++) {
            printf("comparing arr[%d]=%d and arr[%d]=%d\\n", j, arr[j], j+1, arr[j+1]);
            if (arr[j] > arr[j+1]) {
                // swap
            }
        }
    }
}
\`\`\`

This works — but it clutters your code, produces walls of output, and still requires you to mentally trace the execution.

---

## The Visual Way: Debug C Code Online with Traceon

Traceon lets you **debug C code online** by showing you the execution visually:

### Step 1: Paste Your C Code
Open Traceon and paste your C program. You don't need to install anything or configure a compiler.

### Step 2: Click "Analyze & Debug"
Traceon compiles and instruments your code on the server, then runs it while capturing every state change.

### Step 3: Step Through Execution
Use the playback controls to go forward/backward through your program:
- **Step Forward (→)**: advance one line
- **Step Back (←)**: go back one step — something GDB makes very hard
- **Auto Play**: watch the execution at adjustable speed
- **Scrubber**: drag to any point in the execution timeline

### Step 4: Watch Variables Change
No need for printf. Every variable is shown in a live panel. When a value changes, it's highlighted in orange. You immediately see *what changed* and *when*.

### Step 5: Set Visual Breakpoints
Click any line number to set a breakpoint. When auto-play reaches that line, it pauses — just like a real debugger, but with a visual interface.

---

## Example: Finding an Off-by-One Bug

Say you have this buggy code:

\`\`\`c
int sum_array(int arr[], int n) {
    int total = 0;
    for (int i = 0; i <= n; i++) {  // bug: should be i < n
        total += arr[i];
    }
    return total;
}
\`\`\`

In Traceon, step through the loop iteration by iteration. You'll see \`i\` reach the value \`n\` — and you'll see \`arr[n]\` being read (which is out of bounds). The variable panel shows the garbage value being added to \`total\`. The bug is obvious.

With printf, you'd have to add prints everywhere. With Traceon, you just watch.

---

## What Makes Online C Debugging Different

| Feature | printf | GDB | Traceon |
|---------|--------|-----|---------|
| Setup required | None | Install + learn commands | None |
| See all variables at once | ❌ | Partial | ✅ |
| Step backward | ❌ | Limited | ✅ |
| Visual call stack | ❌ | Text only | ✅ |
| AI explains each step | ❌ | ❌ | ✅ |
| Works in browser | ✅ | ❌ | ✅ |

---

## Debug C Code Online — Right Now

Go to Traceon, paste your buggy C program, and click debug. No signup required to try a sample program.

See the bug in seconds, not hours.
    `,
  },

  {
    id: 'traceon-vs-python-tutor',
    slug: 'traceon-vs-python-tutor',
    title: 'Traceon vs Python Tutor: The Modern C/C++ Alternative',
    subtitle: 'Python Tutor is great — for Python. Here\'s why C and C++ developers need something better.',
    category: 'Comparison',
    readTime: '5 min read',
    date: 'May 2025',
    tags: ['Comparison', 'C++', 'Learning Tools'],
    icon: 'compare_arrows',
    excerpt: 'Python Tutor has helped millions of students visualize code execution. But if you write C or C++, you need a tool built for your language — with AI explanations, multi-file projects, and real debugging features.',
    content: `
## Python Tutor: A Great Tool with Real Limitations

[Python Tutor](https://pythontutor.com) (also called Online Python Tutor or visualize.com) is one of the most-used CS education tools in the world. It lets you step through Python, Java, and basic C code and see memory state visually.

But if you're writing C or C++ seriously, Python Tutor has significant gaps:

---

## The Limitations of Python Tutor for C/C++

### 1. C/C++ Support is Basic
Python Tutor's C visualization is minimal. It shows stack frames but misses many C++ constructs — templates, STL containers, complex pointer arithmetic, and class hierarchies aren't visualized well.

### 2. No AI Explanations
Python Tutor shows you *what* happened. It doesn't explain *why*. When you see a confusing state, you're on your own.

### 3. No Multi-File Projects
Real C/C++ code spans multiple files and headers. Python Tutor only handles single-file programs, which is fine for classroom exercises but useless for real codebases.

### 4. Dated Interface
Python Tutor's UI hasn't changed significantly in years. There's no dark mode, no keyboard shortcuts, no themes.

### 5. No Breakpoints
You can't set a visual breakpoint and say "pause execution here." You step through line by line from the beginning.

### 6. No Execution Call Graph
Python Tutor doesn't show you a graph of which functions called which. For understanding a codebase, this is critical.

---

## How Traceon Compares

| Feature | Python Tutor | Traceon |
|---------|-------------|---------|
| C/C++ support | Basic | Full (LLDB-based) |
| Python support | ✅ Excellent | ✅ |
| Java support | ✅ | ✅ |
| AI step explanation | ❌ | ✅ |
| Multi-file projects | ❌ | ✅ |
| Visual breakpoints | ❌ | ✅ |
| Step backward | ✅ | ✅ |
| Execution call graph | ❌ | ✅ |
| Timeline scrubber | ❌ | ✅ |
| Dark mode / themes | ❌ | ✅ (5 themes) |
| Memory spectrometer | ❌ | ✅ |
| Mobile-friendly | Partial | ✅ |

---

## When to Use Python Tutor

Python Tutor is still excellent for:
- Quick Python visualization in an educational setting
- Simple single-file programs
- Professors who have already integrated it into their curriculum

If you're teaching **Python basics**, Python Tutor is hard to beat.

---

## When to Use Traceon

Choose Traceon when you need:
- **Real C/C++ debugging** with full language support
- **AI explanations** of confusing execution steps
- **Multi-file project management** (save, reload, organize files)
- **A modern interface** that students actually want to use
- **Call graphs** and execution timelines for complex programs

---

## The Bottom Line

Python Tutor pioneered execution visualization for education. Traceon brings that idea forward — with AI, better C/C++ support, modern UI, and real debugging features.

If your stack is C, C++, or you want a more powerful tool for any language, Traceon is the modern Python Tutor alternative you've been waiting for.
    `,
  },

  {
    id: 'understanding-recursion-c',
    slug: 'understanding-recursion-c',
    title: 'Understanding Recursion in C: A Visual Step-by-Step Guide',
    subtitle: 'Recursion finally makes sense when you can watch the call stack grow and shrink in real time.',
    category: 'Tutorial',
    readTime: '8 min read',
    date: 'May 2025',
    tags: ['Recursion', 'C', 'Algorithms'],
    icon: 'account_tree',
    excerpt: 'Recursion is one of the hardest concepts to grasp from reading code alone. This guide uses live execution tracing to show exactly how recursive calls stack up — and unwind.',
    content: `
## Why Recursion Feels Confusing

Ask any CS student about their first encounter with recursion and you'll hear the same story: *"I understood the definition, I understood the base case, I could read the code — but I had no idea what was actually happening when it ran."*

The problem is that recursion is inherently a **dynamic** concept being explained with **static** text. Reading:

\`\`\`c
int factorial(int n) {
    if (n == 0) return 1;
    return n * factorial(n - 1);
}
\`\`\`

...tells you what the function does. It doesn't show you the five stack frames that exist simultaneously when you call \`factorial(5)\`, or how they unwind one by one as each returns its value.

That's what this guide is for.

---

## The Call Stack: What Actually Happens

When \`factorial(5)\` runs, here's what happens step by step:

\`\`\`
factorial(5) calls factorial(4)
  factorial(4) calls factorial(3)
    factorial(3) calls factorial(2)
      factorial(2) calls factorial(1)
        factorial(1) calls factorial(0)
          factorial(0) returns 1        ← base case
        factorial(1) returns 1 * 1 = 1  ← unwind begins
      factorial(2) returns 2 * 1 = 2
    factorial(3) returns 3 * 2 = 6
  factorial(4) returns 4 * 6 = 24
factorial(5) returns 5 * 24 = 120
\`\`\`

Each indentation level is a **stack frame** — a separate copy of the function with its own local variable \`n\`. Five calls deep means five stack frames exist simultaneously.

In Traceon, you can **see** all five frames in the call stack panel. As each returns, the frame disappears.

---

## Visualizing Fibonacci Recursion

Fibonacci is where recursion gets really interesting (and expensive):

\`\`\`c
int fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
}
\`\`\`

When you visualize \`fib(5)\` in Traceon:

1. The execution call graph shows a **tree** — every node is a function call, every edge is a recursive call
2. You can see \`fib(3)\` being computed **twice** — this is the redundant computation that makes naive Fibonacci O(2ⁿ)
3. The timeline scrubber lets you replay any subtree of the recursion

This is how students finally *get* why memoization matters. The duplicated subtrees are visually obvious.

---

## Tracing Merge Sort Recursively

Merge sort is the classic "divide and conquer" algorithm:

\`\`\`c
void merge_sort(int arr[], int left, int right) {
    if (left >= right) return;
    int mid = left + (right - left) / 2;
    merge_sort(arr, left, mid);
    merge_sort(arr, mid + 1, right);
    merge(arr, left, mid, right);
}
\`\`\`

When you step through this in Traceon with an array of 8 elements:

- **Phase 1 (Divide):** Watch the array get split in half repeatedly until every subarray has 1 element. The call stack grows to depth log₂(8) = 3.
- **Phase 2 (Conquer):** Watch the stack unwind as subarrays get merged back together, sorted.
- **Variable panel:** At each step, see exactly which slice of the array is being processed.

Understanding merge sort from a textbook takes hours. Watching it execute takes 10 minutes.

---

## Common Recursion Bugs — Visualized

### Bug 1: Missing Base Case
\`\`\`c
int factorial(int n) {
    return n * factorial(n - 1);  // no base case!
}
\`\`\`
In Traceon, you'll see the call stack grow indefinitely — until the stack overflow. The visual makes it immediately obvious what's happening.

### Bug 2: Wrong Return
\`\`\`c
int factorial(int n) {
    if (n == 0) return 1;
    factorial(n - 1);  // forgot to return!
    return n;
}
\`\`\`
Step through and watch the AI explain: *"This call to \`factorial(n-1)\` returns a value, but the caller doesn't use it. The function then returns \`n\` directly."*

---

## How to Use Traceon to Learn Recursion

1. **Start with factorial** — the simplest recursive function. Step through \`factorial(4)\` and watch the call stack panel.
2. **Count stack frames** — how many frames exist at the deepest point? That's your recursion depth.
3. **Watch the unwind** — after the base case returns, step forward and watch frames disappear.
4. **Try Fibonacci** — use the call graph to see the tree structure. Count how many times \`fib(2)\` is called.
5. **Tackle merge sort** — use the timeline scrubber to replay the divide phase and then the merge phase separately.

Recursion isn't magic. It's function calls. Once you can *see* the calls, it makes complete sense.
    `,
  },

  {
    id: 'c-pointers-visual-guide',
    slug: 'c-pointers-visual-guide',
    title: 'C Pointers Explained Visually: The Guide That Actually Works',
    subtitle: 'Pointers are simple once you can see addresses, values, and dereferencing happen live.',
    category: 'Tutorial',
    readTime: '9 min read',
    date: 'May 2025',
    tags: ['Pointers', 'C', 'Memory'],
    icon: 'memory',
    excerpt: 'Every C programmer hits the pointer wall. Textbooks explain them in theory, but something is lost between the explanation and actually writing pointer code. Visual execution tracing changes that.',
    content: `
## The Pointer Problem

Pointers are the #1 reason C beginners get stuck. Here's a typical textbook explanation:

*"A pointer is a variable that stores the memory address of another variable."*

You nod. You understand the words. Then you write:

\`\`\`c
int x = 10;
int *ptr = &x;
*ptr = 20;
\`\`\`

...and your mental model breaks down. What is \`ptr\`? What is \`*ptr\`? What is \`&x\`? The syntax is compact but carries enormous semantic weight.

A visual execution tracer makes it concrete.

---

## What a Pointer Actually Is

Let's start with the basics. In memory, every variable lives at an address:

\`\`\`c
int x = 42;
// x lives at, say, address 0x7fff5c (just a number)
// x's value is 42
\`\`\`

A pointer stores that address:
\`\`\`c
int *ptr = &x;
// ptr's value is 0x7fff5c (the address of x)
// *ptr dereferences: "go to address 0x7fff5c, read the int there" = 42
\`\`\`

When you step through this in Traceon's variable inspector, you see:
- **x**: value \`42\`, address \`0x7fff5c\`
- **ptr**: value \`0x7fff5c\` (the address of x), type \`int*\`

You can *see* that \`ptr\` holds a number — an address. Dereferencing means "go look at that address." That's all it is.

---

## Pointer Arithmetic — Made Visual

Pointer arithmetic is where most beginners lose the thread:

\`\`\`c
int arr[] = {10, 20, 30, 40, 50};
int *ptr = arr;   // ptr points to arr[0]

ptr++;             // ptr now points to arr[1]
printf("%d", *ptr); // prints 20
\`\`\`

Why does \`ptr++\` jump to \`arr[1]\` instead of \`arr[0] + 1\`?

Because incrementing a pointer adds **sizeof(int)** (4 bytes on most systems) — not 1. Pointers are typed, so arithmetic is scaled to the element size.

In Traceon, step through this code and watch:
1. \`ptr\` starts at address \`0x7fff00\` (arr[0])
2. After \`ptr++\`, it becomes \`0x7fff04\` (arr[0] + 4 bytes = arr[1])
3. \`*ptr\` reads from \`0x7fff04\` → value \`20\`

Seeing the address change by exactly 4 makes the "scaled arithmetic" rule permanently click.

---

## Pointers and Functions

The classic pass-by-value vs. pass-by-reference confusion:

\`\`\`c
// This doesn't work — passes a copy
void increment_wrong(int x) {
    x++;  // modifies the local copy only
}

// This works — passes the address
void increment_correct(int *x) {
    (*x)++;  // modifies the original
}

int main() {
    int val = 5;
    increment_wrong(val);   // val is still 5
    increment_correct(&val); // val is now 6
    return 0;
}
\`\`\`

Step through both versions in Traceon:

- In \`increment_wrong\`: watch the call stack. The function creates its own **copy** of \`x\`. When it returns, the copy disappears. \`val\` in main is unchanged.
- In \`increment_correct\`: the function receives the **address** of \`val\`. When \`(*x)++\` runs, you see \`val\` in main's stack frame update to \`6\` in real time.

This is the clearest demonstration of why pointers exist.

---

## Double Pointers (Pointer to Pointer)

\`\`\`c
int x = 10;
int *ptr = &x;
int **pptr = &ptr;

printf("%d", **pptr); // prints 10
\`\`\`

A double pointer stores the address of a pointer. It's used when a function needs to modify what a pointer points to — common in linked list implementations.

The mental model:
- \`pptr\` → address of \`ptr\`
- \`*pptr\` → the value of \`ptr\` (which is the address of \`x\`)
- \`**pptr\` → the value of \`x\` = 10

In Traceon, you see a chain: \`pptr\` → \`ptr\` → \`x\`. Each dereference step is a hop to a new address. Two hops → the final value.

---

## Common Pointer Bugs

### Dangling Pointer
\`\`\`c
int *ptr = malloc(sizeof(int));
*ptr = 42;
free(ptr);
// ptr still holds the old address — now invalid
printf("%d", *ptr); // undefined behavior
\`\`\`
Traceon shows \`ptr\` still holding the freed address. The AI explanation flags this as a dangling pointer dereference.

### NULL Dereference
\`\`\`c
int *ptr = NULL;
*ptr = 10; // segfault
\`\`\`
Step through and watch \`ptr = NULL\` (address 0) and then watch the program crash on dereference. The AI explains: *"Dereferencing a null pointer causes a segmentation fault because address 0 is not mapped to valid memory."*

---

## How to Use Traceon to Learn Pointers

1. **Start with a simple int pointer** — declare, assign, dereference. Watch addresses in the variable panel.
2. **Try pointer arithmetic with an array** — watch the address increment by 4 each time.
3. **Write a swap function** — pass two int pointers and watch both values change in main's frame.
4. **Build a linked list** — the hardest pointer use case. Watch \`next\` pointers chain through nodes.

Pointers aren't a barrier to C mastery. They're the key to it. And once you *see* them working, they're never confusing again.
    `,
  },
];

/* ─── Article Card ─────────────────────────────────────────────────────────── */
function ArticleCard({ article, onClick }) {
  return (
    <article className="blog-card" onClick={() => onClick(article)} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick(article)}>
      <div className="blog-card-top">
        <div className="blog-card-icon">
          <span className="material-symbols-outlined">{article.icon}</span>
        </div>
        <div className="blog-card-meta-row">
          <span className="blog-chip blog-chip--category">{article.category}</span>
          <span className="blog-card-read-time">
            <span className="material-symbols-outlined">schedule</span>
            {article.readTime}
          </span>
        </div>
      </div>
      <h2 className="blog-card-title">{article.title}</h2>
      <p className="blog-card-excerpt">{article.excerpt}</p>
      <div className="blog-card-footer">
        <div className="blog-card-tags">
          {article.tags.map(tag => (
            <span key={tag} className="blog-chip blog-chip--tag">{tag}</span>
          ))}
        </div>
        <span className="blog-read-more">
          Read article <span className="material-symbols-outlined">arrow_forward</span>
        </span>
      </div>
    </article>
  );
}

/* ─── Markdown-like renderer ────────────────────────────────────────────────── */
function renderContent(content) {
  const lines = content.trim().split('\n');
  const elements = [];
  let i = 0;
  let codeBuffer = [];
  let inCode = false;
  let codeLang = '';
  let tableBuffer = [];
  let inTable = false;
  let key = 0;

  const getKey = () => `el-${key++}`;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      if (!inCode) {
        inCode = true;
        codeLang = line.slice(3).trim();
        codeBuffer = [];
      } else {
        elements.push(
          <pre key={getKey()} className="blog-code-block">
            <div className="blog-code-lang">{codeLang || 'code'}</div>
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        );
        inCode = false;
        codeBuffer = [];
        codeLang = '';
      }
      i++;
      continue;
    }

    if (inCode) { codeBuffer.push(line); i++; continue; }

    // Table
    if (line.startsWith('|')) {
      if (!inTable) { inTable = true; tableBuffer = []; }
      tableBuffer.push(line);
      i++;
      // Peek ahead
      if (i >= lines.length || !lines[i].startsWith('|')) {
        // Render table
        const rows = tableBuffer.filter(r => !r.match(/^\|[-| ]+\|$/));
        elements.push(
          <div key={getKey()} className="blog-table-wrap">
            <table className="blog-table">
              <thead>
                <tr>{rows[0].split('|').filter(Boolean).map((cell, ci) =>
                  <th key={ci}>{cell.trim()}</th>)}</tr>
              </thead>
              <tbody>
                {rows.slice(1).map((row, ri) => (
                  <tr key={ri}>{row.split('|').filter(Boolean).map((cell, ci) =>
                    <td key={ci}>{cell.trim()}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        inTable = false;
        tableBuffer = [];
      }
      continue;
    }

    // HR
    if (line.trim() === '---') {
      elements.push(<hr key={getKey()} className="blog-hr" />);
      i++; continue;
    }

    // H2
    if (line.startsWith('## ')) {
      elements.push(<h2 key={getKey()} className="blog-article-h2">{line.slice(3)}</h2>);
      i++; continue;
    }

    // H3
    if (line.startsWith('### ')) {
      elements.push(<h3 key={getKey()} className="blog-article-h3">{line.slice(4)}</h3>);
      i++; continue;
    }

    // Empty line
    if (line.trim() === '') { i++; continue; }

    // Regular paragraph with inline formatting
    const formatted = line
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="blog-inline-code">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="blog-link">$1</a>');

    elements.push(
      <p key={getKey()} className="blog-article-p" dangerouslySetInnerHTML={{ __html: formatted }} />
    );
    i++;
  }

  return elements;
}

/* ─── Article Detail View ───────────────────────────────────────────────────── */
function ArticleDetail({ article, onBack, onTryTraceon }) {
  useEffect(() => {
    document.title = `${article.title} | Traceon`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => { document.title = 'Traceon'; };
  }, [article]);

  return (
    <div className="blog-article-view">
      {/* Back button */}
      <button className="blog-back-btn" onClick={onBack}>
        <span className="material-symbols-outlined">arrow_back</span>
        Back to Blog
      </button>

      <article className="blog-article">
        {/* Header */}
        <header className="blog-article-header">
          <div className="blog-article-meta">
            <span className="blog-chip blog-chip--category">{article.category}</span>
            <span className="blog-article-date">{article.date}</span>
            <span className="blog-card-read-time">
              <span className="material-symbols-outlined">schedule</span>
              {article.readTime}
            </span>
          </div>
          <h1 className="blog-article-title">{article.title}</h1>
          <p className="blog-article-subtitle">{article.subtitle}</p>
          <div className="blog-article-tags">
            {article.tags.map(tag => (
              <span key={tag} className="blog-chip blog-chip--tag">{tag}</span>
            ))}
          </div>
        </header>

        {/* Content */}
        <div className="blog-article-body">
          {renderContent(article.content)}
        </div>

        {/* CTA */}
        <div className="blog-article-cta">
          <div className="blog-cta-icon">
            <span className="material-symbols-outlined">play_circle</span>
          </div>
          <div className="blog-cta-text">
            <strong>Try it yourself in Traceon</strong>
            <p>Paste any C, C++, Python, or Java program and watch it execute step by step — for free.</p>
          </div>
          <button className="blog-cta-btn" onClick={onTryTraceon}>
            Open Traceon
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </article>
    </div>
  );
}

/* ─── Blog Page Root ────────────────────────────────────────────────────────── */
export default function BlogPage({ onSwitchView }) {
  const [activeArticle, setActiveArticle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState('All');

  const allTags = ['All', ...Array.from(new Set(ARTICLES.flatMap(a => a.tags)))];

  const filtered = ARTICLES.filter(a => {
    const matchesTag = activeTag === 'All' || a.tags.includes(activeTag);
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q) || a.tags.some(t => t.toLowerCase().includes(q));
    return matchesTag && matchesSearch;
  });

  useEffect(() => {
    document.title = activeArticle ? `${activeArticle.title} | Traceon` : 'Blog | Traceon';
    return () => { document.title = 'Traceon'; };
  }, [activeArticle]);

  if (activeArticle) {
    return (
      <ArticleDetail
        article={activeArticle}
        onBack={() => setActiveArticle(null)}
        onTryTraceon={() => onSwitchView('editor')}
      />
    );
  }

  return (
    <div className="blog-page">
      {/* Hero */}
      <div className="blog-hero">
        <div className="blog-hero-label">
          <span className="material-symbols-outlined">article</span>
          Resources & Tutorials
        </div>
        <h1 className="blog-hero-title">Learn Smarter, Debug Faster</h1>
        <p className="blog-hero-sub">
          Guides on C, C++, recursion, pointers, and visual debugging — written for developers who want to actually understand what their code is doing.
        </p>

        {/* Search */}
        <div className="blog-search-wrap">
          <span className="material-symbols-outlined blog-search-icon">search</span>
          <input
            className="blog-search-input"
            type="text"
            placeholder="Search articles…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="blog-search-clear" onClick={() => setSearchQuery('')}>
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        {/* Tag filters */}
        <div className="blog-tags-row">
          {allTags.map(tag => (
            <button
              key={tag}
              className={`blog-tag-btn${activeTag === tag ? ' active' : ''}`}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="blog-content">
        {filtered.length === 0 ? (
          <div className="blog-empty">
            <span className="material-symbols-outlined">search_off</span>
            <p>No articles match "<strong>{searchQuery}</strong>"</p>
            <button className="blog-tag-btn" onClick={() => { setSearchQuery(''); setActiveTag('All'); }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className="blog-grid">
            {filtered.map(article => (
              <ArticleCard key={article.id} article={article} onClick={setActiveArticle} />
            ))}
          </div>
        )}

        {/* SEO footer note */}
        <div className="blog-seo-strip">
          <span className="material-symbols-outlined">tips_and_updates</span>
          Traceon is a free online C/C++ execution visualizer and debugger. No installation required.
          <button className="blog-seo-cta" onClick={() => onSwitchView('editor')}>
            Try it free →
          </button>
        </div>
      </div>
    </div>
  );
}
