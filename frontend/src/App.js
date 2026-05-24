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
import BreakpointsPanel from "./components/BreakpointsPanel";
import LangDropdown from "./components/LangDropdown";
import KeyboardShortcutsModal from "./components/KeyboardShortcutsModal";
import { FILE_NAMES } from "./components/NewProjectModal";
import {
  analyzeCode, runCode, stepAnalyzeSession, explainCode, generateCode,
  updateFile, deleteFile, fetchProject, fetchFiles, createFile, fetchPublicProject, API_BASE_URL,
  debugWithBreakpoints,
} from "./services/api";
import NewsPage from "./components/NewsPage";
import { useAuth } from "./contexts/AuthContext";
import "./App.css";
import "./styles/CppEditorPage.css";

// Captured once at module load — before React StrictMode double-mounts any
// effects and before the URL-sync effect can overwrite window.location.search.
const _initialParams = new URLSearchParams(window.location.search);


// Minimal starter templates — no demo logic, just the boilerplate
const DEFAULT_CODES = {
  cpp: `#include <iostream>
using namespace std;

int main() {
    // Write your code here

    return 0;
}`,
  c: `#include <stdio.h>

int main() {
    // Write your code here

    return 0;
}`,
  python: `# Write your code here
`,
  java: `public class Main {
    public static void main(String[] args) {
        // Write your code here
    }
}`,
};

// Returns a Java starter template with the class name derived from the filename.
// "HelloWorld.java" → "public class HelloWorld { ... }"
function getJavaTemplate(fileName) {
  const base = (fileName || 'Main.java').replace(/\.java$/i, '').trim();
  // Capitalise first char to ensure a valid identifier
  const className = base ? base.charAt(0).toUpperCase() + base.slice(1) : 'Main';
  return `public class ${className} {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}`;
}

