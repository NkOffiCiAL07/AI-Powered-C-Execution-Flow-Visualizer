import React, { useRef, useEffect } from "react";
import "../styles/CodeEditor.css";

export default function CodeEditor({ code, onChange, currentLine, onEditRequest }) {
  const lineRefs = useRef({});

  // Auto-scroll to the active line
  useEffect(() => {
    if (currentLine && lineRefs.current[currentLine]) {
      lineRefs.current[currentLine].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentLine]);

  const lines = code.split("\n");

  if (currentLine !== undefined && currentLine !== null) {
    return (
      <div className="code-editor">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", backgroundColor: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>▶ Playing — currently on line {currentLine}</span>
          <button className="edit-code-btn" onClick={onEditRequest}>
            ✏️ Edit Code
          </button>
        </div>
        <div className="code-viewer">
          {lines.map((line, idx) => {
            const lineNum = idx + 1;
            const isActive = lineNum === currentLine;
            return (
              <div
                key={idx}
                ref={(el) => { lineRefs.current[lineNum] = el; }}
                className={`code-line${isActive ? " active-line" : ""}`}
              >
                <span className="line-arrow">{isActive ? "➤" : ""}</span>
                <span className="line-number">{lineNum}</span>
                <span className="line-content">{line || " "}</span>
              </div>
            );
          })}
        </div>
        <div className="editor-info">
          Line: <span className="line-count">{currentLine}</span> of{" "}
          <span className="char-count">{lines.length}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="code-editor">
      <div className="editor-hint">✏️ Edit your code or load an example</div>
      <textarea
        className="editor-textarea"
        value={code}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter C code here..."
        spellCheck="false"
      />
      <div className="editor-info">
        Lines: <span className="line-count">{lines.length}</span>
        {" "}| Characters: <span className="char-count">{code.length}</span>
      </div>
    </div>
  );
}

