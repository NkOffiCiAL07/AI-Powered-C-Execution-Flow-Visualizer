import React, { useCallback, useEffect, useRef, useState } from "react";
import CodeEditor from "./CodeEditor";
import AiExplanation from "./AiExplanation";
import LangDropdown from "./LangDropdown";
import { checkCode } from "../services/api";
import "../styles/CppEditorPage.css";

export default function CppEditorPage({
  code,
  onCodeChange,
  programInput,
  onProgramInputChange,
  onRun,
  onExplain,
  onOptimize,
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
  performance,
  language = "cpp",
  onLanguageChange,
  onFileSwitch,
  onFileCreate,
  onFileDelete,
  onFileRename,
  onSignIn,
  breakpoints,
  onBreakpointsChange,
}) {
  const isGuest = !user || user.role === "guest";
  const [prompt, setPrompt] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
  const [saveState, setSaveState] = useState("idle"); // "idle" | "saving" | "saved" | "error"
  const promptInputRef = useRef(null);
  const saveTimerRef = useRef(null);
  const [showNewFilePrompt, setShowNewFilePrompt] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [renamingFileId, setRenamingFileId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef(null);
  const [liveCheckError, setLiveCheckError] = useState(null);
  const checkTimerRef = useRef(null);
  const checkControllerRef = useRef(null);

  useEffect(() => {
    if (!code || !code.trim()) { setLiveCheckError(null); return; }
    clearTimeout(checkTimerRef.current);
    checkControllerRef.current?.abort();
    checkTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      checkControllerRef.current = controller;
      try {
        const res = await checkCode(code, language, controller.signal);
        setLiveCheckError(res.ok ? null : res.errors);
      } catch (e) {
        if (e.name !== "AbortError") setLiveCheckError(null);
      }
    }, 1500);
    return () => {
      clearTimeout(checkTimerRef.current);
      checkControllerRef.current?.abort();
    };
  }, [code, language]);

  const handleSave = useCallback(async () => {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSave]);

  useEffect(() => () => clearTimeout(saveTimerRef.current), []);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleSave]);

  const handleGenerate = () => {
    if (prompt.trim()) {
      onGenerate(prompt);
      setPrompt("");
      setShowPrompt(false);
    }
  };

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      onFileCreate(newFileName.trim());
      setNewFileName("");
      setShowNewFilePrompt(false);
    }
  };

  const startRename = (f, e) => {
    e.stopPropagation();
    setRenamingFileId(f.id);
    setRenameValue(f.name);
    setTimeout(() => renameInputRef.current?.select(), 20);
  };

  const commitRename = () => {
    if (renameValue.trim() && renamingFileId) {
      onFileRename && onFileRename(renamingFileId, renameValue.trim());
    }
    setRenamingFileId(null);
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
  const [leftPct, setLeftPct] = useState(58);
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

  const langLabel = language === "python" ? "Python" : language === "c" ? "C" : language === "java" ? "Java" : "C++";
  const isDebugLocked = !user || user.role === "guest" || !currentProject;

  return (
    <main className="editor-page-main">

      {/* ── Left Sidebar: File Explorer ── */}
      {currentProject && (
        <aside className="editor-sidebar">
          <div className="sidebar-head">
            <span className="material-symbols-outlined">folder_open</span>
            Explorer
          </div>
          <div className="sidebar-list">
            {currentProject.files?.map(f => (
              <div
                key={f.id}
                className={`file-item ${f.id === currentProject.activeFileId ? 'active' : ''}`}
                onClick={() => renamingFileId !== f.id && onFileSwitch && onFileSwitch(f.id)}
              >
                <span className="material-symbols-outlined file-icon">
                  {f.language === 'python' ? 'terminal' : 'description'}
                </span>
                {renamingFileId === f.id ? (
                  <input
                    ref={renameInputRef}
                    className="file-rename-input"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') setRenamingFileId(null);
                    }}
                    onBlur={commitRename}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="file-name" onDoubleClick={(e) => startRename(f, e)} title="Double-click to rename">{f.name}</span>
                )}
                <button
                  className="file-delete-btn"
                  onClick={(e) => { e.stopPropagation(); onFileDelete && onFileDelete(f.id); }}
                  title="Delete file"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            ))}
          </div>

          {showNewFilePrompt ? (
            <div className="new-file-input-container">
              <input
                autoFocus
                className="new-file-input"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFile();
                  if (e.key === 'Escape') setShowNewFilePrompt(false);
                }}
                onBlur={() => !newFileName && setShowNewFilePrompt(false)}
                placeholder="filename.cpp"
              />
            </div>
          ) : (
            <button className="sidebar-add-btn" onClick={() => setShowNewFilePrompt(true)}>
              <span className="material-symbols-outlined">add</span>
              New File
            </button>
          )}
        </aside>
      )}

      {/* ── Content area: editor + divider + right ── */}
      <div className="editor-content-wrap" ref={containerRef}>

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
                  placeholder={`Describe what you want to build in ${langLabel}…`}
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

          {/* ── Editor header ── */}
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
                  <h2>{langLabel} Editor</h2>
                </div>
              </div>

              <div className="editor-head-right">
                {/* Save indicator */}
                {currentProject && onSave && (
                  <button
                    className={`editor-save-btn editor-save-${saveState}`}
                    onClick={handleSave}
                    disabled={saveState === "saving"}
                    title="Save file (⌘S)"
                  >
                    <span className="material-symbols-outlined">
                      {saveState === "saving" ? "sync" : saveState === "saved" ? "check_circle" : saveState === "error" ? "error" : "save"}
                    </span>
                    {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : saveState === "error" ? "Failed" : "Save"}
                  </button>
                )}

                {/* AI Generate */}
                <button
                  className={`ai-gen-trigger${isGuest ? " ai-gen-locked" : ""}`}
                  onClick={isGuest ? onSignIn : openPrompt}
                  disabled={generateLoading}
                  title={isGuest ? "Sign in to generate code with AI" : "Generate code with AI (AI + Code)"}
                >
                  <span className={`material-symbols-outlined${generateLoading ? " spin" : ""}`}>
                    {generateLoading ? "sync" : "auto_awesome"}
                  </span>
                  Generate
                  {isGuest && <span className="material-symbols-outlined ai-gen-lock-icon">lock</span>}
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
              performance={performance}
              compact
              compileError={liveCheckError || result?.compile_error || null}
              breakpoints={breakpoints}
              onBreakpointsChange={onBreakpointsChange}
            />
          </div>
        </section>

        {/* ── Drag divider ── */}
        <div className="resize-divider" onMouseDown={onDividerMouseDown}>
          <div className="resize-handle-dots" />
        </div>

        {/* ── Right panel ── */}
        <section className="editor-page-right" style={{ flex: 1 }}>

          {/* ═══ PRIMARY ACTION BAR ═══ */}
          <div className="editor-action-bar">
            {/* Left group: primary run + debug */}
            <div className="action-bar-group action-bar-primary">
              <button
                className="action-btn action-btn--run"
                onClick={onRun}
                disabled={loading || aiLoading}
                title="Compile & Run (⌘↵)"
              >
                <span className={`material-symbols-outlined${loading ? " spin" : ""}`}>
                  {loading ? "sync" : "play_arrow"}
                </span>
                {loading ? "Running…" : "Run"}
                {!loading && <kbd className="action-btn-kbd">⌘↵</kbd>}
              </button>

              <div className="action-bar-sep" />

              <button
                className={`action-btn action-btn--debug${isDebugLocked ? " action-btn--locked" : ""}`}
                onClick={onAnalyze}
                disabled={loading || aiLoading}
                title={
                  !user || user.role === "guest"
                    ? "Sign in to unlock advanced debugging"
                    : !currentProject
                    ? "Open a project to enable the debugger"
                    : "Step-through debugger & execution flow"
                }
              >
                <span className="material-symbols-outlined">bug_report</span>
                Debug
                {isDebugLocked && <span className="material-symbols-outlined action-lock-icon">lock</span>}
              </button>
            </div>

            {/* Right group: AI tools */}
            <div className="action-bar-group action-bar-secondary">
              <button
                className={`action-btn action-btn--ai${isGuest ? " action-btn--locked" : ""}`}
                onClick={isGuest ? onSignIn : onExplain}
                disabled={!isGuest && (aiLoading || loading)}
                title={isGuest ? "Sign in to use AI Insights" : "Explain code with AI (⌘⇧E)"}
              >
                <span className={`material-symbols-outlined${aiLoading ? " spin" : ""}`}>
                  {aiLoading ? "sync" : "auto_awesome"}
                </span>
                Explain
                {isGuest && <span className="material-symbols-outlined action-lock-icon">lock</span>}
              </button>

              {performance && (
                <button
                  className={`action-btn action-btn--optimize${isGuest ? " action-btn--locked" : ""}`}
                  onClick={isGuest ? onSignIn : onOptimize}
                  disabled={!isGuest && (aiLoading || loading)}
                  title={isGuest ? "Sign in to optimize with AI" : "AI performance optimization"}
                >
                  <span className="material-symbols-outlined">speed</span>
                  Optimize
                  {isGuest && <span className="material-symbols-outlined action-lock-icon">lock</span>}
                </button>
              )}
            </div>
          </div>

          {/* ═══ TAB NAVIGATION ═══ */}
          <div className="editor-tab-bar">
            <div className="editor-tab-group">
              <button
                className={`editor-tab ${tab === "output" ? "active" : ""}`}
                onClick={() => setTab("output")}
              >
                <span className="material-symbols-outlined">terminal</span>
                Output
                {result && (
                  <span className={`tab-result-dot ${result.success ? "dot-success" : "dot-error"}`} />
                )}
              </button>
              <button
                className={`editor-tab ${tab === "ai" ? "active" : ""}`}
                onClick={() => setTab("ai")}
              >
                <span className="material-symbols-outlined">auto_awesome</span>
                AI Insights
                {aiLoading && <span className="editor-tab-spinner" />}
                {aiExplanation && !aiLoading && (
                  <span className="tab-result-dot dot-ai" />
                )}
              </button>
            </div>

            {/* Mini stdin label as context hint */}
            <div className="tab-bar-hint">
              {result ? (
                <span className={`tab-bar-status ${result.success ? "status-ok" : "status-fail"}`}>
                  <span className="material-symbols-outlined">
                    {result.success ? "check_circle" : "cancel"}
                  </span>
                  Exit {exitCode}
                </span>
              ) : (
                <span className="tab-bar-hint-text">
                  <span className="material-symbols-outlined">keyboard</span>
                  ? for shortcuts
                </span>
              )}
            </div>
          </div>

          {/* ═══ TAB CONTENT ═══ */}
          {tab === "output" ? (
            <div className="editor-output-tab">

              {/* stdin */}
              <div className="editor-page-card input-card">
                <div className="editor-page-subhead">
                  <div className="subhead-left">
                    <span className="material-symbols-outlined subhead-icon">input</span>
                    <h3>Program Input</h3>
                  </div>
                  <span className="subhead-badge">stdin</span>
                </div>
                <textarea
                  className="editor-input-textarea"
                  value={programInput}
                  onChange={(e) => onProgramInputChange(e.target.value)}
                  placeholder="Enter input values here…"
                  spellCheck="false"
                />
              </div>

              {/* stdout / stderr */}
              <div className="editor-page-card output-card">
                <div className="editor-page-subhead">
                  <div className="subhead-left">
                    <span className="material-symbols-outlined subhead-icon">terminal</span>
                    <h3>Execution Output</h3>
                  </div>
                  {result && (
                    <div className={`status-pill ${success ? "success" : "error"}`}>
                      <span className="material-symbols-outlined">
                        {success ? "check_circle" : "cancel"}
                      </span>
                      {success ? "SUCCESS" : "FAILED"} · Exit {exitCode}
                    </div>
                  )}
                </div>

                {error && (
                  <div className="editor-error-banner">
                    <span className="material-symbols-outlined">error</span>
                    <span><strong>Error:</strong> {error}</span>
                  </div>
                )}

                <div className="editor-output-grid">
                  <div className="editor-output-block">
                    <div className="output-block-head">
                      <span className="material-symbols-outlined">output</span>
                      <h4>stdout</h4>
                    </div>
                    <pre className={stdout ? "" : "output-empty"}>{stdout || "(no output)"}</pre>
                  </div>
                  {(stderr || !success) && (
                    <div className="editor-output-block output-block-stderr">
                      <div className="output-block-head">
                        <span className="material-symbols-outlined">error_outline</span>
                        <h4>stderr</h4>
                      </div>
                      <pre className={stderr ? "stderr-text" : "output-empty"}>{stderr || "(empty)"}</pre>
                    </div>
                  )}
                </div>
              </div>
            </div>

          ) : isGuest ? (
            <div className="editor-ai-gate">
              <div className="ai-gate-icon">
                <span className="material-symbols-outlined">auto_awesome</span>
              </div>
              <h3 className="ai-gate-title">AI Insights — Pro Only</h3>
              <p className="ai-gate-desc">
                Sign in to unlock AI code explanation, generation, optimization, and step-level insights.
              </p>
              <button className="ai-gate-btn" onClick={onSignIn}>
                <span className="material-symbols-outlined">login</span>
                Sign In to Unlock
              </button>
              <div className="ai-gate-perks">
                {['AI explain & generate', 'AI optimize', 'Step-level insights'].map(p => (
                  <span key={p} className="ai-gate-perk">
                    <span className="material-symbols-outlined">check_circle</span>{p}
                  </span>
                ))}
              </div>
            </div>

          ) : (
            <div className="editor-page-card editor-ai-panel">
              <AiExplanation data={aiExplanation} loading={aiLoading} />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
