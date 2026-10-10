import React, { useState, useEffect, useRef } from "react";
import LoginModal from "./LoginModal";
import "../styles/LandingPage.css";

// ── Multi-Scenario Live Studio Simulation Presets ──
const SIM_PRESETS = {
  fibonacci: {
    id: "fibonacci",
    label: "Recursive Fibonacci",
    file: "traceon-studio / algorithms / fibonacci.cpp",
    promptCmd: "$ ./fibonacci",
    code: [
      { ln: 1, text: "#include <iostream>" },
      { ln: 2, text: "" },
      { ln: 3, text: "int fibonacci(int n) {" },
      { ln: 4, text: "    if (n <= 1) return n;" },
      { ln: 5, text: "    // Recursive tree traversal" },
      { ln: 6, text: "    return fibonacci(n - 1) + fibonacci(n - 2);" },
      { ln: 7, text: "}" },
      { ln: 8, text: "" },
      { ln: 9, text: "int main() {" },
      { ln: 10, text: "    int n = 4;" },
      { ln: 11, text: "    int result = fibonacci(n);" },
      { ln: 12, text: "    std::cout << \"Result: \" << result << \"\\n\";" },
      { ln: 13, text: "    return 0;" },
      { ln: 14, text: "}" },
    ],
    frames: [
      {
        step: 1,
        line: 10,
        title: "main() entry · Allocate n",
        activeNode: "main",
        stack: ["main()"],
        memory: [
          { addr: "0x7ffee140", name: "n", val: "4", mutated: true },
          { addr: "0x7ffee144", name: "result", val: "uninit", mutated: false },
          { addr: "0x7ffee148", name: "rbp", val: "0x7ffee180", mutated: false },
          { addr: "0x7ffee14c", name: "ret_addr", val: "0x100003f2", mutated: false },
        ],
        stdout: "⚡ Initializing Traceon execution engine...\n[info] Compiling main.cpp with -O0 -g (g++ 14.2)",
        time: "0.2ms",
      },
      {
        step: 2,
        line: 11,
        title: "Call fibonacci(4) · Push Frame",
        activeNode: "fib(4)",
        stack: ["main()", "fib(4)"],
        memory: [
          { addr: "0x7ffee140", name: "n", val: "4", mutated: false },
          { addr: "0x7ffee128", name: "n (arg)", val: "4", mutated: true },
          { addr: "0x7ffee12c", name: "caller_sp", val: "0x7ffee140", mutated: true },
          { addr: "0x7ffee130", name: "flags", val: "0x00000001", mutated: false },
        ],
        stdout: "→ Calling fibonacci(n = 4)\n[stack] Pushed frame #1 at 0x7ffee128",
        time: "0.8ms",
      },
      {
        step: 3,
        line: 6,
        title: "Branch: fibonacci(3) · Depth 2",
        activeNode: "fib(3)",
        stack: ["main()", "fib(4)", "fib(3)"],
        memory: [
          { addr: "0x7ffee128", name: "n (arg)", val: "4", mutated: false },
          { addr: "0x7ffee110", name: "n (arg)", val: "3", mutated: true },
          { addr: "0x7ffee114", name: "depth", val: "2", mutated: true },
          { addr: "0x7ffee118", name: "branch", val: "LEFT", mutated: true },
        ],
        stdout: "→ Branching left: fibonacci(3)\n[tree] Spawning DAG node 'fib(3)'",
        time: "1.4ms",
      },
      {
        step: 4,
        line: 6,
        title: "Branch: fibonacci(2) · Base Reachable",
        activeNode: "fib(2)",
        stack: ["main()", "fib(4)", "fib(3)", "fib(2)"],
        memory: [
          { addr: "0x7ffee110", name: "n (arg)", val: "3", mutated: false },
          { addr: "0x7ffee0f0", name: "n (arg)", val: "2", mutated: true },
          { addr: "0x7ffee0f4", name: "depth", val: "3", mutated: true },
          { addr: "0x7ffee0f8", name: "stack_use", val: "96 bytes", mutated: true },
        ],
        stdout: "→ Branching left: fibonacci(2)\n[analyzer] Subproblem overlap detected at n=2 (O(2ⁿ))",
        time: "2.1ms",
      },
      {
        step: 5,
        line: 4,
        title: "Base hit (n <= 1) · Stack Unwind",
        activeNode: "fib(1)",
        stack: ["main()", "fib(4)", "fib(3)"],
        memory: [
          { addr: "0x7ffee0f0", name: "return", val: "1", mutated: true },
          { addr: "0x7ffee110", name: "sum_accum", val: "1", mutated: true },
          { addr: "0x7ffee128", name: "pending", val: "fib(2)", mutated: true },
          { addr: "0x7ffee140", name: "n", val: "4", mutated: false },
        ],
        stdout: "✓ Base condition hit (n=1 <= 1) → return 1\n[stack] Popping frame #3. Unwinding to fib(3)",
        time: "2.5ms",
      },
      {
        step: 6,
        line: 12,
        title: "Execution Complete · Result = 3",
        activeNode: "main",
        stack: ["main()"],
        memory: [
          { addr: "0x7ffee140", name: "n", val: "4", mutated: false },
          { addr: "0x7ffee144", name: "result", val: "3", mutated: true },
          { addr: "0x7ffee148", name: "exit_code", val: "0", mutated: true },
          { addr: "0x7ffee14c", name: "mem_leaks", val: "0 bytes", mutated: true },
        ],
        stdout: "Result: 3\n\n════════════════════════════════════\n✓ Process finished with exit code 0\n⚡ Total execution time: 2.8ms · 0 memory leaks",
        time: "2.8ms",
      },
    ],
  },
  pointer: {
    id: "pointer",
    label: "Pointer Rewiring",
    file: "traceon-studio / pointers / list_reverse.cpp",
    promptCmd: "$ ./reverse_list",
    code: [
      { ln: 1, text: "struct Node { int val; Node* next; };" },
      { ln: 2, text: "" },
      { ln: 3, text: "Node* reverseList(Node* head) {" },
      { ln: 4, text: "    Node* prev = nullptr;" },
      { ln: 5, text: "    Node* curr = head;" },
      { ln: 6, text: "    while (curr != nullptr) {" },
      { ln: 7, text: "        Node* nxt = curr->next;" },
      { ln: 8, text: "        curr->next = prev; // swing pointer" },
      { ln: 9, text: "        prev = curr;" },
      { ln: 10, text: "        curr = nxt;" },
      { ln: 11, text: "    }" },
      { ln: 12, text: "    return prev;" },
      { ln: 13, text: "}" },
    ],
    frames: [
      {
        step: 1,
        line: 4,
        title: "Init pointers · prev = nullptr, curr = 0x600003a0",
        activeNode: "main",
        stack: ["reverseList()"],
        memory: [
          { addr: "0x7ffee140", name: "prev", val: "nullptr (0x0)", mutated: true },
          { addr: "0x7ffee148", name: "curr", val: "0x600003a0", mutated: true },
          { addr: "0x600003a0", name: "Node[1].val", val: "10", mutated: false },
          { addr: "0x600003a8", name: "Node[1].next", val: "0x600003b0", mutated: false },
        ],
        stdout: "⚡ Initializing pointer rewiring...\n[heap] Head node at 0x600003a0 (val=10) points to 0x600003b0",
        time: "0.3ms",
      },
      {
        step: 2,
        line: 7,
        title: "Save forward pointer · nxt = 0x600003b0",
        activeNode: "fib(4)",
        stack: ["reverseList()"],
        memory: [
          { addr: "0x7ffee140", name: "prev", val: "nullptr (0x0)", mutated: false },
          { addr: "0x7ffee148", name: "curr", val: "0x600003a0", mutated: false },
          { addr: "0x7ffee150", name: "nxt", val: "0x600003b0", mutated: true },
          { addr: "0x600003a8", name: "Node[1].next", val: "0x600003b0", mutated: false },
        ],
        stdout: "→ Saving forward link: nxt = curr->next (0x600003b0)\n[spectrometer] Preserving downstream list integrity",
        time: "0.7ms",
      },
      {
        step: 3,
        line: 8,
        title: "Swing curr->next = prev (nullptr)",
        activeNode: "fib(3)",
        stack: ["reverseList()"],
        memory: [
          { addr: "0x7ffee140", name: "prev", val: "nullptr (0x0)", mutated: false },
          { addr: "0x7ffee148", name: "curr", val: "0x600003a0", mutated: false },
          { addr: "0x600003a8", name: "Node[1].next", val: "0x0 (NULL)", mutated: true },
          { addr: "0x600003b0", name: "Node[2].val", val: "20", mutated: false },
        ],
        stdout: "✓ Pointer inverted: Node[1]->next is now 0x0\n[hardware] In-place mutation · 0 auxiliary heap bytes",
        time: "1.1ms",
      },
      {
        step: 4,
        line: 9,
        title: "Advance sliding window: prev = curr, curr = nxt",
        activeNode: "fib(2)",
        stack: ["reverseList()"],
        memory: [
          { addr: "0x7ffee140", name: "prev", val: "0x600003a0", mutated: true },
          { addr: "0x7ffee148", name: "curr", val: "0x600003b0", mutated: true },
          { addr: "0x7ffee150", name: "nxt", val: "0x600003c0", mutated: true },
          { addr: "0x600003a0", name: "rev_head", val: "0x600003a0", mutated: true },
        ],
        stdout: "→ Pointers shifted to Node[2] at 0x600003b0\n[telemetry] Iteration 1 concluded · Reversal progressing",
        time: "1.6ms",
      },
    ],
  },
  segfault: {
    id: "segfault",
    label: "Segfault Autopsy",
    file: "traceon-studio / memory / null_deref.cpp",
    promptCmd: "$ ./null_deref",
    code: [
      { ln: 1, text: "#include <iostream>" },
      { ln: 2, text: "struct UserRecord {" },
      { ln: 3, text: "    int id;" },
      { ln: 4, text: "    char name[32];" },
      { ln: 5, text: "};" },
      { ln: 6, text: "int main() {" },
      { ln: 7, text: "    UserRecord* rec = nullptr;" },
      { ln: 8, text: "    // Unchecked memory dereference" },
      { ln: 9, text: "    std::cout << rec->id << \"\\n\";" },
      { ln: 10, text: "    return 0;" },
      { ln: 11, text: "}" },
    ],
    frames: [
      {
        step: 1,
        line: 7,
        title: "Allocate pointer rec = nullptr (0x0)",
        activeNode: "main",
        stack: ["main()"],
        memory: [
          { addr: "0x7ffee140", name: "rec", val: "0x00000000", mutated: true },
          { addr: "0x7ffee148", name: "rbp", val: "0x7ffee180", mutated: false },
          { addr: "0x7ffee14c", name: "rip", val: "0x100003f0", mutated: false },
          { addr: "0x00000000", name: "NULL_PAGE", val: "PROT_NONE", mutated: false },
        ],
        stdout: "⚡ Process started PID 49102\n[stack] Allocated pointer rec at 0x7ffee140 (value: 0x0)",
        time: "0.2ms",
      },
      {
        step: 2,
        line: 9,
        title: "CRASH: SIGSEGV · Offset +0 on 0x0",
        activeNode: "fib(4)",
        stack: ["main()", "CRASH"],
        memory: [
          { addr: "0x7ffee140", name: "rec", val: "0x00000000", mutated: false },
          { addr: "0x00000000", name: "FAULT_ADDR", val: "0x00000000", mutated: true },
          { addr: "0x7ffee14c", name: "rip", val: "0x100003f8", mutated: true },
          { addr: "CR2", name: "Page Fault", val: "READ_FAIL", mutated: true },
        ],
        stdout: "💥 Fatal Signal SIGSEGV (Address boundary error)\n[hardware] Faulting instruction: mov eax, dword ptr [rax]\n[autopsy] Dereference of nullptr at offset +0 (UserRecord::id)",
        time: "0.6ms",
      },
      {
        step: 3,
        line: 9,
        title: "AI Autopsy · Root Cause & Remediation",
        activeNode: "fib(3)",
        stack: ["AI Autopsy"],
        memory: [
          { addr: "AI Audit", name: "Bug Class", val: "CWE-476 Null Deref", mutated: true },
          { addr: "Remedy 1", name: "Null Guard", val: "if (rec != nullptr)", mutated: true },
          { addr: "Remedy 2", name: "Smart Pointer", val: "std::unique_ptr", mutated: true },
          { addr: "Safety Score", name: "Memory Health", val: "CRITICAL FAIL", mutated: true },
        ],
        stdout: "🤖 AI Execution Autopsy:\n→ Root Cause: rec pointer was initialized to nullptr on line 7 and never allocated.\n→ Solution: Enclose in `if (rec != nullptr)` or allocate with `std::make_unique<UserRecord>()`.",
        time: "1.1ms",
      },
    ],
  },
};

