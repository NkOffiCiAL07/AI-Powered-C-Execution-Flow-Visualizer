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
import LoginModal from "./components/LoginModal";
import DashboardPage from "./components/DashboardPage";
import DebuggerRestricted from "./components/DebuggerRestricted";
import MemorySpectrometer from "./components/MemorySpectrometer";
import { 
  analyzeCode, runCode, stepAnalyzeSession, explainCode, generateCode, 
  updateFile, deleteFile, fetchProject, fetchFiles, createFile, fetchPublicProject, API_BASE_URL 
} from "./services/api";
import "./App.css";
import "./styles/CppEditorPage.css";

// Captured once at module load — before React StrictMode double-mounts any
// effects and before the URL-sync effect can overwrite window.location.search.
const _initialParams = new URLSearchParams(window.location.search);

// Decode JWT payload and merge role / user_id into the stored user object.
// Guests always get role:"guest"; authenticated users get role from the token
// (defaults to "member" if the backend doesn't set it yet).
function normalizeUser(userData, token) {
  if (userData.provider === "guest" || userData.role === "guest") {
    return { ...userData, role: "guest" };
  }
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return {
        ...userData,
        role: payload.role || "member",
        user_id: payload.sub || payload.user_id || userData.id,
      };
    } catch {}
  }
  return { ...userData, role: "member" };
}

const DEFAULT_CODES = {
  cpp: `#include <iostream>
using namespace std;

int main() {
    int x = 5;
    int y = 3;
    int z = x + y;
    cout << "z = " << z << endl;
    return 0;
}`,
  c: `#include <stdio.h>

int main() {
    int x = 5;
    int y = 3;
    int z = x + y;
    printf("z = %d\\n", z);
    return 0;
}`,
  python: `def main():
    x = 5
    y = 3
    z = x + y
    print(f"z = {z}")

if __name__ == "__main__":
    main()`,
  java: `public class Main {
    public static void main(String[] args) {
        int x = 5;
        int y = 3;
        int z = x + y;
        System.out.println("z = " + z);
    }
}`,
};

const LANG_OPTIONS = [
  { value: "cpp",    label: "C++"    },
  { value: "c",      label: "C"      },
  { value: "python", label: "Python" },
  { value: "java",   label: "Java"   },
];

