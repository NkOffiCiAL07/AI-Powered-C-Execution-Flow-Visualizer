import React, { useCallback, useEffect, useRef, useState } from "react";
import CodeEditor from "./CodeEditor";
import AiExplanation from "./AiExplanation";
import "../styles/CppEditorPage.css";

const LANG_OPTIONS = [
  { value: "cpp", label: "C++" },
  { value: "c",   label: "C"   },
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

  const handleGenerate = () => {
    if (prompt.trim()) {
      onGenerate(prompt);
      setPrompt("");
    }
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
      <section className="editor-page-left" style={{ width: `${leftPct}%` }}>
        <div className="editor-page-card editor-card">
          <div className="editor-page-head">
            <h2>{language === "c" ? "C" : "C++"} Code Editor</h2>
            <LangDropdown language={language} onChange={onLanguageChange} />
          </div>
          <div className="ai-prompt-bar">
            <span className="material-symbols-outlined ai-prompt-icon">auto_awesome</span>
            <input
              className="ai-prompt-input"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder={`Describe what you want to build in ${language === "c" ? "C" : "C++"}…`}
              disabled={generateLoading}
              spellCheck="false"
            />
            <button
              className="ai-prompt-btn"
              onClick={handleGenerate}
              disabled={generateLoading || !prompt.trim()}
            >
              {generateLoading
                ? <span className="material-symbols-outlined spin">sync</span>
                : <span className="material-symbols-outlined">send</span>}
            </button>
          </div>
          <CodeEditor
            code={code}
            onChange={onCodeChange}
            currentLine={null}
            onEditRequest={() => {}}
            language={language}
            compact
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