const ALGO_TABS = [
  {
    id: "fib",
    name: "Recursive Fibonacci",
    lang: "C++20",
    badge: "Tree DAG",
    complexity: "O(2ⁿ) Time · O(N) Stack",
    summary: "Visualizes recursion branch splits, exponential stack frame growth, and overlapping subproblem branches.",
    snippet: `int fib(int n) {\n    if (n <= 1) return n;\n    // Exponential recursive branch\n    return fib(n - 1) + fib(n - 2);\n}`,
  },
  {
    id: "sort",
    name: "QuickSort Partition",
    lang: "C++20",
    badge: "Divide & Conquer",
    complexity: "O(N log N) Avg · O(1) Space",
    summary: "Watch in-place pivot partitioning, dual pointer index convergence, and recursive array swaps.",
    snippet: `int partition(int arr[], int low, int high) {\n    int pivot = arr[high];\n    int i = (low - 1);\n    for (int j = low; j < high; j++) {\n        if (arr[j] < pivot) swap(arr[++i], arr[j]);\n    }\n    swap(arr[i + 1], arr[high]);\n    return (i + 1);\n}`,
  },
  {
    id: "bst",
    name: "Binary Search Tree",
    lang: "C17",
    badge: "Heap Pointers",
    complexity: "O(log N) Time · O(N) Heap",
    summary: "Inspect dynamic malloc allocations, left/right pointer dereferencing, and hierarchical branching.",
    snippet: `struct Node* insert(struct Node* node, int key) {\n    if (node == NULL) return newNode(key);\n    if (key < node->key) node->left = insert(node->left, key);\n    else if (key > node->key) node->right = insert(node->right, key);\n    return node;\n}`,
  },
  {
    id: "segfault",
    name: "Segfault / Double-Free",
    lang: "C17",
    badge: "Memory Guard",
    complexity: "O(1) Detection · Instant Crash",
    summary: "Instant post-mortem autopsy for dangling pointers, use-after-free, and null-pointer boundary violations.",
    snippet: `void corruptMemory() {\n    int* ptr = (int*)malloc(sizeof(int));\n    free(ptr);\n    // Catastrophic Double-Free violation\n    free(ptr);\n}`,
  },
];

