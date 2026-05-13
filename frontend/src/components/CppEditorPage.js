import React from "react";
import CodeEditor from "./CodeEditor";
import FunctionHelper from "./FunctionHelper";
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

  const handleAddCode = (newSnippet) => {
    onCodeChange(code + newSnippet);
  };

  return (
    <main className="editor-page-main">
      <section className="editor-page-left">
        <div className="editor-page-card editor-card">
          <div className="editor-page-head">
            <h2>C++ Code Editor</h2>
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
          {loading ? "Running..." : "Compile & Run"}
        </button>

        <FunctionHelper onAddCode={handleAddCode} />

        <div className="editor-page-card input-card">
          <div className="editor-page-subhead">
            <h3>Input</h3>
            <span>stdin for cin / getline</span>
          </div>
          <textarea
            className="editor-input-textarea"
            value={programInput}
            onChange={(event) => onProgramInputChange(event.target.value)}
            placeholder={"Example:\n5 7\n"}
            spellCheck="false"
          />
        </div>

        <div className="editor-page-card output-card">
          <div className="editor-page-subhead">
            <h3>Output</h3>
            {result && <span>Exit: {exitCode}{success ? " ✓" : " ✗"}</span>}
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
