import React, { useState, useCallback, useRef, useEffect } from "react";
import CodeEditor from "./components/CodeEditor";
import FlowVisualizer from "./components/FlowVisualizer";
import OutputPanel from "./components/OutputPanel";
import Header from "./components/Header";
import { analyzeCode } from "./services/api";
import "./App.css";

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
};

const DEFAULT_CODE = EXAMPLE_CODES.simple;

function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
    setCode(EXAMPLE_CODES[exampleKey]);
  };

  const handleAnalyze = useCallback(async () => {
    if (!code.trim()) {
      setError("Please enter some C code before analyzing.");
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
      const result = await analyzeCode(code, abortControllerRef.current.signal);
      setAnalysisResult(result);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Analysis failed");
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [code]);

  // Auto-analyze on initial load
  useEffect(() => {
    handleAnalyze();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="app">
      <Header onAnalyze={handleAnalyze} loading={loading} />
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
            </div>
          </div>
          <CodeEditor code={code} onChange={setCode} currentLine={currentLine} />
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
              {error}
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
    </div>
  );
}

export default App;