const FAQ_ITEMS = [
  {
    q: "How does Traceon execute code in the browser with sub-200ms latency?",
    a: "Traceon connects your browser to high-performance ephemeral execution containers instrumented with native LLDB and Clang 18. Each run executes in an isolated sandbox with resource bounds, captures register-level instruction diffs and silicon memory deltas, and streams back structured telemetry in under 180ms.",
  },
  {
    q: "Is my proprietary code and input data kept private?",
    a: "Yes, absolutely. Code is compiled in temporary sandboxes that are wiped immediately after process termination. We do not persist your code to disk, do not train public AI models on your private snippets, and employ zero-knowledge execution protocols.",
  },
  {
    q: "Can I debug multi-file C++ projects with custom headers?",
    a: "Yes! Traceon's Quad Studio includes a full multi-file project workspace (.cpp and .h). You can create separate compilation units, #include custom headers, and trace cross-file function calls with unified call graphs.",
  },
  {
    q: "How is Traceon's AI different from standard ChatGPT or Copilot?",
    a: "Generic AI chatbots only see static text and frequently hallucinate pointer states. Traceon's AI engine is fed the active runtime telemetry: the compiler AST, LLDB register states, the exact byte address where memory faulted, and call stack history. It performs deterministic post-mortems grounded in binary truth.",
  },
  {
    q: "Does Traceon support modern C++ standards and the Standard Template Library (STL)?",
    a: "Full support for C++20, C17, Python 3.12, and Java 21, including standard library headers (<vector>, <unordered_map>, <memory>, <algorithm>, <iostream>).",
  },
];

