import React, { useCallback, useEffect, useRef, useState } from "react";
import CodeEditor from "./CodeEditor";
import AiExplanation from "./AiExplanation";
import LangDropdown from "./LangDropdown";
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
}) {
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

  return (
    <main className="editor-page-main">
      {/* ── Left Sidebar: File Explorer ── */}
      {currentProject && (
        <aside className="editor-sidebar">
          <div className="sidebar-head">
            <span className="material-symbols-outlined">folder_open</span>
            Files
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

      {/* ── Content area: editor + divider + right (percentages relative to this, not full page) ── */}
      <div className="editor-content-wrap" ref={containerRef}>
      {/* ── Middle: code editor ── */}
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
            performance={performance}
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
      <section className="editor-page-right" style={{ flex: 1 }}>

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
              className="tab-action-btn tab-action-debug"
              onClick={onAnalyze}
              disabled={loading || aiLoading}
              title={!user || user.role === "guest" ? "Sign in to unlock advanced debugging" : !currentProject ? "Create a project to enable debugging" : "Start high-fidelity debugger"}
            >
              <span className="material-symbols-outlined">bug_report</span>
              Debug
              {(!user || user.role === "guest" || !currentProject) && (
                <span className="material-symbols-outlined tab-action-lock">lock</span>
              )}
            </button>

            <button
              className="tab-action-btn"
              onClick={onExplain}
              disabled={aiLoading || loading}
              title="AI Insights"
            >
              <span className={`material-symbols-outlined${aiLoading ? " spin" : ""}`}>
                {aiLoading ? "sync" : "auto_awesome"}
              </span>
            </button>

            {performance && (
              <button
                className="tab-action-btn"
                onClick={onOptimize}
                disabled={aiLoading || loading}
                title="Optimize with AI"
              >
                <span className="material-symbols-outlined">speed</span>
              </button>
            )}

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
      </div>{/* end editor-content-wrap */}
    </main>
  );
}
