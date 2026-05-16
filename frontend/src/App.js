import React, { useState, useCallback, useRef, useEffect } from "react";
import CodeEditor from "./components/CodeEditor";
import FlowVisualizer from "./components/FlowVisualizer";
import OutputPanel from "./components/OutputPanel";
import Header from "./components/Header";
import AiExplanation from "./components/AiExplanation";
import CppEditorPage from "./components/CppEditorPage";
import LandingPage from "./components/LandingPage";
import DocsPage from "./components/DocsPage";
import PricingPage from "./components/PricingPage";
import CommunityPage from "./components/CommunityPage";
import LoginModal from "./components/LoginModal";
import { analyzeCode, runCode, stepAnalyzeSession, explainCode, generateCode, API_BASE_URL } from "./services/api";
import "./App.css";
import "./styles/CppEditorPage.css";

const DEFAULT_CODE = `#include <iostream>
using namespace std;

int main() {
    int x = 5;
    int y = 3;
    int z = x + y;
    cout << "z = " << z << endl;
    return 0;
}`;

const LANG_OPTIONS = [
  { value: "cpp",    label: "C++"    },
  { value: "c",      label: "C"      },
  { value: "python", label: "Python" },
];

function LangDropdown({ language, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LANG_OPTIONS.find(o => o.value === language);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="ex-dropdown" ref={ref}>
      <button className="ex-dropdown-trigger" onClick={() => setOpen(o => !o)}>
        <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--primary)" }}>code</span>
        {current?.label}
        <span className="material-symbols-outlined ex-chevron" style={{ transform: open ? "rotate(180deg)" : "none" }}>expand_more</span>
      </button>
      {open && (
        <ul className="ex-dropdown-menu">
          {LANG_OPTIONS.map(opt => (
            <li key={opt.value}
              className={`ex-dropdown-item ${opt.value === language ? "active" : ""}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}>
              {opt.value === language && <span className="material-symbols-outlined ex-check">check</span>}
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


function App() {
  const [user, setUser] = useState(null);
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(DEFAULT_CODE);
  const [programInput, setProgramInput] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stepLoading, setStepLoading] = useState(false);
  const [view, setView] = useState("landing");
  const [activeTab, setActiveTab] = useState("flow");
  const [aiExplanation, setAiExplanation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [currentLine, setCurrentLine] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [runLoading, setRunLoading] = useState(false);
  const [runError, setRunError] = useState(null);
  const [generateLoading, setGenerateLoading] = useState(false);
  const generateAbortRef = useRef(null);
  const [showDebugGenPrompt, setShowDebugGenPrompt] = useState(false);
  const [debugGenPrompt, setDebugGenPrompt] = useState("");
  const debugGenInputRef = useRef(null);
  const [serverDown, setServerDown] = useState(false);
  const [serverChecking, setServerChecking] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const abortControllerRef = useRef(null);
  const aiAbortControllerRef = useRef(null);
  const stepAbortControllerRef = useRef(null);
  const runAbortControllerRef = useRef(null);

  // Debugger panel resize
  const [debugLeftPct, setDebugLeftPct] = useState(40);
  const debugDragging = useRef(false);
  const debugContainerRef = useRef(null);
  const onDebugDividerMouseDown = useCallback((e) => {
    e.preventDefault();
    debugDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const onMove = (ev) => {
      if (!debugDragging.current || !debugContainerRef.current) return;
      const rect = debugContainerRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setDebugLeftPct(Math.min(Math.max(pct, 20), 75));
    };
    const onUp = () => {
      debugDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  const checkServer = useCallback(async () => {
    setServerChecking(true);
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) setServerDown(false);
      else setServerDown(true);
    } catch {
      setServerDown(true);
    } finally {
      setServerChecking(false);
    }
  }, []);

  useEffect(() => { checkServer(); }, [checkServer]);
  useEffect(() => {
    if (!serverDown) return;
    const id = setInterval(checkServer, 8000);
    return () => clearInterval(id);
  }, [serverDown, checkServer]);

  useEffect(() => {
    if (!user && (view === "editor" || view === "visualizer")) {
      setView("landing");
    }
  }, [user, view]);

  useEffect(() => {
    const savedUser = localStorage.getItem("traceon_user");
    const savedToken = localStorage.getItem("traceon_auth_token");

    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.provider === "guest") {
          setUser(parsed);
        } else if (savedToken) {
          const payload = JSON.parse(atob(savedToken.split(".")[1]));
          if (payload.exp && payload.exp * 1000 > Date.now()) {
            setUser(parsed);
          } else {
            localStorage.removeItem("traceon_user");
            localStorage.removeItem("traceon_auth_token");
          }
        } else {
          localStorage.removeItem("traceon_user");
        }
      } catch {
        localStorage.removeItem("traceon_user");
        localStorage.removeItem("traceon_auth_token");
      }
    }

    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (aiAbortControllerRef.current) aiAbortControllerRef.current.abort();
      if (stepAbortControllerRef.current) stepAbortControllerRef.current.abort();
      if (runAbortControllerRef.current) runAbortControllerRef.current.abort();
    };
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem("traceon_user", JSON.stringify(userData));
    if (token) localStorage.setItem("traceon_auth_token", token);
    setView("editor");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("traceon_user");
    localStorage.removeItem("traceon_auth_token");
    setView("landing");
  };

  const handleExplain = useCallback(async () => {
    if (!code.trim()) {
      setError(`Please enter some ${language.toUpperCase()} code before explaining.`);
      return;
    }

    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
    }
    aiAbortControllerRef.current = new AbortController();

    setAiLoading(true);
    setError(null);
    setActiveTab("ai");
    try {
      const result = await explainCode(code, aiAbortControllerRef.current.signal, language);
      setAiExplanation(result);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Explanation failed");
    } finally {
      setAiLoading(false);
      aiAbortControllerRef.current = null;
    }
  }, [code, language]);

const handleGenerate = useCallback(async (prompt) => {
    if (!prompt.trim()) return;
    if (generateAbortRef.current) generateAbortRef.current.abort();
    generateAbortRef.current = new AbortController();
    setGenerateLoading(true);
    try {
      const result = await generateCode(prompt, language, generateAbortRef.current.signal);
      setCode(result.code);
      setCurrentLine(null);
      setAnalysisResult(null);
      setRunResult(null);
      setRunError(null);
      setError(null);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Code generation failed");
    } finally {
      setGenerateLoading(false);
      generateAbortRef.current = null;
    }
  }, [language]);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setCode("");
    setCurrentLine(null);
    setAnalysisResult(null);
    setAiExplanation(null);
    setError(null);
    setRunResult(null);
    setRunError(null);
    setStepLoading(false);
  };

  const handleAnalyze = useCallback(async (codeOverride) => {
    const codeToAnalyze = typeof codeOverride === "string" ? codeOverride : code;
    if (!codeToAnalyze.trim()) {
      setError(`Please enter some ${language.toUpperCase()} code before analyzing.`);
      return;
    }

    const usesInput = language === "cpp" 
      ? /\b(cin\s*>>|getline\s*\(|scanf\s*\()/.test(codeToAnalyze)
      : /\b(scanf\s*\(|gets\s*\(|fgets\s*\()/.test(codeToAnalyze);
      
    if (usesInput && !programInput.trim()) {
      setError("Your code reads input but no input was provided. Please add input in the Program Input box below.");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setStepLoading(false);
    setError(null);
    setAnalysisResult(null);
    try {
      const result = await analyzeCode(codeToAnalyze, programInput, abortControllerRef.current.signal, language);
      setServerDown(false);
      setAnalysisResult(result);
      setActiveTab("flow");
    } catch (err) {
      if (err.name === "AbortError") return;
      if (err.message?.includes("Cannot connect")) setServerDown(true);
      setError(err.message || "Analysis failed");
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [code, programInput, language]);

  const handleRun = useCallback(async () => {
    if (!code.trim()) {
      setRunError(`Please enter some ${language.toUpperCase()} code before running.`);
      return;
    }

    const usesInput = language === "cpp" 
      ? /\b(cin\s*>>|getline\s*\(|scanf\s*\()/.test(code)
      : /\b(scanf\s*\(|gets\s*\(|fgets\s*\()/.test(code);

    if (usesInput && !programInput.trim()) {
      setRunError("Your code reads input but no input was provided. Please add input in the Input box.");
      return;
    }

    if (runAbortControllerRef.current) {
      runAbortControllerRef.current.abort();
    }
    runAbortControllerRef.current = new AbortController();

    setRunLoading(true);
    setRunError(null);
    setRunResult(null);
    try {
      const result = await runCode(code, programInput, runAbortControllerRef.current.signal, language);
      setServerDown(false);
      if (!result.success) {
        setRunError(result.compile_error || result.stderr || "Compilation failed");
      }
      setRunResult(result);
    } catch (err) {
      if (err.name === "AbortError") return;
      if (err.message?.includes("Cannot connect")) setServerDown(true);
      setRunError(err.message || "Run failed");
    } finally {
      setRunLoading(false);
      runAbortControllerRef.current = null;
    }
  }, [code, programInput, language]);

  const handleStep = useCallback(async (direction, stepType) => {
    if (!analysisResult?.session_id) {
      return;
    }

    if (stepAbortControllerRef.current) {
      stepAbortControllerRef.current.abort();
    }
    stepAbortControllerRef.current = new AbortController();

    setStepLoading(true);
    setError(null);

    try {
      const response = await stepAnalyzeSession(
        analysisResult.session_id,
        direction,
        stepType,
        stepAbortControllerRef.current.signal
      );

      setAnalysisResult((prev) => {
        if (!prev) return prev;
        const nextSnapshots = [...(prev.snapshots || [])];

        if (response.accepted && response.snapshot && response.cursor >= 0) {
          if (response.cursor < nextSnapshots.length) {
            nextSnapshots[response.cursor] = response.snapshot;
          } else if (response.cursor === nextSnapshots.length) {
            nextSnapshots.push(response.snapshot);
          }
        }

        return {
          ...prev,
          status: response.status,
          cursor: response.accepted ? response.cursor : prev.cursor,
          snapshots: nextSnapshots,
          total_steps: response.total_recorded_steps,
          total_recorded_steps: response.total_recorded_steps,
          accepted: response.accepted,
          message: response.message || prev.message || "",
        };
      });

      if (!response.accepted && response.message && response.status !== "exited") {
        setError(response.message);
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Step failed");
      setAnalysisResult((prev) => prev ? { ...prev, accepted: false } : prev);
    } finally {
      setStepLoading(false);
      stepAbortControllerRef.current = null;
    }
  }, [analysisResult]);

  const renderView = () => {
    switch (view) {
      case "landing":
        return <LandingPage onStart={() => setView("editor")} onSwitchView={setView} onLogin={handleLogin} />;
      case "docs":
        return <DocsPage />;
      case "pricing":
        return <PricingPage onStart={() => setView("editor")} />;
      case "community":
        return <CommunityPage onStart={() => setView("editor")} />;
      case "editor":
        return (
          <CppEditorPage
            code={code}
            onCodeChange={(newCode) => {
              setCode(newCode);
              setCurrentLine(null);
              setAnalysisResult(null);
              setError(null);
              setStepLoading(false);
              setRunResult(null);
              setRunError(null);
            }}
            programInput={programInput}
            onProgramInputChange={(value) => {
              setProgramInput(value);
              setCurrentLine(null);
              setAnalysisResult(null);
              setError(null);
              setStepLoading(false);
              setRunResult(null);
              setRunError(null);
            }}
            onRun={handleRun}
            onExplain={handleExplain}
            loading={runLoading}
            error={runError}
            result={runResult}
            aiExplanation={aiExplanation}
            aiLoading={aiLoading}
            language={language}
            onLanguageChange={handleLanguageChange}
            onGenerate={handleGenerate}
            generateLoading={generateLoading}
          />
        );
      case "visualizer":
        return (
          <main className="app-main" ref={debugContainerRef}>
            <section className="editor-section" style={{ width: `${debugLeftPct}%`, flex: "none", position: "relative" }}>
              {/* ── AI Generate overlay (debugger mode) ── */}
              {showDebugGenPrompt && (
                <div className="ai-prompt-overlay" onClick={() => setShowDebugGenPrompt(false)}>
                  <div className="ai-prompt-modal" onClick={(e) => e.stopPropagation()}>
                    <span className="material-symbols-outlined ai-prompt-modal-icon">auto_awesome</span>
                    <input
                      ref={debugGenInputRef}
                      className="ai-prompt-modal-input"
                      type="text"
                      value={debugGenPrompt}
                      onChange={(e) => setDebugGenPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && debugGenPrompt.trim()) {
                          handleGenerate(debugGenPrompt);
                          setDebugGenPrompt("");
                          setShowDebugGenPrompt(false);
                        }
                        if (e.key === "Escape") setShowDebugGenPrompt(false);
                      }}
                      placeholder={`Describe what you want to build in ${language === "c" ? "C" : "C++"}…`}
                      disabled={generateLoading}
                      spellCheck="false"
                      autoFocus
                    />
                    <button
                      className="ai-prompt-modal-btn"
                      onClick={() => {
                        if (debugGenPrompt.trim()) {
                          handleGenerate(debugGenPrompt);
                          setDebugGenPrompt("");
                          setShowDebugGenPrompt(false);
                        }
                      }}
                      disabled={generateLoading || !debugGenPrompt.trim()}
                    >
                      {generateLoading
                        ? <span className="material-symbols-outlined spin">sync</span>
                        : <span className="material-symbols-outlined">send</span>}
                    </button>
                  </div>
                </div>
              )}
              <div className="section-header">
                <h2>Your Code</h2>
                <div className="examples-selector-container">
                  <button
                    className="ai-gen-trigger"
                    onClick={() => {
                      setShowDebugGenPrompt(true);
                      setTimeout(() => debugGenInputRef.current?.focus(), 30);
                    }}
                    disabled={generateLoading}
                    title="Generate code with AI"
                  >
                    <span className={`material-symbols-outlined${generateLoading ? " spin" : ""}`}>
                      {generateLoading ? "sync" : "auto_awesome"}
                    </span>
                    AI + Code
                  </button>
                  <LangDropdown language={language} onChange={handleLanguageChange} />
                </div>
              </div>
              <CodeEditor
                code={code}
                onChange={(newCode) => { setCode(newCode); setCurrentLine(null); setAnalysisResult(null); }}
                currentLine={currentLine}
                onEditRequest={() => { setCurrentLine(null); setAnalysisResult(null); }}
                language={language}
                compact
              />
              <div className="stdin-panel">
                <div className="stdin-header">
                  <h3>Program Input</h3>
                  <span>Optional stdin for `cin`, `input()`, etc.</span>
                </div>
                <textarea
                  className="stdin-textarea"
                  value={programInput}
                  onChange={(event) => {
                    setProgramInput(event.target.value);
                    setCurrentLine(null);
                    setAnalysisResult(null);
                    setStepLoading(false);
                  }}
                  placeholder={"Example:\n5\n10\nhello"}
                  spellCheck="false"
                />
              </div>
            </section>
            <div className="resize-divider" onMouseDown={onDebugDividerMouseDown}>
              <div className="resize-handle-dots" />
            </div>
            <section className="visualizer-section" style={{ flex: 1, minWidth: 0 }}>
              <div className="section-header">
                <div className="tab-bar" role="tablist" aria-label="View tabs">
                  {['Execution Flow', 'AI Insights', 'Output & Details'].map(tab => (
                    <button
                      key={tab}
                      className={`tab ${activeTab === (tab.toLowerCase().split(' ')[0]) ? "active" : ""}`}
                      onClick={() => setActiveTab(tab.toLowerCase().split(' ')[0])}
                      role="tab"
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="section-header-actions">
                  <button className="explain-btn" onClick={handleExplain} disabled={aiLoading || loading}>
                    <span className="material-symbols-outlined">auto_awesome</span>
                    {aiLoading ? "Thinking…" : "AI Insights"}
                  </button>
                  <button
                    className="run-icon-btn"
                    onClick={() => handleAnalyze()}
                    disabled={loading || aiLoading}
                    title="Analyze & Run"
                  >
                    <span className={`material-symbols-outlined${loading ? " spin" : ""}`}>{loading ? "sync" : "play_arrow"}</span>
                  </button>
                </div>
              </div>
              {error && (
                <div className="error-banner">
                  <span><strong>Error:</strong> {error}</span>
                  <button className="error-dismiss" onClick={() => setError(null)}>✕</button>
                </div>
              )}
              {activeTab === "flow" ? (
                <FlowVisualizer result={analysisResult} loading={loading} stepLoading={stepLoading} onLineChange={setCurrentLine} code={code} onNext={(stepType) => handleStep("next", stepType)} onBack={() => handleStep("back")} />
              ) : activeTab === "ai" ? (
                <AiExplanation data={aiExplanation} loading={aiLoading} />
              ) : (
                <OutputPanel result={analysisResult} loading={loading} />
              )}
            </section>
          </main>
        );
      default:
        return <LandingPage onStart={() => setView("editor")} onSwitchView={setView} />;
    }
  };

  return (
    <div className="app">
      {view !== "landing" && (
        <Header
          view={view}
          onSwitchView={setView}
          user={user}
          onLogout={handleLogout}
          onSignIn={() => setShowLoginModal(true)}
        />
      )}
      {serverDown && (view === "editor" || view === "visualizer") && (
        <div className="server-down-banner">
          <div className="server-down-inner">
            <span className="server-down-icon material-symbols-outlined">wifi_off</span>
            <div className="server-down-text">
              <strong>Backend server is not running.</strong>
              <span> Start it with: </span>
              <code className="server-down-cmd">python run_server.py</code>
            </div>
          </div>
          <button className="server-retry-btn" onClick={checkServer} disabled={serverChecking}>
            <span className={`material-symbols-outlined${serverChecking ? " spin" : ""}`}>{serverChecking ? "sync" : "refresh"}</span>
            {serverChecking ? "Checking…" : "Retry"}
          </button>
        </div>
      )}
      {renderView()}
      <LoginModal isOpen={showLoginModal} onLogin={(userData) => { handleLogin(userData); setShowLoginModal(false); }} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}

export default App;