function App() {
  const {
    user,
    authLoading,
    showLoginModal,
    setShowLoginModal,
    sessionExpiredBanner,
    setSessionExpiredBanner,
    login,
    logout,
  } = useAuth();

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
  const [currentProject, setCurrentProject] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showGenBanner, setShowGenBanner] = useState(false); // "Understand with AI" toast after generation
  const genBannerTimerRef = useRef(null);
  // Persist breakpoints across page refreshes
  const [breakpoints, setBreakpoints] = useState(() => {
    try {
      const raw = localStorage.getItem("traceon_breakpoints");
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  });
  const [bpJumpTarget, setBpJumpTarget] = useState(null); // { step, version }
  const [bpDebugResult, setBpDebugResult] = useState(null); // GDB hits result
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

  // Persist breakpoints to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("traceon_breakpoints", JSON.stringify([...breakpoints]));
    } catch {}
  }, [breakpoints]);

  useEffect(() => {
    if (!user && (view === "editor" || view === "visualizer" || view === "dashboard")) {
      setView("landing");
    }
  }, [user, view]);

  // Restore hash-based code share — runs immediately, before auth resolves
  useEffect(() => {
    try {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const lang = hash.get("lang");
      const encoded = hash.get("code");
      if (lang && ["cpp", "c", "python", "java"].includes(lang)) {
        setLanguage(lang);
        if (encoded) setCode(decodeURIComponent(escape(atob(encoded))));
      }
    } catch {}
  }, []);

  // Route to the correct view based on URL params — runs once auth resolves
  useEffect(() => {
    if (authLoading) return;

    const urlView = _initialParams.get("v");
    const urlPid  = _initialParams.get("pid");
    const urlFid  = _initialParams.get("fid");

    let projCtrl = null;

    if (urlView === "view" && urlPid) {
      setView("editor");
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
    } else if (user) {
      const isMember = user.role === "member";

      if (urlView === "dashboard" && isMember) {
        setView("dashboard");
      } else if (urlView === "docs" || urlView === "pricing" || urlView === "community" || urlView === "news") {
        setView(urlView);
      } else if (urlView === "editor" || urlView === "visualizer") {
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
                // Project inaccessible — stay in plain editor
              }
            }
          })();
        }
      } else {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  // Sync view + project → URL so refresh restores the same screen
  useEffect(() => {
    const params = new URLSearchParams();
    const SYNCABLE = ["dashboard", "editor", "visualizer", "docs", "pricing", "community", "news"];
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

  const handleLogin = useCallback((userData, token) => {
    login(userData, token);
    const isGuest = userData.provider === "guest" || userData.role === "guest";
    setView(isGuest ? "editor" : "dashboard");
  }, [login]);

  const handleLogout = useCallback(async () => {
    await logout();
    setCurrentProject(null);
    setView("landing");
  }, [logout]);

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
      // For Java, use a template whose class name matches the filename
      const initialCode = lang === 'java' ? getJavaTemplate(name) : (DEFAULT_CODES[lang] || "");
      const { file } = await createFile(project.id, name, lang, initialCode);
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

  const handleFileRename = async (fileId, newName) => {
    if (!currentProject || !newName.trim()) return;
    const { project, files } = currentProject;
    const file = files.find(f => f.id === fileId);
    if (!file || file.name === newName.trim()) return;

    const ext = newName.trim().split('.').pop().toLowerCase();
    const langMap = { cpp: 'cpp', cc: 'cpp', cxx: 'cpp', c: 'c', py: 'python', java: 'java' };
    const detectedLang = langMap[ext] || file.language;

    try {
      await updateFile(project.id, fileId, newName.trim(), detectedLang, file.code);
      setCurrentProject(prev => ({
        ...prev,
        files: prev.files.map(f =>
          f.id === fileId ? { ...f, name: newName.trim(), language: detectedLang } : f
        ),
        ...(prev.activeFileId === fileId ? { file: { ...prev.file, name: newName.trim(), language: detectedLang } } : {}),
      }));
      if (currentProject.activeFileId === fileId) setLanguage(detectedLang);
    } catch (err) {
      alert(err.message || "Failed to rename file");
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


  // Phase 7.2: Auto-save effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user || user.role === "guest") return;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, language, currentProject, view, handleSave]); // 'user' omitted intentionally — guest check inside

  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable;
      if (!inInput && e.key === '?') setShowShortcuts(s => !s);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

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
      // Show the "Understand with AI" banner for 12 s
      setShowGenBanner(true);
      clearTimeout(genBannerTimerRef.current);
      genBannerTimerRef.current = setTimeout(() => setShowGenBanner(false), 12000);
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Code generation failed");
    } finally {
      setGenerateLoading(false);
      generateAbortRef.current = null;
    }
  }, [language]);

  const handleLanguageChange = (newLang) => {
    // If a project file is open and its name is the default for the current language,
    // auto-rename it to the default for the new language (e.g. main.cpp → Main.java)
    let targetFileName = FILE_NAMES[newLang]; // default filename for the new language
    if (currentProject?.activeFileId) {
      const activeFile = currentProject.files?.find(f => f.id === currentProject.activeFileId);
      if (activeFile && FILE_NAMES[language] === activeFile.name && FILE_NAMES[newLang]) {
        handleFileRename(activeFile.id, FILE_NAMES[newLang]);
      } else if (activeFile) {
        // Keep track of the actual current filename for template generation
        targetFileName = activeFile.name;
      }
    }
    setLanguage(newLang);
    // For Java, the starter class name must match the file's name
    setCode(newLang === 'java' ? getJavaTemplate(targetFileName) : (DEFAULT_CODES[newLang] || ""));
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
        // Derive performance metrics from snapshot data so Optimize button always works
        const snaps = result.snapshots || [];
        if (snaps.length > 0) {
          const lineHits = {};
          snaps.forEach((s) => {
            const line = s?.location?.line;
            if (line) lineHits[line] = (lineHits[line] || 0) + 1;
          });
          setPerformanceMetrics({
            line_hits: lineHits,
            total_execution_time_ms: snaps.length * 5, // ~5ms per step estimate
            step_count: snaps.length,
          });
        } else {
          setPerformanceMetrics(null);
        }
      }
      // Auto-switch to Breakpoints tab if any hit landed on a breakpoint line
      const hasBreakpointHits = breakpoints.size > 0 &&
        (result.snapshots || []).some(s => breakpoints.has(s?.location?.line));
      setActiveTab(hasBreakpointHits ? "breakpoints" : "flow");
    } catch (err) {
      if (err.name === "AbortError") return;
      if (err.message?.includes("Cannot connect")) setServerDown(true);
      setError(err.message || "Analysis failed");
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [code, programInput, language, currentProject, breakpoints]);

  // GDB real breakpoint debug (C/C++ only)
  const handleGdbDebug = useCallback(async () => {
    if (!code.trim() || breakpoints.size === 0) return;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);
    setBpDebugResult(null);
    try {
      const result = await debugWithBreakpoints(
        code, language, breakpoints, programInput, abortControllerRef.current.signal
      );
      setServerDown(false);
      if (result.compile_error) {
        setError(result.compile_error);
      } else {
        setBpDebugResult(result);
        setActiveTab("breakpoints");
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      if (err.message?.includes("Cannot connect")) setServerDown(true);
      setError(err.message || "GDB debug failed");
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [code, language, breakpoints, programInput]);

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

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (view === 'editor') handleRun();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        if (view === 'editor') handleExplain();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [view, handleRun, handleExplain]);

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
        return <LandingPage onStart={() => setView("editor")} onSwitchView={setView} onLogin={handleLogin} user={user} />;
      case "dashboard":
        return (
          <DashboardPage
            user={user}
            onLogout={handleLogout}
            onOpenProject={handleOpenProject}
            onOpenPlayground={() => { setCurrentProject(null); setView("editor"); }}
            onSwitchView={setView}
            onBack={() => setView(currentProject ? 'editor' : 'landing')}
          />
        );
      case "docs":
        return <DocsPage />;
      case "pricing":
        return <PricingPage onStart={() => setView("editor")} onSignIn={() => setShowLoginModal(true)} />;
      case "community":
        return <CommunityPage onStart={() => setView("editor")} />;
      case "news":
        return <NewsPage onSwitchView={setView} />;
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
            onFileRename={handleFileRename}
            onSignIn={() => setShowLoginModal(true)}
            breakpoints={breakpoints}
            onBreakpointsChange={setBreakpoints}
            showGenBanner={showGenBanner}
            onDismissGenBanner={() => { setShowGenBanner(false); clearTimeout(genBannerTimerRef.current); }}
            onUnderstandWithAI={() => {
              setShowGenBanner(false);
              clearTimeout(genBannerTimerRef.current);
              handleExplain();
            }}
          />
        );
      case "visualizer":
        const isGuest = !user || user.role === "guest";
        const noProject = !currentProject;
        const debugLangLabel = language === "c" ? "C" : language === "python" ? "Python" : language === "java" ? "Java" : "C++";

        return (
          <main className="app-main" ref={debugContainerRef}>

            {/* ══════════ LEFT — Code editor panel ══════════ */}
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
                      placeholder={`Describe what you want to build in ${debugLangLabel}…`}
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

              {/* Left panel header */}
              <div className="section-header debugger-code-header">
                <div className="section-header-title">
                  <span className="material-symbols-outlined section-header-icon">code</span>
                  <h2>{debugLangLabel} · Source</h2>
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
                    Generate
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
                breakpoints={breakpoints}
                onBreakpointsChange={setBreakpoints}
              />

              {/* Stdin */}
              <div className="stdin-panel">
                <div className="stdin-header">
                  <div className="stdin-header-left">
                    <span className="material-symbols-outlined stdin-icon">input</span>
                    <h3>Program Input</h3>
                  </div>
                  <span className="stdin-badge">stdin</span>
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

            {/* ══════════ RIGHT — Visualizer panel ══════════ */}
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
                  {/* ═══ PRIMARY ACTION BAR ═══ */}
                  <div className="debugger-action-bar">
                    <div className="action-bar-group action-bar-primary">
                      <button
                        className="action-btn action-btn--run"
                        onClick={() => handleAnalyze()}
                        disabled={loading || aiLoading}
                        title="Analyze code & start step-through debugger"
                      >
                        <span className={`material-symbols-outlined${loading ? " spin" : ""}`}>
                          {loading ? "sync" : "play_arrow"}
                        </span>
                        {loading ? "Analyzing…" : "Analyze & Debug"}
                      </button>

                      {/* Breakpoint count badge */}
                      {breakpoints.size > 0 && (
                        <button
                          className="action-btn action-btn--bp-badge"
                          onClick={() => setActiveTab("breakpoints")}
                          title={`${breakpoints.size} breakpoint${breakpoints.size !== 1 ? 's' : ''} set — view hits`}
                        >
                          <span className="bp-badge-dot" />
                          {breakpoints.size} BP
                        </button>
                      )}
                    </div>

                    <div className="action-bar-group action-bar-secondary">
                      <button
                        className="action-btn action-btn--ai"
                        onClick={handleExplain}
                        disabled={aiLoading || loading}
                        title="Explain code with AI"
                      >
                        <span className={`material-symbols-outlined${aiLoading ? " spin" : ""}`}>
                          {aiLoading ? "sync" : "auto_awesome"}
                        </span>
                        {aiLoading ? "Thinking…" : "AI Insights"}
                        {aiLoading && <span className="editor-tab-spinner" />}
                      </button>

                      <button
                        className="action-btn action-btn--optimize"
                        onClick={handleOptimizePerformance}
                        disabled={aiLoading || loading || !performanceMetrics}
                        title={!performanceMetrics ? "Run the debugger first to collect performance data" : "AI performance optimization"}
                      >
                        <span className="material-symbols-outlined">speed</span>
                        Optimize
                        {!performanceMetrics && <span className="material-symbols-outlined action-lock-icon">lock</span>}
                      </button>
                    </div>
                  </div>

                  {/* ═══ Generate → Understand banner (debugger view) ═══ */}
                  {showGenBanner && (
                    <div className="gen-understand-banner">
                      <span className="gen-banner-check">
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                        Code generated
                      </span>
                      <button
                        className="gen-banner-cta"
                        onClick={() => {
                          setShowGenBanner(false);
                          clearTimeout(genBannerTimerRef.current);
                          handleExplain();
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>auto_awesome</span>
                        Understand with AI
                      </button>
                      <button className="gen-banner-dismiss" onClick={() => { setShowGenBanner(false); clearTimeout(genBannerTimerRef.current); }} aria-label="Dismiss">
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>close</span>
                      </button>
                    </div>
                  )}

                  {/* ═══ TAB NAVIGATION ═══ */}
                  <div className="section-header debugger-tab-header">
                    <div className="tab-bar" role="tablist" aria-label="Debugger view tabs">
                      {[
                        { id: "flow",        label: "Execution Flow",  icon: "account_tree" },
                        { id: "breakpoints", label: "Breakpoints",     icon: "adjust",        hidden: breakpoints.size === 0 },
                        { id: "memory",      label: "Memory Map",      icon: "memory_alt" },
                        { id: "ai",          label: "AI Insights",     icon: "auto_awesome",  hidden: !aiExplanation && !aiLoading },
                        { id: "output",      label: "Output",          icon: "terminal" },
                      ].filter(t => !t.hidden).map(({ id, label, icon }) => (
                        <button
                          key={id}
                          className={`tab ${activeTab === id ? "active" : ""}`}
                          onClick={() => setActiveTab(id)}
                          role="tab"
                        >
                          <span className="material-symbols-outlined tab-icon">{icon}</span>
                          {label}
                          {id === "ai" && aiLoading && <span className="editor-tab-spinner" style={{ marginLeft: 4 }} />}
                          {id === "breakpoints" && breakpoints.size > 0 && (
                            <span className="bp-tab-dot" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Step counter badge */}
                    {analysisResult && (
                      <div className="debugger-step-badge">
                        <span className="material-symbols-outlined">stacks</span>
                        Step {(analysisResult.cursor ?? 0) + 1} / {analysisResult.total_recorded_steps ?? "?"}
                      </div>
                    )}
                  </div>

                  {/* ═══ Error banner ═══ */}
                  {error && (
                    <div className="error-banner">
                      <span><strong>Error:</strong> {error}</span>
                      <button className="error-dismiss" onClick={() => setError(null)}>✕</button>
                    </div>
                  )}

                  {/* ═══ Tab content ═══ */}
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
                      breakpoints={breakpoints}
                      jumpTarget={bpJumpTarget}
                    />
                  ) : activeTab === "breakpoints" ? (
                    <BreakpointsPanel
                      snapshots={analysisResult?.snapshots || []}
                      breakpoints={breakpoints}
                      currentStep={analysisResult?.cursor ?? 0}
                      gdbHits={bpDebugResult?.hits || null}
                      onJumpToStep={(stepIdx) => {
                        setBpJumpTarget({ step: stepIdx, version: Date.now() });
                        setActiveTab("flow");
                      }}
                      onGdbDebug={
                        (language === "c" || language === "cpp") && breakpoints.size > 0
                          ? handleGdbDebug
                          : null
                      }
                      gdbLoading={loading && bpDebugResult === null && activeTab === "breakpoints"}
                    />
                  ) : activeTab === "memory" ? (
                    <MemorySpectrometer result={analysisResult} currentStep={analysisResult?.cursor ?? 0} />
                  ) : activeTab === "ai" ? (
                    <AiExplanation data={aiExplanation} loading={aiLoading} />
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
      <div key={view} className="view-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: ['editor', 'visualizer', 'dashboard'].includes(view) ? 'hidden' : 'auto' }}>
        {renderView()}
      </div>
      <LoginModal isOpen={showLoginModal} onLogin={handleLogin} onClose={() => setShowLoginModal(false)} />
      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}

export default App;
