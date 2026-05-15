import React from "react";
import CodeEditor from "./CodeEditor";
import "../styles/CppEditorPage.css";

export default function CppEditorPage({
  code,
  onCodeChange,
  programInput,
  onProgramInputChange,
  onRun,
  loading,
  error,
  result,
}) {
  const stdout = result?.stdout || "";
  const stderr = result?.stderr || "";
  const exitCode = result?.exit_code;
  const success = result?.success;

  return (
    <main className="editor-page-main">
      <section className="editor-page-left">
        <div className="editor-page-card editor-card">
          <div className="editor-page-head">
            <h2>C++ Code Editor</h2>
            {loading && <div className="loader-dots"><span>.</span><span>.</span><span>.</span></div>}
          </div>
          <CodeEditor
            code={code}
            onChange={onCodeChange}
            currentLine={null}
            onEditRequest={() => {}}
          />
        </div>
      </section>

      <section className="editor-page-right">
        <button
          className={`editor-run-btn ${loading ? "loading" : ""}`}
          onClick={() => onRun()}
          disabled={loading}
        >
          <span className="material-symbols-outlined">{loading ? 'sync' : 'play_arrow'}</span>
          {loading ? "Initializing..." : "Compile & Run"}
        </button>

        <div className="editor-page-card input-card">
          <div className="editor-page-subhead">
            <h3>Program Input</h3>
            <span>stdin / cin</span>
          </div>
          <textarea
            className="editor-input-textarea"
            value={programInput}
            onChange={(event) => onProgramInputChange(event.target.value)}
            placeholder={"Enter input values here..."}
            spellCheck="false"
          />
        </div>

        <div className="editor-page-card output-card">
          <div className="editor-page-subhead">
            <h3>Execution Output</h3>
            {result && (
              <div className={`status-pill ${success ? 'success' : 'error'}`}>
                {success ? 'SUCCESS' : 'FAILED'} (Exit: {exitCode})
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
      </section>
    </main>
  );
}
