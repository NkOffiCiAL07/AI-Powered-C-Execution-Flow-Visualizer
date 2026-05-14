import React, { useState, useCallback, useRef, useEffect } from "react";
import CodeEditor from "./components/CodeEditor";
import FlowVisualizer from "./components/FlowVisualizer";
import OutputPanel from "./components/OutputPanel";
import Header from "./components/Header";
import AiExplanation from "./components/AiExplanation";
import CppEditorPage from "./components/CppEditorPage";
import LandingPage from "./components/LandingPage";
import DocsPage from "./components/DocsPage";
import PricingPage from "./components/PricingPage";
import CommunityPage from "./components/CommunityPage";
import { analyzeCode, runCode, stepAnalyzeSession, explainCode } from "./services/api";
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
  functionCall: `#include <iostream>
using namespace std;

int addNumbers(int a, int b) {
    int result = a + b;
    return result;
}

int main() {
    int x = 10;
    int y = 20;
    cout << "Calling function..." << endl;
    int sum = addNumbers(x, y);
    cout << "Sum: " << sum << endl;
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
  const [stepLoading, setStepLoading] = useState(false);
  const [view, setView] = useState("landing");
  const [activeTab, setActiveTab] = useState("flow");
  const [aiExplanation, setAiExplanation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedExample, setSelectedExample] = useState("simple");
  const [currentLine, setCurrentLine] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [runLoading, setRunLoading] = useState(false);
  const [runError, setRunError] = useState(null);
  const abortControllerRef = useRef(null);
  const aiAbortControllerRef = useRef(null);
  const stepAbortControllerRef = useRef(null);
  const runAbortControllerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (aiAbortControllerRef.current) {
        aiAbortControllerRef.current.abort();
      }
      if (stepAbortControllerRef.current) {
        stepAbortControllerRef.current.abort();
      }
      if (runAbortControllerRef.current) {
        runAbortControllerRef.current.abort();
      }
    };
  }, []);

  const handleExplain = useCallback(async () => {
    if (!code.trim()) {
      setError("Please enter some C++ code before explaining.");
      return;
    }

    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
    }
    aiAbortControllerRef.current = new AbortController();

    setAiLoading(true);
    setError(null);
    setActiveTab("ai");
    try {
      const result = await explainCode(code, aiAbortControllerRef.current.signal);
      setAiExplanation(result);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Explanation failed");
    } finally {
      setAiLoading(false);
      aiAbortControllerRef.current = null;
    }
  }, [code]);

  const handleLoadExample = (exampleKey) => {
    setSelectedExample(exampleKey);
    const newCode = EXAMPLE_CODES[exampleKey];
    setCode(newCode);
    setCurrentLine(null);
    setAnalysisResult(null);
    setAiExplanation(null);
    setError(null);
    setStepLoading(false);
  };

  const handleAnalyze = useCallback(async (codeOverride) => {
    const codeToAnalyze = typeof codeOverride === "string" ? codeOverride : code;
    if (!codeToAnalyze.trim()) {
      setError("Please enter some C++ code before analyzing.");
      return;
    }

    // Warn if code uses cin/scanf but no stdin input is provided
    const usesInput = /\b(cin\s*>>|getline\s*\(|scanf\s*\()/.test(codeToAnalyze);
    if (usesInput && !programInput.trim()) {
      setError("Your code reads input (cin/scanf/getline) but no input was provided. Please add input in the Program Input box below.");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setStepLoading(false);
    setError(null);
    setAnalysisResult(null);
    try {
      const result = await analyzeCode(codeToAnalyze, programInput, abortControllerRef.current.signal);
      setAnalysisResult(result);
      setActiveTab("flow");
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Analysis failed");
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [code, programInput]);

  const handleRun = useCallback(async () => {
    if (!code.trim()) {
      setRunError("Please enter some C++ code before running.");
      return;
    }

    // Warn if code uses cin/scanf but no stdin input is provided
    const usesInput = /\b(cin\s*>>|getline\s*\(|scanf\s*\()/.test(code);
    if (usesInput && !programInput.trim()) {
      setRunError("Your code reads input (cin/scanf/getline) but no input was provided. Please add input in the Input box.");
      return;
    }

    if (runAbortControllerRef.current) {
      runAbortControllerRef.current.abort();
    }
    runAbortControllerRef.current = new AbortController();

    setRunLoading(true);
    setRunError(null);
    setRunResult(null);
    try {
      const result = await runCode(code, programInput, runAbortControllerRef.current.signal);
      if (!result.success) {
        setRunError(result.compile_error || result.stderr || "Compilation failed");
      }
      setRunResult(result);
    } catch (err) {
      if (err.name === "AbortError") return;
      setRunError(err.message || "Run failed");
    } finally {
      setRunLoading(false);
      runAbortControllerRef.current = null;
    }
  }, [code, programInput]);

  const handleStep = useCallback(async (direction, stepType) => {
    if (!analysisResult?.session_id) {
      return;
    }

    if (stepAbortControllerRef.current) {
      stepAbortControllerRef.current.abort();
    }
    stepAbortControllerRef.current = new AbortController();

    setStepLoading(true);
    setError(null);

    try {
      const response = await stepAnalyzeSession(
        analysisResult.session_id,
        direction,
        stepType,
        stepAbortControllerRef.current.signal
      );

      setAnalysisResult((prev) => {
        if (!prev) return prev;
        const nextSnapshots = [...(prev.snapshots || [])];

        // Only update snapshots if the step was accepted
        if (response.accepted && response.snapshot && response.cursor >= 0) {
          if (response.cursor < nextSnapshots.length) {
            nextSnapshots[response.cursor] = response.snapshot;
          } else if (response.cursor === nextSnapshots.length) {
            nextSnapshots.push(response.snapshot);
          }
        }

        return {
          ...prev,
          status: response.status,
          cursor: response.accepted ? response.cursor : prev.cursor,
          snapshots: nextSnapshots,
          total_steps: response.total_recorded_steps,
          total_recorded_steps: response.total_recorded_steps,
          accepted: response.accepted,
          message: response.message || prev.message || "",
        };
      });

      if (!response.accepted && response.message && response.status !== "exited") {
        setError(response.message);
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Step failed");
      // Mark accepted as false so play loop stops
      setAnalysisResult((prev) => prev ? { ...prev, accepted: false } : prev);
    } finally {
      setStepLoading(false);
      stepAbortControllerRef.current = null;
    }
  }, [analysisResult]);

  const renderView = () => {
    switch (view) {
      case "landing":
        return <LandingPage onStart={() => setView("editor")} onSwitchView={setView} />;
      case "docs":
        return <DocsPage />;
      case "pricing":
        return <PricingPage />;
      case "community":
        return <CommunityPage />;
      case "editor":
        return (
          <CppEditorPage
            code={code}
            onCodeChange={(newCode) => {
              setCode(newCode);
              setCurrentLine(null);
              setAnalysisResult(null);
              setError(null);
              setStepLoading(false);
              setRunResult(null);
              setRunError(null);
            }}
            programInput={programInput}
            onProgramInputChange={(value) => {
              setProgramInput(value);
              setCurrentLine(null);
              setAnalysisResult(null);
              setError(null);
              setStepLoading(false);
              setRunResult(null);
              setRunError(null);
            }}
            onRun={handleRun}
            loading={runLoading}
            error={runError}
            result={runResult}
          />
        );
      case "visualizer":
        return (
          <main className="app-main">
            <section className="editor-section">
              <div className="section-header">
                <h2>Your Code</h2>
                <div className="examples-selector-container">
                  <span className="selector-label">Examples:</span>
                  <select 
                    className="example-dropdown"
                    value={selectedExample}
                    onChange={(e) => handleLoadExample(e.target.value)}
                  >
                    <option value="simple">Simple Math</option>
                    <option value="counting">Counting Loop</option>
                    <option value="ifStatement">If Statement</option>
                    <option value="fibonacci">Fibonacci</option>
                    <option value="functionCall">Function Call</option>
                  </select>
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
                    setStepLoading(false);
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
                    className={`tab ${activeTab === "ai" ? "active" : ""}`}
                    onClick={() => setActiveTab("ai")}
                    role="tab"
                    id="tab-ai"
                    aria-selected={activeTab === "ai"}
                    aria-controls="panel-ai"
                  >
                    AI Insights
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
                    <strong>Error:</strong> {error}
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
                  <FlowVisualizer
                    result={analysisResult}
                    loading={loading}
                    stepLoading={stepLoading}
                    onLineChange={setCurrentLine}
                    code={code}
                    onNext={(stepType) => handleStep("next", stepType)}
                    onBack={() => handleStep("back")}
                  />
                </div>
              ) : activeTab === "ai" ? (
                <div id="panel-ai" role="tabpanel" aria-labelledby="tab-ai">
                  <AiExplanation data={aiExplanation} loading={aiLoading} />
                </div>
              ) : (
                <div id="panel-output" role="tabpanel" aria-labelledby="tab-output">
                  <OutputPanel result={analysisResult} loading={loading} />
                </div>
              )}
            </section>
          </main>
        );
      default:
        return <LandingPage onStart={() => setView("editor")} onSwitchView={setView} />;
    }
  };

  return (
    <div className="app">
      {view !== "landing" && (
        <Header
          onAnalyze={handleAnalyze}
          onExplain={handleExplain}
          loading={loading}
          aiLoading={aiLoading}
          view={view}
          onSwitchView={setView}
        />
      )}
      {renderView()}
    </div>
  );
}

export default App;
