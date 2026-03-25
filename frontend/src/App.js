import React, { useState, useCallback, useRef, useEffect } from "react";
import CodeEditor from "./components/CodeEditor";
import FlowVisualizer from "./components/FlowVisualizer";
import OutputPanel from "./components/OutputPanel";
import Header from "./components/Header";
import CppEditorPage from "./components/CppEditorPage";
import { analyzeCode } from "./services/api";
import "./App.css";
import "./styles/CppEditorPage.css";

const EXAMPLE_CODES = {
  simple: `#include <iostream>
using namespace std;

int main() {
    int x = 5;
    int y = 3;
    int z = x + y;
    cout << "z = " << z << endl;
    return 0;
}`,
  counting: `#include <iostream>
using namespace std;

int main() {
    for (int i = 1; i <= 5; i++) {
        cout << i << endl;
    }
    return 0;
}`,
  ifStatement: `#include <iostream>
using namespace std;

int main() {
    int age = 12;
    if (age >= 13) {
        cout << "Teen" << endl;
    } else {
        cout << "Kid" << endl;
    }
    return 0;
}`,
  fibonacci: `#include <iostream>
#include <string>
#include <vector>
using namespace std;

int fibonacci(int n) {
    if (n <= 1) {
        return n;
    }
    int first = 0;
    int second = 1;
    for (int i = 2; i <= n; i++) {
        int next = first + second;
        first = second;
        second = next;
    }
    return second;
}

int main() {
    vector<int> values = {2, 4, 6};
    int total = 0;
    string label = "start";
    for (int index = 0; index < values.size(); index++) {
        int current = values[index];
        int fib = fibonacci(current);
        total += fib;
        if (fib % 2 == 0) {
            label = "even";
        } else {
            label = "odd";
        }
        cout << "fib(" << current << ")=" << fib << " label=" << label << endl;
    }
    cout << "total=" << total << endl;
    return 0;
}`,
};

const DEFAULT_CODE = EXAMPLE_CODES.simple;

function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [programInput, setProgramInput] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState("editor");
  const [activeTab, setActiveTab] = useState("flow");
  const [selectedExample, setSelectedExample] = useState("simple");
  const [currentLine, setCurrentLine] = useState(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleLoadExample = (exampleKey) => {
    setSelectedExample(exampleKey);
    const newCode = EXAMPLE_CODES[exampleKey];
    setCode(newCode);
    setCurrentLine(null);
    setAnalysisResult(null);
    setError(null);
  };

  const handleAnalyze = useCallback(async (codeOverride) => {
    const codeToAnalyze = typeof codeOverride === "string" ? codeOverride : code;
    if (!codeToAnalyze.trim()) {
      setError("Please enter some C++ code before analyzing.");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);
    setAnalysisResult(null);
    try {
      const result = await analyzeCode(codeToAnalyze, programInput, abortControllerRef.current.signal);
      setAnalysisResult(result);
      if (result.execution_mode === "output_only") {
        setActiveTab("output");
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Analysis failed");
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [code, programInput]);

  return (
    <div className="app">
      <Header
        onAnalyze={handleAnalyze}
        loading={loading}
        view={view}
        onSwitchView={setView}
      />

      {view === "editor" ? (
        <CppEditorPage
          code={code}
          onCodeChange={(newCode) => {
            setCode(newCode);
            setCurrentLine(null);
            setAnalysisResult(null);
            setError(null);
          }}
          programInput={programInput}
          onProgramInputChange={(value) => {
            setProgramInput(value);
            setCurrentLine(null);
            setAnalysisResult(null);
            setError(null);
          }}
          onRun={handleAnalyze}
          loading={loading}
          error={error}
          result={analysisResult}
        />
      ) : (
      <main className="app-main">
        <section className="editor-section">
          <div className="section-header">
            <h2>📝 Your Code</h2>
            <div className="examples-buttons">
              <button
                className={`example-btn ${selectedExample === "simple" ? "active" : ""}`}
                onClick={() => handleLoadExample("simple")}
              >
                Simple Math
              </button>
              <button
                className={`example-btn ${selectedExample === "counting" ? "active" : ""}`}
                onClick={() => handleLoadExample("counting")}
              >
                Counting Loop
              </button>
              <button
                className={`example-btn ${selectedExample === "ifStatement" ? "active" : ""}`}
                onClick={() => handleLoadExample("ifStatement")}
              >
                If Statement
              </button>
              <button
                className={`example-btn ${selectedExample === "fibonacci" ? "active" : ""}`}
                onClick={() => handleLoadExample("fibonacci")}
              >
                🔢 Fibonacci
              </button>
            </div>
          </div>
          <CodeEditor
            code={code}
            onChange={(newCode) => { setCode(newCode); setCurrentLine(null); setAnalysisResult(null); }}
            currentLine={currentLine}
            onEditRequest={() => { setCurrentLine(null); setAnalysisResult(null); }}
          />
          <div className="stdin-panel">
            <div className="stdin-header">
              <h3>Program Input</h3>
              <span>Optional stdin for `cin` or `getline`</span>
            </div>
            <textarea
              className="stdin-textarea"
              value={programInput}
              onChange={(event) => {
                setProgramInput(event.target.value);
                setCurrentLine(null);
                setAnalysisResult(null);
              }}
              placeholder={"Example:\n5\n10\nhello"}
              spellCheck="false"
            />
          </div>
        </section>
        <section className="visualizer-section">
          <div className="section-header">
            <div className="tab-bar" role="tablist" aria-label="View tabs">
              <button
                className={`tab ${activeTab === "flow" ? "active" : ""}`}
                onClick={() => setActiveTab("flow")}
                role="tab"
                id="tab-flow"
                aria-selected={activeTab === "flow"}
                aria-controls="panel-flow"
              >
                Execution Flow
              </button>
              <button
                className={`tab ${activeTab === "output" ? "active" : ""}`}
                onClick={() => setActiveTab("output")}
                role="tab"
                id="tab-output"
                aria-selected={activeTab === "output"}
                aria-controls="panel-output"
              >
                Output & Details
              </button>
            </div>
          </div>
          {error && (
            <div className="error-banner">
              <span>
                ⚠️ <strong>Error:</strong> {error}
              </span>
              <button
                className="error-dismiss"
                onClick={() => setError(null)}
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          )}
          {activeTab === "flow" ? (
            <div id="panel-flow" role="tabpanel" aria-labelledby="tab-flow">
              <FlowVisualizer result={analysisResult} loading={loading} onLineChange={setCurrentLine} code={code} />
            </div>
          ) : (
            <div id="panel-output" role="tabpanel" aria-labelledby="tab-output">
              <OutputPanel result={analysisResult} loading={loading} />
            </div>
          )}
        </section>
      </main>
      )}
    </div>
  );
}

export default App;
