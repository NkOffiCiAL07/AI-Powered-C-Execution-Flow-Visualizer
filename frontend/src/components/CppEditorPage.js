import React, { useCallback, useEffect, useRef, useState } from "react";
import CodeEditor from "./CodeEditor";
import AiExplanation from "./AiExplanation";
import "../styles/CppEditorPage.css";

const LANG_OPTIONS = [
  { value: "cpp",    label: "C++"    },
  { value: "c",      label: "C"      },
  { value: "python", label: "Python" },
  { value: "java",   label: "Java"   },
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

export default function CppEditorPage({
  code,
  onCodeChange,
  programInput,
  onProgramInputChange,
  onRun,
  onExplain,
  onGenerate,
  onSave,
  onBackToDashboard,
  currentProject,
  user,
  onAnalyze,
  loading,
  generateLoading,
  error,
  result,
  aiExplanation,
  aiLoading,
  language = "cpp",
  onLanguageChange,
}) {
  const [prompt, setPrompt] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
  const [saveState, setSaveState] = useState("idle"); // "idle" | "saving" | "saved" | "error"
  const promptInputRef = useRef(null);
  const saveTimerRef = useRef(null);

  const handleSave = async () => {
    if (!onSave || saveState === "saving") return;
    setSaveState("saving");
    try {
      await onSave();
      setSaveState("saved");
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("error");
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveState("idle"), 2500);
    }
  };

  useEffect(() => () => clearTimeout(saveTimerRef.current), []);

  const handleGenerate = () => {
    if (prompt.trim()) {
      onGenerate(prompt);
      setPrompt("");
      setShowPrompt(false);
    }
  };

  const openPrompt = () => {
    setShowPrompt(true);
    setTimeout(() => promptInputRef.current?.focus(), 30);
  };

  const stdout = result?.stdout || "";
  const stderr = result?.stderr || "";
  const exitCode = result?.exit_code;
  const success = result?.success;

  const [tab, setTab] = useState("output");
  const [leftPct, setLeftPct] = useState(68);
  const dragging = useRef(false);
  const containerRef = useRef(null);

  // Switch to AI tab automatically when explanation arrives
  React.useEffect(() => {
    if (aiExplanation) setTab("ai");
  }, [aiExplanation]);

  const onDividerMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMove = (ev) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(Math.max(pct, 25), 80));
    };

    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  return (
    <main className="editor-page-main" ref={containerRef}>
      {/* ── Left: code editor ── */}
      <section className="editor-page-left" style={{ width: `${leftPct}%`, position: "relative" }}>
        {/* ── AI Generate overlay ── */}
        {showPrompt && (
          <div className="ai-prompt-overlay" onClick={() => setShowPrompt(false)}>
            <div className="ai-prompt-modal" onClick={(e) => e.stopPropagation()}>
              <span className="material-symbols-outlined ai-prompt-modal-icon">auto_awesome</span>
              <input
                ref={promptInputRef}
                className="ai-prompt-modal-input"
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleGenerate();
                  if (e.key === "Escape") setShowPrompt(false);
                }}
                placeholder={`Describe what you want to build in ${language === "c" ? "C" : language === "python" ? "Python" : language === "java" ? "Java" : "C++"}…`}
                disabled={generateLoading}
                spellCheck="false"
              />
              <button
                className="ai-prompt-modal-btn"
                onClick={handleGenerate}
                disabled={generateLoading || !prompt.trim()}
              >
                {generateLoading
                  ? <span className="material-symbols-outlined spin">sync</span>
                  : <span className="material-symbols-outlined">send</span>}
              </button>
            </div>
          </div>
        )}

        <div className="editor-page-card editor-card">
          <div className="editor-page-head">
            <div className="editor-head-left">
              {currentProject && onBackToDashboard && (
                <button className="editor-back-btn" onClick={onBackToDashboard} title="Back to dashboard">
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
              )}
              <div className="editor-title-stack">
                {currentProject && (
                  <span className="editor-project-crumb">{currentProject.project?.name}</span>
                )}
                <h2>{language === "python" ? "Python" : language === "c" ? "C" : language === "java" ? "Java" : "C++"} Editor</h2>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {currentProject && onSave && (
                <button
                  className={`editor-save-btn editor-save-${saveState}`}
                  onClick={handleSave}
                  disabled={saveState === "saving"}
                  title="Save to project"
                >
                  <span className="material-symbols-outlined">
                    {saveState === "saving" ? "sync" : saveState === "saved" ? "check_circle" : saveState === "error" ? "error" : "save"}
                  </span>
                  {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : saveState === "error" ? "Failed" : "Save"}
                </button>
              )}
              <button
                className="ai-gen-trigger"
                onClick={openPrompt}
                disabled={generateLoading}
                title="Generate code with AI"
              >
                <span className={`material-symbols-outlined${generateLoading ? " spin" : ""}`}>
                  {generateLoading ? "sync" : "auto_awesome"}
                </span>
                AI
              </button>
              <LangDropdown language={language} onChange={onLanguageChange} />
            </div>
          </div>
          <CodeEditor
            code={code}
            onChange={onCodeChange}
            currentLine={null}
            onEditRequest={() => {}}
            language={language}
            compact
            compileError={result?.compile_error || null}
          />
        </div>
      </section>

      {/* ── Drag divider ── */}
      <div className="resize-divider" onMouseDown={onDividerMouseDown}>
        <div className="resize-handle-dots" />
      </div>

      {/* ── Right: tabs + content ── */}
      <section className="editor-page-right" style={{ width: `${100 - leftPct}%` }}>

        {/* Tab bar */}
        <div className="editor-tab-bar">
          <div className="editor-tab-group">
            <button
              className={`editor-tab ${tab === "output" ? "active" : ""}`}
              onClick={() => setTab("output")}
            >
              <span className="material-symbols-outlined">terminal</span>
              Output
            </button>
            <button
              className={`editor-tab ${tab === "ai" ? "active" : ""}`}
              onClick={() => setTab("ai")}
            >
              <span className="material-symbols-outlined">auto_awesome</span>
              AI Insights
              {aiLoading && <span className="editor-tab-spinner" />}
            </button>
          </div>
          <div className="section-header-actions">
            <button
              className="visualise-btn"
              onClick={onAnalyze}
              disabled={loading || aiLoading}
              title={!user || user.role === "guest" ? "Sign in to use debugger" : !currentProject ? "Save to project to use debugger" : "Start high-fidelity debugging"}
            >
              <span className="material-symbols-outlined">bug_report</span>
              Visualise
              {(!user || user.role === "guest" || !currentProject) && <span className="material-symbols-outlined lock-icon">lock</span>}
            </button>

            <button
              className="explain-btn"
              onClick={onExplain}
              disabled={aiLoading || loading}
            >
              <span className="material-symbols-outlined">auto_awesome</span>
              {aiLoading ? "Thinking…" : "AI Insights"}
              {aiLoading && <span className="editor-tab-spinner" />}
            </button>
            <button
              className="run-icon-btn"
              onClick={onRun}
              disabled={loading || aiLoading}
              title="Compile & Run"
            >
              <span className={`material-symbols-outlined${loading ? " spin" : ""}`}>
                {loading ? "sync" : "play_arrow"}
              </span>
            </button>
          </div>
        </div>

        {tab === "output" ? (
          <div className="editor-output-tab">
            <div className="editor-page-card input-card">
              <div className="editor-page-subhead">
                <h3>Program Input</h3>
                <span>stdin / cin</span>
              </div>
              <textarea
                className="editor-input-textarea"
                value={programInput}
                onChange={(e) => onProgramInputChange(e.target.value)}
                placeholder="Enter input values here..."
                spellCheck="false"
              />
            </div>

            <div className="editor-page-card output-card">
              <div className="editor-page-subhead">
                <h3>Execution Output</h3>
                {result && (
                  <div className={`status-pill ${success ? "success" : "error"}`}>
                    {success ? "SUCCESS" : "FAILED"} (Exit: {exitCode})
                  </div>
                )}
              </div>

              {error && (
                <div className="editor-error-banner">
                  <strong>Error:</strong> {error}
                </div>
              )}

              <div className="editor-output-grid">
                <div className="editor-output-block">
                  <h4>stdout</h4>
                  <pre>{stdout || "(empty)"}</pre>
                </div>
                <div className="editor-output-block">
                  <h4>stderr</h4>
                  <pre>{stderr || "(empty)"}</pre>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="editor-page-card editor-ai-panel">
            <AiExplanation data={aiExplanation} loading={aiLoading} />
          </div>
        )}
      </section>
    </main>
  );
}
