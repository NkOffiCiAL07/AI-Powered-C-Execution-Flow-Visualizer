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
        <div className="editor-hint" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>▶ Playing — currently on line {currentLine}</span>
          <button
            onClick={onEditRequest}
            style={{
              background: "rgba(78,204,163,0.15)",
              color: "#4ecca3",
              border: "2px solid #4ecca3",
              borderRadius: "6px",
              padding: "4px 12px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "700",
            }}
          >
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

