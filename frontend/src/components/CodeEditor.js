import React, { useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import "../styles/CodeEditor.css";

/* eslint-disable no-template-curly-in-string */
const cppSnippets = [
  {
    label: "main",
    documentation: "Insert a standard C++ main function",
    insertText: [
      "#include <iostream>",
      "using namespace std;",
      "",
      "int main() {",
      "    ${1}",
      "    return 0;",
      "}"
    ].join("\n"),
  },
  {
    label: "for",
    documentation: "Insert a for loop",
    insertText: [
      "for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {",
      "    ${3}",
      "}"
    ].join("\n"),
  },
  {
    label: "if",
    documentation: "Insert an if statement",
    insertText: [
      "if (${1:condition}) {",
      "    ${2}",
      "}"
    ].join("\n"),
  },
  {
    label: "vector",
    documentation: "Insert a std::vector declaration",
    insertText: "vector<${1:int}> ${2:values};",
  },
  {
    label: "cout",
    documentation: "Insert a cout statement",
    insertText: 'cout << ${1:value} << endl;',
  },
  {
    label: "function",
    documentation: "Insert a function definition",
    insertText: [
      "${1:int} ${2:functionName}(${3:int arg}) {",
      "    ${4:// body}",
      "    return ${5:0};",
      "}"
    ].join("\n"),
  },
  {
    label: "call",
    documentation: "Insert a function call",
    insertText: "${1:functionName}(${2:args});",
  },
];
/* eslint-enable no-template-curly-in-string */

const editorOptions = {
  automaticLayout: true,
  autoIndent: "advanced",
  bracketPairColorization: { enabled: true },
  cursorBlinking: "smooth",
  cursorSmoothCaretAnimation: "on",
  fontFamily: 'JetBrains Mono, Monaco, Courier New, monospace',
  fontLigatures: true,
  fontSize: 14,
  formatOnPaste: true,
  formatOnType: true,
  guides: {
    bracketPairs: true,
    indentation: true,
  },
  lineHeight: 22,
  minimap: { enabled: true, renderCharacters: false, scale: 0.75 },
  padding: { top: 14, bottom: 14 },
  quickSuggestions: true,
  roundedSelection: false,
  scrollBeyondLastLine: false,
  scrollbar: {
    verticalScrollbarSize: 12,
    horizontalScrollbarSize: 12,
  },
  smoothScrolling: true,
  tabSize: 4,
  wordWrap: "on",
};

export default function CodeEditor({ code, onChange, currentLine, onEditRequest }) {
  const lineRefs = useRef({});
  const completionProviderRef = useRef(null);

  const handleEditorMount = (editor, monaco) => {
    monaco.editor.defineTheme("traceon-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "keyword",   foreground: "7C3AED" },
        { token: "string",    foreground: "2D6A4F" },
        { token: "number",    foreground: "B45309" },
        { token: "comment",   foreground: "9CA3AF", fontStyle: "italic" },
        { token: "type",      foreground: "B45309" },
        { token: "delimiter", foreground: "5A4A3C" },
        { token: "operator",  foreground: "C96A48" },
      ],
      colors: {
        "editor.background":               "#F7F3EE",
        "editor.foreground":               "#1A1310",
        "editor.lineHighlightBackground":  "#EDE8E010",
        "editorLineNumber.foreground":     "#B0A090",
        "editorLineNumber.activeForeground": "#C96A48",
        "editor.selectionBackground":      "#C96A4828",
        "editor.inactiveSelectionBackground": "#C96A4814",
        "editorCursor.foreground":         "#C96A48",
        "editorIndentGuide.background":    "#00000010",
        "editorIndentGuide.activeBackground": "#00000020",
        "editorWhitespace.foreground":     "#00000015",
      },
    });

    if (!completionProviderRef.current) {
      completionProviderRef.current = monaco.languages.registerCompletionItemProvider("cpp", {
        provideCompletionItems(model, position) {
          const wordUntilPosition = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: wordUntilPosition.startColumn,
            endColumn: wordUntilPosition.endColumn,
          };

          return {
            suggestions: cppSnippets.map((snippet) => ({
              label: snippet.label,
              kind: monaco.languages.CompletionItemKind.Snippet,
              documentation: snippet.documentation,
              insertText: snippet.insertText,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range,
            })),
          };
        },
      });
    }

    monaco.editor.setTheme("traceon-light");
    editor.focus();
  };

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
          <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>Playing — currently on line {currentLine}</span>
          <button className="edit-code-btn" onClick={onEditRequest}>
            Edit Code
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
      <div className="editor-hint">C++ editor with syntax highlighting, indentation, and bracket matching</div>
      <div className="editor-shell">
        <div className="editor-toolbar">
          <span className="editor-language-pill">C++</span>
          <span className="editor-toolbar-tip">Write code, then run the existing analyzer and visualizer</span>
        </div>
        <Editor
          className="monaco-editor-pane"
          height="100%"
          defaultLanguage="cpp"
          language="cpp"
          value={code}
          onChange={(value) => onChange(value ?? "")}
          onMount={handleEditorMount}
          options={editorOptions}
          theme="traceon-light"
        />
      </div>
      <div className="editor-info">
        Lines: <span className="line-count">{lines.length}</span>
        {" "}| Characters: <span className="char-count">{code.length}</span>
      </div>
    </div>
  );
}