function LangDropdown({ language, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LANG_OPTIONS.find(o => o.value === language);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="ex-dropdown" ref={ref}>
      <button className="ex-dropdown-trigger" onClick={() => setOpen(o => !o)}>
        <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--primary)" }}>code</span>
        {current?.label}
        <span className="material-symbols-outlined ex-chevron" style={{ transform: open ? "rotate(180deg)" : "none" }}>expand_more</span>
      </button>
      {open && (
        <ul className="ex-dropdown-menu">
          {LANG_OPTIONS.map(opt => (
            <li key={opt.value}
              className={`ex-dropdown-item ${opt.value === language ? "active" : ""}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}>
              {opt.value === language && <span className="material-symbols-outlined ex-check">check</span>}
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


function App() {
  const [user, setUser] = useState(null);
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState(DEFAULT_CODES.cpp);
  const [programInput, setProgramInput] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stepLoading, setStepLoading] = useState(false);
  const [view, setView] = useState("landing");
  const [activeTab, setActiveTab] = useState("flow");
  const [aiExplanation, setAiExplanation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [currentLine, setCurrentLine] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [runLoading, setRunLoading] = useState(false);
  const [runError, setRunError] = useState(null);
  const [generateLoading, setGenerateLoading] = useState(false);
  const generateAbortRef = useRef(null);
  const [showDebugGenPrompt, setShowDebugGenPrompt] = useState(false);
  const [debugGenPrompt, setDebugGenPrompt] = useState("");
  const debugGenInputRef = useRef(null);
  const [serverDown, setServerDown] = useState(false);
  const [serverChecking, setServerChecking] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [sessionExpiredBanner, setSessionExpiredBanner] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const abortControllerRef = useRef(null);
  const aiAbortControllerRef = useRef(null);
  const stepAbortControllerRef = useRef(null);
  const runAbortControllerRef = useRef(null);

  // Debugger panel resize
  const [debugLeftPct, setDebugLeftPct] = useState(40);
  const debugDragging = useRef(false);
  const debugContainerRef = useRef(null);
  const onDebugDividerMouseDown = useCallback((e) => {
    e.preventDefault();
    debugDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const onMove = (ev) => {
      if (!debugDragging.current || !debugContainerRef.current) return;
      const rect = debugContainerRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setDebugLeftPct(Math.min(Math.max(pct, 20), 75));
    };
    const onUp = () => {
      debugDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, []);

  const checkServer = useCallback(async () => {
    setServerChecking(true);
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) setServerDown(false);
      else setServerDown(true);
    } catch {
      setServerDown(true);
    } finally {
      setServerChecking(false);
    }
  }, []);

  useEffect(() => { checkServer(); }, [checkServer]);
  useEffect(() => {
    if (!serverDown) return;
    const id = setInterval(checkServer, 8000);
    return () => clearInterval(id);
  }, [serverDown, checkServer]);

  useEffect(() => {
    if (!user && (view === "editor" || view === "visualizer")) {
      setView("landing");
    }
  }, [user, view]);

  // Listen for 401 responses fired by apiFetch in api.js
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setView("landing");
      setSessionExpiredBanner(true);
    };
    window.addEventListener("traceon:session-expired", onExpired);
    return () => window.removeEventListener("traceon:session-expired", onExpired);
  }, []);

  useEffect(() => {
    // Use module-level snapshot — immune to StrictMode double-mount and to
    // replaceState calls made by the URL-sync effect between the two mounts.
    const urlView = _initialParams.get("v");
    const urlPid  = _initialParams.get("pid");
    const urlFid  = _initialParams.get("fid");

    // Restore hash-based code share (existing feature)
    try {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const lang = hash.get("lang");
      const encoded = hash.get("code");
      if (lang && ["cpp", "c", "python", "java"].includes(lang)) {
        setLanguage(lang);
        if (encoded) setCode(decodeURIComponent(escape(atob(encoded))));
      }
    } catch {}

    // Restore user from localStorage
    let restoredUser = null;
    const savedUser  = localStorage.getItem("traceon_user");
    const savedToken = localStorage.getItem("traceon_auth_token");

    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.provider === "guest" || parsed.role === "guest") {
          restoredUser = normalizeUser(parsed, null);
          setUser(restoredUser);
        } else if (savedToken) {
          const payload = JSON.parse(atob(savedToken.split(".")[1]));
          if (payload.exp && payload.exp * 1000 > Date.now()) {
            restoredUser = normalizeUser(parsed, savedToken);
            setUser(restoredUser);
          } else {
            localStorage.removeItem("traceon_user");
            localStorage.removeItem("traceon_auth_token");
          }
        } else {
          localStorage.removeItem("traceon_user");
        }
      } catch {
        localStorage.removeItem("traceon_user");
        localStorage.removeItem("traceon_auth_token");
      }
    }

    // Restore view from URL params (only when a valid session exists)
    let projCtrl = null;

    if (urlView === "view" && urlPid) {
      // P9.1: Public read-only view
      setView("editor"); // Map view → editor but with restricted props
      projCtrl = new AbortController();
      (async () => {
        try {
          const data = await fetchPublicProject(urlPid, projCtrl.signal);
          const project = data.project;
          const files   = data.files || [];
          const file    = urlFid ? (files.find(f => f.id === urlFid) || files[0]) : files[0];
          if (project && file) {
            handleOpenProject({ project, files, activeFileId: file.id });
          }
        } catch {}
      })();
    } else if (restoredUser) {
      const isMember = restoredUser.role === "member";

      if (urlView === "dashboard" && isMember) {
        setView("dashboard");

      } else if (urlView === "docs" || urlView === "pricing" || urlView === "community") {
        setView(urlView);

      } else if (urlView === "editor" || urlView === "visualizer") {
        // Visualizer can't be replayed from URL — restore as editor
        setView("editor");
        if (urlPid && isMember) {
          projCtrl = new AbortController();
          (async () => {
            try {
              const [projData, filesData] = await Promise.all([
                fetchProject(urlPid, projCtrl.signal),
                fetchFiles(urlPid, projCtrl.signal),
              ]);
              const project = projData.project;
              const files   = filesData.files || [];
              const file    = urlFid ? (files.find(f => f.id === urlFid) || files[0]) : files[0];
              if (project && file) {
                handleOpenProject({ project, files, activeFileId: file.id });
              }
            } catch (err) {
              if (err.name !== "AbortError") {
                // Project was deleted or inaccessible — stay in plain editor
              }
            }
          })();
        }

      } else {
        // No URL view param -> keep the default "landing" view even if logged in.
        // Users should click "Launch App" to enter their workspace.
        setView("landing");
      }
    }

    return () => {
      if (abortControllerRef.current)    abortControllerRef.current.abort();
      if (aiAbortControllerRef.current)  aiAbortControllerRef.current.abort();
      if (stepAbortControllerRef.current) stepAbortControllerRef.current.abort();
      if (runAbortControllerRef.current) runAbortControllerRef.current.abort();
      if (projCtrl) projCtrl.abort();
    };
  }, []);

  // Sync view + project → URL so refresh restores the same screen
  useEffect(() => {
    const params = new URLSearchParams();
    const SYNCABLE = ["dashboard", "editor", "visualizer", "docs", "pricing", "community"];
    if (SYNCABLE.includes(view)) {
      params.set("v", view);
      if ((view === "editor" || view === "visualizer") && currentProject?.project) {
        params.set("pid", currentProject.project.id);
        if (currentProject.activeFileId) params.set("fid", currentProject.activeFileId);
      }
    }
    const search = params.toString() ? "?" + params.toString() : "";
    const hash   = window.location.hash;
    window.history.replaceState(null, "", (search || window.location.pathname) + hash);
  }, [view, currentProject]);

  const handleLogin = (userData, token) => {
    const normalized = normalizeUser(userData, token);
    setUser(normalized);
    localStorage.setItem("traceon_user", JSON.stringify(normalized));
    if (token) localStorage.setItem("traceon_auth_token", token);
    setSessionExpiredBanner(false);
    // Guests go straight to sandbox; members land on their dashboard
    setView(normalized.role === "guest" ? "editor" : "dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentProject(null);
    localStorage.removeItem("traceon_user");
    localStorage.removeItem("traceon_auth_token");
    setView("landing");
  };

  // Open a saved project in the editor
  const handleOpenProject = ({ project, files = [], activeFileId = null }) => {
    const activeFile = activeFileId 
      ? (files.find(f => f.id === activeFileId) || files[0]) 
      : files[0];
    
    setCurrentProject({ project, files, activeFileId: activeFile?.id });
    setLanguage(activeFile?.language || project.language || "cpp");
    setCode(activeFile?.code || "");

    // P9.2: Restore pre-computed snapshots if they exist
    if (activeFile?.last_snapshots?.length > 0) {
      setAnalysisResult({
        session_id: `restored_${activeFile.id}`,
        status: "exited",
        cursor: 0,
        total_recorded_steps: activeFile.last_snapshots.length,
        snapshots: activeFile.last_snapshots,
        total_steps: activeFile.last_snapshots.length,
        execution_mode: "restored",
      });
      setActiveTab("flow");
    } else {
      setAnalysisResult(null);
    }

    setError(null);
    setRunResult(null);
    setRunError(null);
    setCurrentLine(null);
    setView("editor");
  };

  const handleFileSwitch = (fileId) => {
    if (!currentProject) return;
    const file = currentProject.files.find(f => f.id === fileId);
    if (!file) return;

    // Save current work before switching? (Optional but good)
    // handleSave(); 

    setCurrentProject(prev => ({ ...prev, activeFileId: fileId }));
    setLanguage(file.language || currentProject.project.language || "cpp");
    setCode(file.code || "");

    // Phase 9.2: Restore snapshots for the new file
    if (file.last_snapshots?.length > 0) {
      setAnalysisResult({
        session_id: `restored_${file.id}`,
        status: "exited",
        cursor: 0,
        total_recorded_steps: file.last_snapshots.length,
        snapshots: file.last_snapshots,
        total_steps: file.last_snapshots.length,
        execution_mode: "restored",
      });
      setActiveTab("flow");
    } else {
      setAnalysisResult(null);
    }

    setError(null);
    setRunResult(null);
    setRunError(null);
    setCurrentLine(null);
  };

  const handleFileCreate = async (name) => {
    if (!currentProject) return;
    const { project } = currentProject;
    
    // Simple extension detection
    const ext = name.split('.').pop().toLowerCase();
    const lang = ext === 'py' ? 'python' : ext === 'java' ? 'java' : ext === 'c' ? 'c' : 'cpp';
    
    try {
      setLoading(true);
      const { file } = await createFile(project.id, name, lang, DEFAULT_CODES[lang] || "");
      setCurrentProject(prev => ({
        ...prev,
        files: [...prev.files, file],
        activeFileId: file.id
      }));
      setLanguage(lang);
      setCode(file.code || "");
      setAnalysisResult(null);
      setError(null);
      setRunResult(null);
      setRunError(null);
      setCurrentLine(null);
    } catch (err) {
      setError(err.message || "Failed to create file");
    } finally {
      setLoading(false);
    }
  };

  const handleFileDelete = async (fileId) => {
    if (!currentProject || currentProject.files.length <= 1) {
      alert("Projects must have at least one file.");
      return;
    }
    if (!window.confirm("Delete this file? This cannot be undone.")) return;

    const { project } = currentProject;
    try {
      await deleteFile(project.id, fileId);
      
      setCurrentProject(prev => {
        const nextFiles = prev.files.filter(f => f.id !== fileId);
        let nextActiveId = prev.activeFileId;
        
        if (nextActiveId === fileId) {
          nextActiveId = nextFiles[0]?.id;
          const nextActiveFile = nextFiles[0];
          setLanguage(nextActiveFile?.language || project.language || "cpp");
          setCode(nextActiveFile?.code || "");
        }
        
        return { ...prev, files: nextFiles, activeFileId: nextActiveId };
      });
    } catch (err) {
      alert(err.message || "Failed to delete file");
    }
  };

  // Save current code back to the open project file
  const handleSave = useCallback(async () => {
    if (!currentProject?.activeFileId || !currentProject?.project) return;
    const { project, activeFileId, files } = currentProject;
    const file = files.find(f => f.id === activeFileId);
    if (!file) return;

    try {
      await updateFile(project.id, file.id, file.name, language, code);
      // Update the file in our local list
      setCurrentProject(prev => ({
        ...prev,
        files: prev.files.map(f => f.id === activeFileId ? { ...f, language, code } : f)
      }));
    } catch (err) {
      console.error("Auto-save failed:", err);
    }
  }, [currentProject, language, code]);

  // Phase 9.1: Copy permanent share link for a project/file
  const handleCopyProjectShareLink = useCallback(() => {
    if (!currentProject?.project?.id || !currentProject?.activeFileId) return;
    const url = new URL(window.location.origin);
    url.searchParams.set("v", "view");
    url.searchParams.set("pid", currentProject.project.id);
    url.searchParams.set("fid", currentProject.activeFileId);
    navigator.clipboard.writeText(url.toString());
  }, [currentProject]);

  // Phase 7.2: Auto-save effect
  useEffect(() => {
    if (!currentProject || view !== "editor") return;
    
    const activeFile = currentProject.files?.find(f => f.id === currentProject.activeFileId);
    if (!activeFile) return;

    // Only save if code or language has changed relative to what's in the project record
    const hasChanges = code !== activeFile.code || language !== activeFile.language;
    if (!hasChanges) return;

    const timer = setTimeout(() => {
      handleSave();
    }, 2000); // 2 second debounce

    return () => clearTimeout(timer);
  }, [code, language, currentProject, view, handleSave]);

  const handleExplain = useCallback(async () => {
    if (!code.trim()) {
      setError(`Please enter some ${language.toUpperCase()} code before explaining.`);
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
      const result = await explainCode(code, aiAbortControllerRef.current.signal, language);
      setAiExplanation(result);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Explanation failed");
    } finally {
      setAiLoading(false);
      aiAbortControllerRef.current = null;
    }
  }, [code, language]);

  const handleExportTrace = useCallback(() => {
    if (!analysisResult) return;
    const data = {
      exported_at: new Date().toISOString(),
      language,
      code,
      total_steps: analysisResult.total_recorded_steps,
      snapshots: analysisResult.snapshots,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `traceon-${language}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [analysisResult, language, code]);

  const handleCopyShareLink = useCallback(() => {
    try {
      const hash = new URLSearchParams();
      hash.set("lang", language);
      if (code.length <= 2000) {
        hash.set("code", btoa(unescape(encodeURIComponent(code))));
      }
      window.history.replaceState(null, "", `#${hash.toString()}`);
      navigator.clipboard.writeText(window.location.href);
    } catch {}
  }, [language, code]);

  const handleGenerate = useCallback(async (prompt) => {
    if (!prompt.trim()) return;
    if (generateAbortRef.current) generateAbortRef.current.abort();
    generateAbortRef.current = new AbortController();
    setGenerateLoading(true);
    try {
      const result = await generateCode(prompt, language, generateAbortRef.current.signal);
      setCode(result.code);
      setCurrentLine(null);
      setAnalysisResult(null);
      setRunResult(null);
      setRunError(null);
      setError(null);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Code generation failed");
    } finally {
      setGenerateLoading(false);
      generateAbortRef.current = null;
    }
  }, [language]);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setCode(DEFAULT_CODES[newLang] || "");
    setCurrentLine(null);
    setAnalysisResult(null);
    setAiExplanation(null);
    setError(null);
    setRunResult(null);
    setRunError(null);
    setStepLoading(false);
  };

  const handleAnalyze = useCallback(async (codeOverride) => {
    const codeToAnalyze = typeof codeOverride === "string" ? codeOverride : code;
    if (!codeToAnalyze.trim()) {
      setError(`Please enter some ${language.toUpperCase()} code before analyzing.`);
      return;
    }

    const usesInput = language === "python"
      ? /\binput\s*\(/.test(codeToAnalyze)
      : language === "java"
      ? /\b(Scanner|BufferedReader|nextInt|nextLine|nextDouble|readLine)\s*\(/.test(codeToAnalyze)
      : language === "cpp"
      ? /\b(cin\s*>>|getline\s*\(|scanf\s*\()/.test(codeToAnalyze)
      : /\b(scanf\s*\(|gets\s*\(|fgets\s*\()/.test(codeToAnalyze);

    if (usesInput && !programInput.trim()) {
      setError("Your code reads input but no input was provided. Please add input in the Program Input box below.");
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
      const result = await analyzeCode(
        codeToAnalyze, 
        programInput, 
        abortControllerRef.current.signal, 
        language,
        currentProject?.project?.id,
        currentProject?.activeFileId
      );
      setServerDown(false);
      setAnalysisResult(result);
      if (result.performance) {
        setPerformanceMetrics(result.performance);
      } else {
        setPerformanceMetrics(null);
      }
      setActiveTab("flow");
    } catch (err) {
      if (err.name === "AbortError") return;
      if (err.message?.includes("Cannot connect")) setServerDown(true);
      setError(err.message || "Analysis failed");
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [code, programInput, language, currentProject]);

  const handleRun = useCallback(async () => {
    if (!code.trim()) {
      setRunError(`Please enter some ${language.toUpperCase()} code before running.`);
      return;
    }

    const usesInput = language === "python"
      ? /\binput\s*\(/.test(code)
      : language === "java"
      ? /\b(Scanner|BufferedReader|nextInt|nextLine|nextDouble|readLine)\s*\(/.test(code)
      : language === "cpp"
      ? /\b(cin\s*>>|getline\s*\(|scanf\s*\()/.test(code)
      : /\b(scanf\s*\(|gets\s*\(|fgets\s*\()/.test(code);

    if (usesInput && !programInput.trim()) {
      setRunError("Your code reads input but no input was provided. Please add input in the Input box.");
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
      const result = await runCode(code, programInput, runAbortControllerRef.current.signal, language);
      setServerDown(false);
      if (!result.success) {
        setRunError(result.compile_error || result.stderr || "Compilation failed");
      }
      setRunResult(result);
    } catch (err) {
      if (err.name === "AbortError") return;
      if (err.message?.includes("Cannot connect")) setServerDown(true);
      setRunError(err.message || "Run failed");
    } finally {
      setRunLoading(false);
      runAbortControllerRef.current = null;
    }
  }, [code, programInput, language]);

  const handleExplainStep = useCallback(async (snapshot) => {
    if (!snapshot) return;
    const line = snapshot.location?.line;
    const prompt = `I am debugging my ${language} code. At line ${line}, the variables are: ${JSON.stringify(snapshot.variables)}. What exactly is happening here and why did the variables change like this?`;
    
    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
    }
    aiAbortControllerRef.current = new AbortController();

    setAiLoading(true);
    setError(null);
    setActiveTab("ai");
    try {
      const result = await generateCode(prompt, language, aiAbortControllerRef.current.signal);
      // Hack: we reuse AiExplanation which expects explainCode format. We'll map the raw response to explanation field.
      setAiExplanation({
        explanation: result.code || result.explanation || "No explanation provided.",
        time_complexity: "N/A (Step-level analysis)",
        space_complexity: "N/A (Step-level analysis)",
        key_points: ["Step-level execution analysis"]
      });
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Step explanation failed");
    } finally {
      setAiLoading(false);
      aiAbortControllerRef.current = null;
    }
  }, [language]);

  const handleOptimizePerformance = useCallback(async () => {
    if (!code.trim() || !performanceMetrics) {
      setError("Please run the debugger first to collect performance data.");
      return;
    }

    const hotPath = Object.entries(performanceMetrics.line_hits || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([line, hits]) => `Line ${line} (hit ${hits} times)`)
      .join(", ");

    const prompt = `I have a ${language} program with performance bottlenecks. The hottest paths are: ${hotPath}. Total execution time: ${performanceMetrics.total_execution_time_ms.toFixed(2)}ms. Please suggest specific algorithmic optimizations for these hotspots.`;
    
    if (aiAbortControllerRef.current) {
      aiAbortControllerRef.current.abort();
    }
    aiAbortControllerRef.current = new AbortController();

    setAiLoading(true);
    setError(null);
    setActiveTab("ai");
    try {
      const result = await generateCode(prompt, language, aiAbortControllerRef.current.signal);
      setAiExplanation({
        explanation: result.code || result.explanation || "No optimization suggestions provided.",
        time_complexity: "N/A (Performance Audit)",
        space_complexity: "N/A (Performance Audit)",
        key_points: ["Performance Hotspot Analysis", ...hotPath.split(", ")]
      });
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Optimization audit failed");
    } finally {
      setAiLoading(false);
      aiAbortControllerRef.current = null;
    }
  }, [code, language, performanceMetrics]);

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

      if (response.performance) {
        setPerformanceMetrics(response.performance);
      }

      setAnalysisResult((prev) => {
        if (!prev) return prev;
        const nextSnapshots = [...(prev.snapshots || [])];

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
      setAnalysisResult((prev) => prev ? { ...prev, accepted: false } : prev);
    } finally {
      setStepLoading(false);
      stepAbortControllerRef.current = null;
    }
  }, [analysisResult]);

  const renderView = () => {
    switch (view) {
      case "landing":
        return <LandingPage onStart={() => setView("editor")} onSwitchView={setView} onLogin={handleLogin} />;
      case "dashboard":
        return (
          <DashboardPage
            user={user}
            onLogout={handleLogout}
            onOpenProject={handleOpenProject}
            onOpenPlayground={() => { setCurrentProject(null); setView("editor"); }}
            onSwitchView={setView}
          />
        );
      case "docs":
        return <DocsPage />;
      case "pricing":
        return <PricingPage onStart={() => setView("editor")} />;
      case "community":
        return <CommunityPage onStart={() => setView("editor")} />;
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
            onAnalyze={() => {
              if (!user || user.role === "guest") {
                setShowLoginModal(true);
              } else if (!currentProject) {
                setView("dashboard");
              } else {
                handleAnalyze();
              }
            }}
            onExplain={handleExplain}
            onOptimize={handleOptimizePerformance}
            onSave={currentProject ? handleSave : null}
            onBackToDashboard={currentProject ? () => setView("dashboard") : null}
            currentProject={currentProject}
            user={user}
            loading={runLoading}
            error={runError}
            result={runResult}
            aiExplanation={aiExplanation}
            aiLoading={aiLoading}
            performance={performanceMetrics}
            language={language}
            onLanguageChange={handleLanguageChange}
            onGenerate={handleGenerate}
            generateLoading={generateLoading}
            onFileSwitch={handleFileSwitch}
            onFileCreate={handleFileCreate}
            onFileDelete={handleFileDelete}
          />
        );
      case "visualizer":
        const isGuest = !user || user.role === "guest";
        const noProject = !currentProject;

        return (
          <main className="app-main" ref={debugContainerRef}>
            <section className="editor-section" style={{ width: `${debugLeftPct}%`, flex: "none", position: "relative" }}>
              {/* ── AI Generate overlay (debugger mode) ── */}
              {showDebugGenPrompt && (
                <div className="ai-prompt-overlay" onClick={() => setShowDebugGenPrompt(false)}>
                  <div className="ai-prompt-modal" onClick={(e) => e.stopPropagation()}>
                    <span className="material-symbols-outlined ai-prompt-modal-icon">auto_awesome</span>
                    <input
                      ref={debugGenInputRef}
                      className="ai-prompt-modal-input"
                      type="text"
                      value={debugGenPrompt}
                      onChange={(e) => setDebugGenPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && debugGenPrompt.trim()) {
                          handleGenerate(debugGenPrompt);
                          setDebugGenPrompt("");
                          setShowDebugGenPrompt(false);
                        }
                        if (e.key === "Escape") setShowDebugGenPrompt(false);
                      }}
                      placeholder={`Describe what you want to build in ${language === "c" ? "C" : language === "python" ? "Python" : language === "java" ? "Java" : "C++"}…`}
                      disabled={generateLoading}
                      spellCheck="false"
                      autoFocus
                    />
                    <button
                      className="ai-prompt-modal-btn"
                      onClick={() => {
                        if (debugGenPrompt.trim()) {
                          handleGenerate(debugGenPrompt);
                          setDebugGenPrompt("");
                          setShowDebugGenPrompt(false);
                        }
                      }}
                      disabled={generateLoading || !debugGenPrompt.trim()}
                    >
                      {generateLoading
                        ? <span className="material-symbols-outlined spin">sync</span>
                        : <span className="material-symbols-outlined">send</span>}
                    </button>
                  </div>
                </div>
              )}
              <div className="section-header">
                <div className="section-header-title">
                  <span className="material-symbols-outlined section-header-icon">code</span>
                  <h2>Your Code</h2>
                </div>
                <div className="examples-selector-container">
                  <button
                    className="ai-gen-trigger"
                    onClick={() => {
                      setShowDebugGenPrompt(true);
                      setTimeout(() => debugGenInputRef.current?.focus(), 30);
                    }}
                    disabled={generateLoading}
                    title="Generate code with AI"
                  >
                    <span className={`material-symbols-outlined${generateLoading ? " spin" : ""}`}>
                      {generateLoading ? "sync" : "auto_awesome"}
                    </span>
                    AI + Code
                  </button>
                  <LangDropdown language={language} onChange={handleLanguageChange} />
                </div>
              </div>
              <CodeEditor
                code={code}
                onChange={(newCode) => { setCode(newCode); setCurrentLine(null); setAnalysisResult(null); setError(null); }}
                currentLine={currentLine}
                onEditRequest={() => { setCurrentLine(null); setAnalysisResult(null); }}
                language={language}
                compact
                compileError={error}
              />
              <div className="stdin-panel">
                <div className="stdin-header">
                  <h3>Program Input</h3>
                  <span>Optional stdin for `cin`, `input()`, `Scanner`, etc.</span>
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
            <div className="resize-divider" onMouseDown={onDebugDividerMouseDown}>
              <div className="resize-handle-dots" />
            </div>
            <section className="visualizer-section" style={{ flex: 1, minWidth: 0 }}>
              {isGuest ? (
                <DebuggerRestricted 
                  reason="Authentication is required to access high-fidelity execution visualization and interactive memory mapping."
                  actionLabel="Sign in with Google"
                  onAction={() => setShowLoginModal(true)}
                />
              ) : noProject ? (
                <DebuggerRestricted 
                  reason="To use the advanced debugger, you must first create or open a project from your dashboard."
                  actionLabel="Open Dashboard"
                  onAction={() => setView("dashboard")}
                  secondaryActionLabel="Return to Editor"
                  onSecondaryAction={() => setView("editor")}
                />
              ) : (
                <>
                  <div className="section-header">
                <div className="tab-bar" role="tablist" aria-label="View tabs">
                  {[
                    { id: "flow",   label: "Execution Flow",      icon: "account_tree" },
                    { id: "memory", label: "Memory Spectrometer", icon: "memory_alt" },
                    { id: "ai",     label: "AI Insights",         icon: "auto_awesome" },
                    { id: "output", label: "Output",              icon: "terminal" },
                  ].map(({ id, label, icon }) => (
                    <button
                      key={id}
                      className={`tab ${activeTab === id ? "active" : ""}`}
                      onClick={() => setActiveTab(id)}
                      role="tab"
                    >
                      <span className="material-symbols-outlined tab-icon">{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
                <div className="section-header-actions">
                  {analysisResult && (
                    <>
                      <button className="icon-action-btn" onClick={handleExportTrace} title="Export trace as JSON">
                        <span className="material-symbols-outlined">download</span>
                      </button>
                      <button className="icon-action-btn" onClick={handleCopyProjectShareLink} title="Copy share link">
                        <span className="material-symbols-outlined">share</span>
                      </button>
                    </>
                  )}
                  <button className="explain-btn explain-btn--ai" onClick={handleExplain} disabled={aiLoading || loading}>
                    <span className="material-symbols-outlined">auto_awesome</span>
                    {aiLoading ? "Thinking…" : "AI Insights"}
                    {aiLoading && <span className="editor-tab-spinner" />}
                  </button>
                  <button className="explain-btn explain-btn--optimize" onClick={handleOptimizePerformance} disabled={aiLoading || loading || !performanceMetrics}>
                    <span className="material-symbols-outlined">speed</span>
                    Optimize
                  </button>

                  <button
                    className="run-icon-btn"
                    onClick={() => handleAnalyze()}
                    disabled={loading || aiLoading}
                    title="Analyze & Debug"
                  >
                    <span className={`material-symbols-outlined${loading ? " spin" : ""}`}>{loading ? "sync" : "play_arrow"}</span>
                  </button>
                </div>
              </div>
              {error && (
                <div className="error-banner">
                  <span><strong>Error:</strong> {error}</span>
                  <button className="error-dismiss" onClick={() => setError(null)}>✕</button>
                </div>
              )}
              {activeTab === "flow" ? (
                <FlowVisualizer 
                  result={analysisResult} 
                  loading={loading} 
                  stepLoading={stepLoading} 
                  onLineChange={setCurrentLine} 
                  code={code} 
                  onNext={(stepType) => handleStep("next", stepType)} 
                  onBack={() => handleStep("back")} 
                  onExplainStep={handleExplainStep}
                />
              ) : activeTab === "memory" ? (
                <MemorySpectrometer result={analysisResult} currentStep={analysisResult?.cursor ?? 0} />
              ) : activeTab === "ai" ? (                <AiExplanation data={aiExplanation} loading={aiLoading} />
              ) : (
                <OutputPanel result={analysisResult} loading={loading} />
                )}
                </>
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
      {view !== "landing" && view !== "dashboard" && (
        <Header
          view={view}
          onSwitchView={setView}
          user={user}
          onLogout={handleLogout}
          onSignIn={() => setShowLoginModal(true)}
        />
      )}
      {serverDown && (view === "editor" || view === "visualizer" || view === "dashboard") && (
        <div className="server-down-banner">
          <div className="server-down-inner">
            <span className="server-down-icon material-symbols-outlined">wifi_off</span>
            <div className="server-down-text">
              <strong>Backend server is not running.</strong>
              <span> Start it with: </span>
              <code className="server-down-cmd">python run_server.py</code>
            </div>
          </div>
          <button className="server-retry-btn" onClick={checkServer} disabled={serverChecking}>
            <span className={`material-symbols-outlined${serverChecking ? " spin" : ""}`}>{serverChecking ? "sync" : "refresh"}</span>
            {serverChecking ? "Checking…" : "Retry"}
          </button>
        </div>
      )}
      {sessionExpiredBanner && (
        <div className="server-down-banner" style={{ background: "rgba(239,68,68,0.08)", borderBottom: "1px solid rgba(239,68,68,0.2)" }}>
          <div className="server-down-inner">
            <span className="server-down-icon material-symbols-outlined" style={{ color: "var(--accent-red)" }}>lock</span>
            <div className="server-down-text">
              <strong style={{ color: "var(--accent-red)" }}>Session expired.</strong>
              <span> Please sign in again to continue.</span>
            </div>
          </div>
          <button className="server-retry-btn" style={{ color: "var(--accent-red)", borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)" }}
            onClick={() => { setSessionExpiredBanner(false); setShowLoginModal(true); }}>
            <span className="material-symbols-outlined">login</span>
            Sign in
          </button>
        </div>
      )}
      {renderView()}
      <LoginModal isOpen={showLoginModal} onLogin={(userData, token) => { handleLogin(userData, token); setShowLoginModal(false); }} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}

export default App;