export default function LandingPage({ onStart, onSwitchView, onLogin, onSignIn, user, serverDown }) {
  const [activePresetKey, setActivePresetKey] = useState("fibonacci");
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeAlgoTab, setActiveAlgoTab] = useState("fib");
  const [openFaq, setOpenFaq] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const playTimerRef = useRef(null);

  const activePreset = SIM_PRESETS[activePresetKey] || SIM_PRESETS.fibonacci;
  const frames = activePreset.frames;
  const frame = frames[currentFrameIdx] || frames[0];

  // Auto-stepping simulation timer
  useEffect(() => {
    if (!isPlaying) {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
      return;
    }
    playTimerRef.current = setInterval(() => {
      setCurrentFrameIdx((idx) => (idx + 1) % frames.length);
    }, 2400);

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, frames.length]);

  const handleSelectPreset = (key) => {
    setActivePresetKey(key);
    setCurrentFrameIdx(0);
    setIsPlaying(false);
  };

  const handleNextStep = () => {
    setIsPlaying(false);
    setCurrentFrameIdx((idx) => (idx + 1) % frames.length);
  };

  const handlePrevStep = () => {
    setIsPlaying(false);
    setCurrentFrameIdx((idx) => (idx - 1 + frames.length) % frames.length);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentFrameIdx(0);
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const toggleFaq = (idx) => {
    setOpenFaq((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="quantum-landing-page">
      {/* Background Matrix Grid */}
      <div className="landing-grid-matrix" />

      {/* Dynamic Spectral Aurora Mesh Orbs */}
      <div className="ambient-aurora-glow aura-1" aria-hidden="true" />
      <div className="ambient-aurora-glow aura-2" aria-hidden="true" />
      <div className="ambient-aurora-glow aura-3" aria-hidden="true" />

      {/* ── Floating Liquid Glass Navbar ── */}
      <header className="landing-nav-container">
        <nav className="landing-nav-glass" aria-label="Main Navigation">
          <div className="nav-brand-group" onClick={onStart}>
            <div className="nav-logo-icon">
              <span className="material-symbols-outlined">account_tree</span>
            </div>
            <span className="nav-brand-title">Traceon</span>
            <span className="nav-version-pill">v2.4 Quantum</span>
          </div>

          <div className="nav-links-row">
            <a href="#simulator" className="nav-link-item">Studio Quad</a>
            <a href="#architecture" className="nav-link-item">Architecture</a>
            <a href="#features" className="nav-link-item">Capabilities</a>
            <a href="#comparison" className="nav-link-item">Comparison</a>
            <a href="#algorithms" className="nav-link-item">Playground</a>
            <a href="#faq" className="nav-link-item">FAQ</a>
            <button className="nav-link-item" onClick={() => onSwitchView && onSwitchView("docs")}>Docs</button>
            <button className="nav-link-item" onClick={() => onSwitchView && onSwitchView("pricing")}>Pricing</button>
          </div>

          <div className="nav-actions-group">
            {user && user.role !== "guest" ? (
              <button
                className="nav-signin-btn"
                onClick={() => onSwitchView && onSwitchView("dashboard")}
              >
                Dashboard
              </button>
            ) : (
              <button
                className="nav-signin-btn"
                onClick={onSignIn ? onSignIn : () => setShowLoginModal(true)}
              >
                Sign In
              </button>
            )}

            <button className="nav-cta-btn" onClick={onStart}>
              <span>Launch Studio</span>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
            </button>
          </div>
        </nav>
      </header>

      {/* ── Hero Section ── */}
      <section className="landing-hero">
        <div className="hero-pill-badge">
          <span className="material-symbols-outlined hero-pill-sparkle">auto_awesome</span>
          <span className="hero-pill-desktop">Traceon 2.4 — Quantum Developer Studio · Apple visionOS & Linear Architecture</span>
          <span className="hero-pill-mobile">Traceon 2.4 · Quantum Developer Studio</span>
        </div>

        <h1 className="hero-main-headline">
          See Code Execute.<br />
          <span className="hero-gradient-text">Frame by Frame.</span><br />
          Byte by Byte.
        </h1>

        <p className="hero-description">
          The AI-powered execution visualizer and real-time debugger for C, C++, Python, and Java. Step through recursion trees, map silicon RAM addresses in real-time, and diagnose algorithmic bottlenecks with AI insights.
        </p>

        <div className="hero-cta-row">
          <button className="hero-primary-cta" onClick={onStart}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>play_circle</span>
            <span>Launch Free Studio</span>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
          </button>
          <a href="#simulator" className="hero-secondary-cta">
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#38BDF8" }}>visibility</span>
            <span>Try Live Interactive Stepping</span>
          </a>
        </div>

        {/* Language Conduits */}
        <div className="hero-language-conduit">
          <span className="lang-chip cpp">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>code</span>
            <span>C++20</span>
          </span>
          <span className="lang-chip c">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>terminal</span>
            <span>C17</span>
          </span>
          <span className="lang-chip python">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>data_object</span>
            <span>Python 3.12</span>
          </span>
          <span className="lang-chip java">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>coffee</span>
            <span>Java 21</span>
          </span>
          <span className="lang-chip feature">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>speed</span>
            <span>Sub-200ms Tracing</span>
          </span>
          <span className="lang-chip feature">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>verified</span>
            <span>Native LLDB Engine</span>
          </span>
        </div>
      </section>

      {/* ── Flagship Interactive Quad Studio Simulator ── */}
      <section id="simulator" className="landing-simulator-section">
        <div className="simulator-window-frame">
          {/* Titlebar */}
          <div className="simulator-titlebar">
            <div className="traffic-dots-group">
              <span className="traffic-dot close" />
              <span className="traffic-dot min" />
              <span className="traffic-dot max" />
            </div>

            {/* Scenario Presets Selector */}
            <div className="sim-preset-selector">
              {Object.keys(SIM_PRESETS).map((key) => {
                const p = SIM_PRESETS[key];
                return (
                  <button
                    key={p.id}
                    className={`sim-preset-btn ${activePresetKey === p.id ? "active" : ""}`}
                    onClick={() => handleSelectPreset(p.id)}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Interactive Step Transport Dock */}
            <div className="simulator-transport-dock">
              <span className="sim-status-chip">
                <span className="sim-pulse-dot" />
                <span>Step {frame.step} / {frames.length}</span>
              </span>
              <button className="sim-btn" onClick={handleReset} title="Reset">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>first_page</span>
              </button>
              <button className="sim-btn" onClick={handlePrevStep} title="Step Back">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_left</span>
              </button>
              <button className="sim-btn" onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  {isPlaying ? "pause" : "play_arrow"}
                </span>
                <span>{isPlaying ? "Pause" : "Auto"}</span>
              </button>
              <button className="sim-btn primary" onClick={handleNextStep} title="Step Forward">
                <span>Next</span>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
              </button>
            </div>
          </div>

          {/* 4-Pane Quad Grid */}
          <div className="simulator-quad-grid">
            {/* Pane 1: Source Code Monaco */}
            <div className="sim-pane">
              <div className="sim-pane-head">
                <div className="title-with-icon">
                  <span className="material-symbols-outlined">code</span>
                  <span>Source Code</span>
                </div>
                <span style={{ color: "#38BDF8" }}>Active Line: {frame.line}</span>
              </div>
              <div className="sim-pane-body">
                {activePreset.code.map((c) => (
                  <div
                    key={c.ln}
                    className={`sim-code-line ${c.ln === frame.line ? "active" : ""}`}
                  >
                    <span className="sim-ln">{c.ln}</span>
                    <span style={{ color: c.ln === frame.line ? "#FFFFFF" : "#CBD5E1" }}>
                      {c.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pane 2: Execution Flow DAG */}
            <div className="sim-pane">
              <div className="sim-pane-head">
                <div className="title-with-icon">
                  <span className="material-symbols-outlined">account_tree</span>
                  <span>Execution Flow Graph</span>
                </div>
                <span style={{ color: "#818CF8" }}>Call Stack Depth: {frame.stack.length}</span>
              </div>
              <div className="sim-pane-body" style={{ padding: 0 }}>
                <div className="sim-flow-canvas">
                  <div
                    className={`sim-dag-node ${frame.activeNode === "main" ? "active" : ""}`}
                    style={{ top: "20%", left: "42%" }}
                  >
                    main()
                  </div>
                  <div
                    className={`sim-dag-node ${frame.activeNode === "fib(4)" ? "active" : ""}`}
                    style={{ top: "45%", left: "20%" }}
                  >
                    frame #1
                  </div>
                  <div
                    className={`sim-dag-node ${frame.activeNode === "fib(3)" ? "active" : ""}`}
                    style={{ top: "45%", left: "65%" }}
                  >
                    frame #2
                  </div>
                  <div
                    className={`sim-dag-node ${frame.activeNode === "fib(2)" ? "active" : ""}`}
                    style={{ top: "72%", left: "32%" }}
                  >
                    eval node
                  </div>
                  <div
                    className={`sim-dag-node ${frame.activeNode === "fib(1)" ? "active" : ""}`}
                    style={{ top: "72%", left: "75%" }}
                  >
                    ret node
                  </div>
                </div>
              </div>
            </div>

            {/* Pane 3: Silicon RAM Spectrometer */}
            <div className="sim-pane">
              <div className="sim-pane-head">
                <div className="title-with-icon">
                  <span className="material-symbols-outlined">memory</span>
                  <span>Silicon RAM Spectrometer</span>
                </div>
                <span style={{ color: "#34D399" }}>4 Allocated Words</span>
              </div>
              <div className="sim-pane-body">
                <div className="sim-memory-die-grid">
                  {frame.memory.map((m, i) => (
                    <div key={i} className={`sim-mem-cell ${m.mutated ? "mutated" : ""}`}>
                      <span className="sim-mem-addr">{m.addr}</span>
                      <div style={{ fontSize: 11, color: "#E2E8F0", marginTop: 2 }}>{m.name}</div>
                      <span className="sim-mem-val">{m.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pane 4: Live Output & Telemetry */}
            <div className="sim-pane">
              <div className="sim-pane-head">
                <div className="title-with-icon">
                  <span className="material-symbols-outlined">terminal</span>
                  <span>Live Output & Telemetry</span>
                </div>
                <span style={{ color: "#22D3EE" }}>{frame.time}</span>
              </div>
              <div className="sim-pane-body">
                <div className="sim-terminal-body">
                  <span className="sim-term-prompt">{activePreset.promptCmd}</span>
                  <pre className="sim-term-out" style={{ margin: "4px 0 0", fontFamily: "inherit" }}>
                    {frame.stdout}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section: The Three Architectural Pillars ── */}
      <section id="architecture" className="pillars-section">
        <div className="landing-section-header">
          <span className="section-eyebrow">Core Architectural Foundation</span>
          <h2 className="section-heading-lg">The Three Pillars of Silicon Clarity</h2>
          <p className="section-subtext">
            Engineered from first principles to bridge the gap between high-level code and low-level hardware execution.
          </p>
        </div>

        <div className="pillars-grid">
          {/* Pillar 1 */}
          <div className="pillar-card">
            <div>
              <span className="pillar-badge-num">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>memory</span>
                <span>Pillar 01 · Silicon Memory</span>
              </span>
              <h3 className="pillar-title">RAM Die Spectrometer</h3>
              <p className="pillar-desc">
                Stop debugging memory blind. Traceon constructs an interactive holographic die map of your application stack frames and heap allocations. Watch pointer dereferences and catch buffer overruns before they reach production.
              </p>
            </div>
            <div className="pillar-visual-box">
              <div style={{ display: "flex", justifyContent: "space-between", color: "#38BDF8", marginBottom: 6 }}>
                <span>[0x7ffee140] stack_frame</span>
                <span>RSP offset -32</span>
              </div>
              <div style={{ color: "#94A3B8" }}>
                • 0x7ffee140: int n = 4<br />
                • 0x7ffee148: Node* ptr = 0x600003a0<br />
                • 0x7ffee150: char buf[16] (bounds OK)
              </div>
              <div style={{ color: "#34D399", marginTop: 8, fontSize: 10.5 }}>
                ✓ 0 memory leaks · AddressSanitizer verified
              </div>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="pillar-card">
            <div>
              <span className="pillar-badge-num">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>history</span>
                <span>Pillar 02 · Time Scrubbing</span>
              </span>
              <h3 className="pillar-title">Bi-Directional Time Travel</h3>
              <p className="pillar-desc">
                Traditional debuggers force you to restart from scratch whenever you step past a bug. Traceon records deterministic execution diffs, letting you scrub backward and forward through your runtime history with zero penalty.
              </p>
            </div>
            <div className="pillar-visual-box">
              <div style={{ display: "flex", justifyContent: "space-between", color: "#818CF8", marginBottom: 6 }}>
                <span>[timeline] Frame 4 / 6</span>
                <span>Delta: -2 steps</span>
              </div>
              <div style={{ color: "#94A3B8" }}>
                • Rewind: n mutated (3 → 4)<br />
                • Restored register RAX = 0x00000001<br />
                • Call stack popped to fibonacci(4)
              </div>
              <div style={{ color: "#22D3EE", marginTop: 8, fontSize: 10.5 }}>
                ↺ Deterministic replay snapshot active
              </div>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="pillar-card">
            <div>
              <span className="pillar-badge-num">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>psychology</span>
                <span>Pillar 03 · AI Autopsy</span>
              </span>
              <h3 className="pillar-title">Hardware-Grounded AI</h3>
              <p className="pillar-desc">
                Traceon AI is not a generic language model. It receives compiler ASTs, LLDB register states, and exact byte address diffs to perform deterministic root-cause autopsies on segmentation faults and memory corruption.
              </p>
            </div>
            <div className="pillar-visual-box">
              <div style={{ display: "flex", justifyContent: "space-between", color: "#F472B6", marginBottom: 6 }}>
                <span>[ai-autopsy] CWE-476</span>
                <span>Confidence: 99.8%</span>
              </div>
              <div style={{ color: "#94A3B8" }}>
                • Root Cause: NULL deref at offset +0<br />
                • Complexity: O(2ⁿ) tree expansion<br />
                • Recommendation: Memoize or use DP
              </div>
              <div style={{ color: "#FBBF24", marginTop: 8, fontSize: 10.5 }}>
                ⚡ Auto-fix available in Monaco editor
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section: Technical Bento Grid ── */}
      <section id="features" className="landing-bento-section">
        <div className="landing-section-header">
          <span className="section-eyebrow">Engineered for Algorithmic Clarity</span>
          <h2 className="section-heading-lg">Every Layer of Execution Revealed</h2>
          <p className="section-subtext">
            Standard debuggers give you blind terminal text. Traceon constructs an interactive, multi-dimensional digital twin of your running software.
          </p>
        </div>

        <div className="bento-grid-container">
          {/* Card 1: Quad Quantum Studio */}
          <div className="bento-card span-2">
            <div>
              <div className="bento-icon-wrapper">
                <span className="material-symbols-outlined">grid_view</span>
              </div>
              <h3 className="bento-title">Quad Quantum Studio</h3>
              <p className="bento-desc">
                Four synchronized execution panes eliminate tab-thrashing forever. Watch Monaco source code lines, the live call stack DAG, silicon RAM memory addresses, and terminal stdout print simultaneously in real time as you step through code.
              </p>
            </div>
            <div className="bento-tag-pills">
              <span className="bento-tag">Synchronized Lockstep</span>
              <span className="bento-tag">Zero Tab Thrashing</span>
              <span className="bento-tag">Full-Width Cinema Mode</span>
            </div>
          </div>

          {/* Card 2: Silicon Memory Spectrometer */}
          <div className="bento-card">
            <div>
              <div className="bento-icon-wrapper">
                <span className="material-symbols-outlined">memory</span>
              </div>
              <h3 className="bento-title">Silicon Memory Spectrometer</h3>
              <p className="bento-desc">
                Real-time holographic memory mapping. Visualize pointer arithmetic, stack frames, heap allocations, and buffer boundaries before overflows corrupt production.
              </p>
            </div>
            <div className="bento-tag-pills">
              <span className="bento-tag">Heap Heatmaps</span>
              <span className="bento-tag">Buffer Overrun Guard</span>
            </div>
          </div>

          {/* Card 3: Algorithmic AI Diagnostics */}
          <div className="bento-card">
            <div>
              <div className="bento-icon-wrapper">
                <span className="material-symbols-outlined">psychology</span>
              </div>
              <h3 className="bento-title">Algorithmic AI Diagnostics</h3>
              <p className="bento-desc">
                Get automated plain-English step rationales, Big-O time and space complexity audits, and targeted algorithmic optimization recommendations.
              </p>
            </div>
            <div className="bento-tag-pills">
              <span className="bento-tag">Big-O Complexity Audit</span>
              <span className="bento-tag">Plain English Explanations</span>
            </div>
          </div>

          {/* Card 4: Native Hardware Fidelity */}
          <div className="bento-card">
            <div>
              <div className="bento-icon-wrapper">
                <span className="material-symbols-outlined">precision_manufacturing</span>
              </div>
              <h3 className="bento-title">Native Hardware Fidelity</h3>
              <p className="bento-desc">
                True native LLDB and GDB debugging. Click the editor gutter to set breakpoints, inspect CPU register states, and catch segfaults at instruction boundaries.
              </p>
            </div>
            <div className="bento-tag-pills">
              <span className="bento-tag">Hardware Breakpoints</span>
              <span className="bento-tag">Segfault Tracing</span>
            </div>
          </div>

          {/* Card 5: Multi-Language Isolation */}
          <div className="bento-card">
            <div>
              <div className="bento-icon-wrapper">
                <span className="material-symbols-outlined">layers</span>
              </div>
              <h3 className="bento-title">Multi-Language Isolation</h3>
              <p className="bento-desc">
                Native compilation conduits for C++, C, Python, and Java. Run code in isolated cloud containers with sub-200ms latency and zero local toolchain dependencies.
              </p>
            </div>
            <div className="bento-tag-pills">
              <span className="bento-tag">C++ · C · Python · Java</span>
              <span className="bento-tag">Zero Local Setup</span>
            </div>
          </div>

          {/* Card 6: Bi-Directional Time-Travel Scrubbing */}
          <div className="bento-card span-2">
            <div>
              <div className="bento-icon-wrapper">
                <span className="material-symbols-outlined">history</span>
              </div>
              <h3 className="bento-title">Bi-Directional Time-Travel Scrubbing</h3>
              <p className="bento-desc">
                Rewind execution at will. Step forward and backward across recorded execution snapshots to uncover the exact instruction where state mutation diverged.
              </p>
            </div>
            <div className="bento-tag-pills">
              <span className="bento-tag">Backwards Stepping</span>
              <span className="bento-tag">Variable Delta Highlighting</span>
              <span className="bento-tag">Deterministic Replay</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section: Comparison Table: The Old Way vs Traceon ── */}
      <section id="comparison" className="landing-comparison-section">
        <div className="landing-section-header">
          <span className="section-eyebrow">The Paradigm Shift</span>
          <h2 className="section-heading-lg">Conventional Debugging vs Traceon</h2>
          <p className="section-subtext">
            Compare traditional terminal guesswork against the clarity of an interactive execution digital twin.
          </p>
        </div>

        <div className="comparison-glass-table">
          <div className="comparison-table-row header-row">
            <div>Workflow Capability</div>
            <div>The Old Way (GDB / Terminal)</div>
            <div>The Traceon Way</div>
          </div>

          <div className="comparison-table-row">
            <div className="comp-feature-name">Execution Path Visualization</div>
            <div className="comp-old-way">
              <span className="material-symbols-outlined">close</span>
              <span>Scattered printf() logging</span>
            </div>
            <div className="comp-traceon-way">
              <span className="material-symbols-outlined">check_circle</span>
              <span>Interactive visual DAG tree</span>
            </div>
          </div>

          <div className="comparison-table-row">
            <div className="comp-feature-name">RAM & Pointer Inspection</div>
            <div className="comp-old-way">
              <span className="material-symbols-outlined">close</span>
              <span>Cryptic hex memory dumps</span>
            </div>
            <div className="comp-traceon-way">
              <span className="material-symbols-outlined">check_circle</span>
              <span>Silicon Memory Spectrometer die map</span>
            </div>
          </div>

          <div className="comparison-table-row">
            <div className="comp-feature-name">Workspace Layout</div>
            <div className="comp-old-way">
              <span className="material-symbols-outlined">close</span>
              <span>Static tabs causing blind stepping</span>
            </div>
            <div className="comp-traceon-way">
              <span className="material-symbols-outlined">check_circle</span>
              <span>Quad Quantum Studio (4 synchronized panes)</span>
            </div>
          </div>

          <div className="comparison-table-row">
            <div className="comp-feature-name">Algorithmic Complexity</div>
            <div className="comp-old-way">
              <span className="material-symbols-outlined">close</span>
              <span>Manual theoretical calculation</span>
            </div>
            <div className="comp-traceon-way">
              <span className="material-symbols-outlined">check_circle</span>
              <span>Instant AI Big-O & bottleneck audit</span>
            </div>
          </div>

          <div className="comparison-table-row">
            <div className="comp-feature-name">Environment Setup</div>
            <div className="comp-old-way">
              <span className="material-symbols-outlined">close</span>
              <span>Hours installing compilers & GDB</span>
            </div>
            <div className="comp-traceon-way">
              <span className="material-symbols-outlined">check_circle</span>
              <span>Instant 0-install browser execution</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section: Interactive Algorithm Playground ── */}
      <section id="algorithms" className="landing-bento-section">
        <div className="landing-section-header">
          <span className="section-eyebrow">Algorithm Playground</span>
          <h2 className="section-heading-lg">Trace Classic Computer Science Algorithms</h2>
          <p className="section-subtext">
            Explore how Traceon breaks down recursive branching, in-place partitioning, and heap pointer manipulation.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginBottom: 30 }}>
          {ALGO_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveAlgoTab(tab.id)}
              style={{
                background: activeAlgoTab === tab.id ? "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(6,182,212,0.3))" : "rgba(255,255,255,0.05)",
                border: activeAlgoTab === tab.id ? "1px solid rgba(6,182,212,0.4)" : "1px solid rgba(255,255,255,0.08)",
                color: activeAlgoTab === tab.id ? "#FFFFFF" : "#94A3B8",
                fontWeight: activeAlgoTab === tab.id ? 600 : 500,
                padding: "8px 16px",
                borderRadius: "999px",
                cursor: "pointer",
                fontSize: 13,
                transition: "all 0.18s ease",
              }}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {(() => {
          const algo = ALGO_TABS.find((t) => t.id === activeAlgoTab) || ALGO_TABS[0];
          return (
            <div className="bento-card" style={{ padding: "32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#FFFFFF" }}>{algo.name}</span>
                  <span className="bento-tag" style={{ color: "#22D3EE", borderColor: "rgba(6,182,212,0.3)" }}>{algo.badge}</span>
                  <span className="bento-tag" style={{ color: "#A5B4FC", borderColor: "rgba(99,102,241,0.3)" }}>{algo.complexity}</span>
                </div>
                <button
                  className="nav-cta-btn"
                  style={{ padding: "6px 14px", fontSize: 12 }}
                  onClick={onStart}
                >
                  Open in Studio
                </button>
              </div>
              <p style={{ color: "#94A3B8", fontSize: "0.95rem", margin: "0 0 20px" }}>{algo.summary}</p>
              <pre
                style={{
                  background: "rgba(0,0,0,0.4)",
                  padding: "16px 20px",
                  borderRadius: 12,
                  fontFamily: "ui-monospace, SFMono-Regular, monospace",
                  fontSize: 12.5,
                  color: "#38BDF8",
                  overflowX: "auto",
                  border: "1px solid rgba(255,255,255,0.08)",
                  lineHeight: 1.5,
                }}
              >
                {algo.snippet}
              </pre>
            </div>
          );
        })()}
      </section>

      {/* ── Section: Developer Telemetry ── */}
      <section className="landing-metrics-section">
        <div className="metrics-glass-grid">
          <div className="metric-card">
            <div className="metric-big-num">50,000+</div>
            <div className="metric-label-sub">Traced Sessions</div>
          </div>
          <div className="metric-card">
            <div className="metric-big-num">&lt;180ms</div>
            <div className="metric-label-sub">Compilation Latency</div>
          </div>
          <div className="metric-card">
            <div className="metric-big-num">99.9%</div>
            <div className="metric-label-sub">Sandbox Availability</div>
          </div>
          <div className="metric-card">
            <div className="metric-big-num">4</div>
            <div className="metric-label-sub">Native Execution Engines</div>
          </div>
        </div>
      </section>

      {/* ── Section: Developer FAQ Accordion ── */}
      <section id="faq" className="faq-section">
        <div className="landing-section-header">
          <span className="section-eyebrow">Technical FAQ</span>
          <h2 className="section-heading-lg">Frequently Asked Questions</h2>
          <p className="section-subtext">
            Everything you need to know about Traceon's runtime engine, security model, and compilation pipeline.
          </p>
        </div>

        <div className="faq-list">
          {FAQ_ITEMS.map((item, idx) => (
            <div key={idx} className={`faq-item ${openFaq === idx ? "open" : ""}`}>
              <button className="faq-question-btn" onClick={() => toggleFaq(idx)}>
                <span>{item.q}</span>
                <span className="material-symbols-outlined faq-chevron">expand_more</span>
              </button>
              {openFaq === idx && (
                <div className="faq-answer-body">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Section: Final High-Impact CTA Box ── */}
      <section className="landing-final-cta-section">
        <div className="final-cta-glass-box">
          <h2 className="final-cta-headline">
            Ready to debug at the speed of thought?
          </h2>
          <p className="final-cta-subtext">
            Join thousands of developers, researchers, and students mastering complex systems programming with Traceon.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
            <button className="hero-primary-cta" onClick={onStart}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>rocket_launch</span>
              <span>Launch Free Studio Now</span>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
            </button>
            <button
              className="hero-secondary-cta"
              onClick={() => onSwitchView && onSwitchView("docs")}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>menu_book</span>
              <span>Explore Documentation</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="nav-logo-icon" style={{ width: 26, height: 26 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>account_tree</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#FFFFFF" }}>Traceon</span>
        </div>

        <div className="footer-copy">
          © {new Date().getFullYear()} Traceon Technologies Inc. All rights reserved.
        </div>

        <div className="footer-status-pill">
          <span className="footer-status-dot" />
          <span>All Execution Clusters Operational</span>
        </div>
      </footer>

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLogin={onLogin}
        />
      )}
    </div>
  );
}
