import React, { useState, useEffect, useRef } from "react";
import LoginModal from "./LoginModal";
import "../styles/LandingPage.css";

// ── Interactive Live Studio Simulation Frames ──
const SIM_CODE = [
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
];

const SIM_FRAMES = [
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
];

const ALGO_TABS = [
  {
    id: "fib",
    name: "Recursive Fibonacci",
    lang: "C++",
    badge: "Tree DAG",
    summary: "Visualizes recursion branch splits, stack frame allocation, and exponential call trees.",
    snippet: `int fib(int n) {\n  if (n <= 1) return n;\n  return fib(n - 1) + fib(n - 2);\n}`,
  },
  {
    id: "sort",
    name: "QuickSort Partition",
    lang: "C++",
    badge: "Divide & Conquer",
    summary: "Watch in-place pivot partitioning, swap operations, and recursion stack bounds in real time.",
    snippet: `int partition(int arr[], int low, int high) {\n  int pivot = arr[high];\n  int i = (low - 1);\n  for (int j = low; j < high; j++) {\n    if (arr[j] < pivot) swap(&arr[++i], &arr[j]);\n  }\n  swap(&arr[i + 1], &arr[high]);\n  return (i + 1);\n}`,
  },
  {
    id: "bst",
    name: "Binary Search Tree",
    lang: "C",
    badge: "Heap Pointers",
    summary: "Inspect pointer dereferencing, dynamic malloc nodes, and traversal path decisions.",
    snippet: `struct Node* insert(struct Node* node, int key) {\n  if (node == NULL) return newNode(key);\n  if (key < node->key) node->left = insert(node->left, key);\n  else if (key > node->key) node->right = insert(node->right, key);\n  return node;\n}`,
  },
  {
    id: "reverse",
    name: "Linked List Reversal",
    lang: "C",
    badge: "Pointer Rewiring",
    summary: "Follow prev, curr, and next pointers step by step without losing references.",
    snippet: `Node* reverse(Node* head) {\n  Node* prev = NULL;\n  Node* curr = head;\n  while (curr != NULL) {\n    Node* next = curr->next;\n    curr->next = prev;\n    prev = curr;\n    curr = next;\n  }\n  return prev;\n}`,
  },
];

export default function LandingPage({ onStart, onSwitchView, onLogin, onSignIn, user, serverDown }) {
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeAlgoTab, setActiveAlgoTab] = useState("fib");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const playTimerRef = useRef(null);

  const frame = SIM_FRAMES[currentFrameIdx];

  // Auto-stepping simulation timer
  useEffect(() => {
    if (!isPlaying) {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
      return;
    }
    playTimerRef.current = setInterval(() => {
      setCurrentFrameIdx((idx) => (idx + 1) % SIM_FRAMES.length);
    }, 2400);

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying]);

  const handleNextStep = () => {
    setIsPlaying(false);
    setCurrentFrameIdx((idx) => (idx + 1) % SIM_FRAMES.length);
  };

  const handlePrevStep = () => {
    setIsPlaying(false);
    setCurrentFrameIdx((idx) => (idx - 1 + SIM_FRAMES.length) % SIM_FRAMES.length);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentFrameIdx(0);
  };

  return (
    <div className="quantum-landing-page">
      {/* Background Matrix Grid */}
      <div className="landing-grid-matrix" />

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
            <a href="#features" className="nav-link-item">Features</a>
            <a href="#comparison" className="nav-link-item">Comparison</a>
            <a href="#algorithms" className="nav-link-item">Algorithms</a>
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

        {/* Conduit Languages Badges */}
        <div className="hero-language-conduit">
          <div className="lang-chip cpp">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>code</span>
            <span>C++20</span>
          </div>
          <div className="lang-chip c">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>terminal</span>
            <span>C17</span>
          </div>
          <div className="lang-chip python">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>data_object</span>
            <span>Python 3.12</span>
          </div>
          <div className="lang-chip java">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>coffee</span>
            <span>Java 21</span>
          </div>
          <div className="lang-chip feature">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>speed</span>
            <span>Sub-200ms Tracing</span>
          </div>
          <div className="lang-chip feature">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>verified</span>
            <span>Native LLDB Engine</span>
          </div>
        </div>
      </section>

      {/* ── Interactive Live Studio Simulator ── */}
      <section id="simulator" className="landing-simulator-section">
        <div className="simulator-window-frame">
          {/* macOS Titlebar */}
          <div className="simulator-titlebar">
            <div className="traffic-dots-group">
              <span className="traffic-dot close" />
              <span className="traffic-dot min" />
              <span className="traffic-dot max" />
            </div>

            <div className="simulator-file-crumb">
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#6366F1" }}>description</span>
              <span>traceon-studio / algorithms / fibonacci.cpp</span>
            </div>

            {/* Live Interactive Transport Dock */}
            <div className="simulator-transport-dock">
              <span className="sim-status-chip">
                <span className="sim-pulse-dot" />
                Step {frame.step} / {SIM_FRAMES.length}
              </span>

              <button className="sim-btn" onClick={handleReset} title="Reset to start">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>first_page</span>
              </button>

              <button className="sim-btn" onClick={handlePrevStep} title="Step Back">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_left</span>
              </button>

              <button
                className="sim-btn"
                onClick={() => setIsPlaying((p) => !p)}
                title={isPlaying ? "Pause auto-step" : "Play auto-step"}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                  {isPlaying ? "pause" : "play_arrow"}
                </span>
                <span>{isPlaying ? "Pause" : "Play"}</span>
              </button>

              <button className="sim-btn primary" onClick={handleNextStep} title="Step Forward">
                <span>Next</span>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
              </button>
            </div>
          </div>

          {/* 4-Pane Synchronized Quad Studio Simulation */}
          <div className="simulator-quad-grid">
            {/* Quadrant 1: Code Editor */}
            <div className="sim-pane">
              <div className="sim-pane-head">
                <div className="title-with-icon">
                  <span className="material-symbols-outlined">code</span>
                  <span>Source Code (C++20)</span>
                </div>
                <span style={{ color: "#38BDF8" }}>Active Line: {frame.line}</span>
              </div>
              <div className="sim-pane-body">
                {SIM_CODE.map((c) => (
                  <div
                    key={c.ln}
                    className={`sim-code-line ${c.ln === frame.line ? "active" : ""}`}
                  >
                    <span className="sim-ln">{c.ln}</span>
                    <span style={{ color: c.ln === frame.line ? "#FFFFFF" : "#CBD5E1" }}>
                      {c.text || " "}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quadrant 2: Execution Flow DAG */}
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
                    fib(4)
                  </div>
                  <div
                    className={`sim-dag-node ${frame.activeNode === "fib(3)" ? "active" : ""}`}
                    style={{ top: "45%", left: "65%" }}
                  >
                    fib(3)
                  </div>
                  <div
                    className={`sim-dag-node ${frame.activeNode === "fib(2)" ? "active" : ""}`}
                    style={{ top: "72%", left: "32%" }}
                  >
                    fib(2)
                  </div>
                  <div
                    className={`sim-dag-node ${frame.activeNode === "fib(1)" ? "active" : ""}`}
                    style={{ top: "72%", left: "75%" }}
                  >
                    fib(1)
                  </div>
                </div>
              </div>
            </div>

            {/* Quadrant 3: Silicon Memory Spectrometer */}
            <div className="sim-pane">
              <div className="sim-pane-head">
                <div className="title-with-icon">
                  <span className="material-symbols-outlined">memory_alt</span>
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

            {/* Quadrant 4: Live Cyber Terminal */}
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
                  <span className="sim-term-prompt">$ ./fibonacci</span>
                  <pre className="sim-term-out" style={{ margin: "4px 0 0", fontFamily: "inherit" }}>
                    {frame.stdout}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive Bento Grid ── */}
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

          {/* Card 4: True LLDB & GDB Hardware Fidelity */}
          <div className="bento-card">
            <div>
              <div className="bento-icon-wrapper">
                <span className="material-symbols-outlined">bug_report</span>
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

          {/* Card 5: Universal Multi-Language Engine */}
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

          {/* Card 6: Time-Travel Execution Scrubber */}
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

      {/* ── Comparison Table: The Old Way vs Traceon ── */}
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
            <div>The Old Way</div>
            <div>The Traceon Way</div>
          </div>

          <div className="comparison-table-row">
            <div className="comp-feature-name">Execution Path Visualization</div>
            <div className="comp-old-way">
              <span className="material-symbols-outlined">close</span>
              <span>Scattered <code>printf()</code> logging</span>
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

      {/* ── Interactive Algorithm Playground ── */}
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
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#FFFFFF" }}>{algo.name}</span>
                  <span className="bento-tag" style={{ color: "#22D3EE", borderColor: "rgba(6,182,212,0.3)" }}>{algo.badge}</span>
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

      {/* ── Live Metrics Section ── */}
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

      {/* ── Final Cinematic Studio CTA ── */}
      <section className="landing-final-cta-section">
        <div className="final-cta-glass-box">
          <h2 className="final-cta-headline">
            Ready to debug at the speed of thought?
          </h2>
          <p className="final-cta-subtext">
            Join thousands of developers, researchers, and students mastering complex algorithms with Traceon.
          </p>
          <button className="hero-primary-cta" onClick={onStart}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>rocket_launch</span>
            <span>Launch Free Studio Now</span>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
          </button>
        </div>
      </section>

      {/* ── Futuristic Liquid Glass Footer ── */}
      <footer className="landing-footer">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="nav-logo-icon" style={{ width: 26, height: 26 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>account_tree</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#FFFFFF" }}>Traceon</span>
          <span className="footer-copy">© 2026 Traceon Technologies Inc. All rights reserved.</span>
        </div>

        <div className="footer-status-pill">
          <span className="footer-status-dot" />
          <span>All Execution Clusters Operational</span>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onLogin={(userData, token) => {
          setShowLoginModal(false);
          if (onLogin) onLogin(userData, token);
        }}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
}
