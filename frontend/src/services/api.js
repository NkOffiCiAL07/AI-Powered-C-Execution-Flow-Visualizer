import logger from "../utils/logger";

export const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// ── Central authenticated fetch ──────────────────────────────────────────────
// Attaches the JWT from localStorage, intercepts 401 (fires a global event so
// App.js can clear state and redirect), and normalises error shapes.
async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("traceon_auth_token");
  const method = options.method || "GET";

  // Omit Content-Type on GET requests — it confuses some proxies and is incorrect per spec
  const headers = {
    ...(method !== "GET" ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  logger.debug(`${method} ${url}`);

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    if (
      err.message === "Failed to fetch" ||
      err.message.includes("NetworkError")
    ) {
      logger.warn("Network error — backend unreachable", { url });
      throw new Error(
        "Cannot connect to the server. Make sure the backend is running " +
          "(python run_server.py) on port 8000."
      );
    }
    logger.error("Fetch error", { url, message: err.message });
    throw err;
  }

  // 401 → only fire session-expired when the user had an active token;
  // avoids spuriously clearing state on unauthenticated endpoint 401s
  if (response.status === 401) {
    logger.warn("Session expired — clearing auth state");
    localStorage.removeItem("traceon_user");
    localStorage.removeItem("traceon_auth_token");
    if (token) {
      window.dispatchEvent(new CustomEvent("traceon:session-expired"));
    }
    throw new Error("Session expired. Please sign in again.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      errorData.detail ||
      errorData.error ||
      errorData.message ||
      `Server error: ${response.status}`;
    logger.error(`API error ${response.status}`, { url, message });
    throw new Error(message);
  }

  return response.json();
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function analyzeCode(code, stdin, signal, language = "cpp", projectId = null, fileId = null) {
  return apiFetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    body: JSON.stringify({ 
      code, 
      stdin: stdin || "", 
      language,
      project_id: projectId,
      file_id: fileId
    }),
    signal,
  });
}

export async function runCode(code, stdin, signal, language = "cpp") {
  return apiFetch(`${API_BASE_URL}/run`, {
    method: "POST",
    body: JSON.stringify({ code, stdin: stdin || "", language }),
    signal,
  });
}

export async function stepAnalyzeSession(sessionId, direction, stepType, signal) {
  return apiFetch(`${API_BASE_URL}/analyze/${sessionId}/step`, {
    method: "POST",
    body: JSON.stringify({ direction, step_type: stepType }),
    signal,
  });
}

export async function generateCode(prompt, language, signal) {
  return apiFetch(`${API_BASE_URL}/generate`, {
    method: "POST",
    body: JSON.stringify({ prompt, language: language || "cpp" }),
    signal,
  });
}

export async function explainCode(code, signal, language = "cpp") {
  return apiFetch(`${API_BASE_URL}/explain`, {
    method: "POST",
    body: JSON.stringify({ code, language }),
    signal,
  });
}

export async function optimizeCode(code, language = "cpp", metrics = {}, signal) {
  return apiFetch(`${API_BASE_URL}/optimize`, {
    method: "POST",
    body: JSON.stringify({
      code,
      language,
      line_hits: metrics.line_hits || {},
      step_count: metrics.step_count || 0,
    }),
    signal,
  });
}

export async function checkCode(code, language = "cpp", signal) {
  return apiFetch(`${API_BASE_URL}/check`, {
    method: "POST",
    body: JSON.stringify({ code, language }),
    signal,
  });
}

// ── Project / File API (P6) ───────────────────────────────────────────────────

export async function fetchProjects(signal) {
  return apiFetch(`${API_BASE_URL}/projects`, { signal });
}

export async function fetchProject(projectId, signal) {
  return apiFetch(`${API_BASE_URL}/projects/${projectId}`, { signal });
}

export async function fetchPublicProject(projectId, signal) {
  // Uses regular fetch as it doesn't need auth/Bearer
  const response = await fetch(`${API_BASE_URL}/view/${projectId}`, { signal });
  if (!response.ok) throw new Error(`Public view failed: ${response.status}`);
  return response.json();
}

export async function createProject(name, language, signal) {
  return apiFetch(`${API_BASE_URL}/projects`, {
    method: "POST",
    body: JSON.stringify({ name, language }),
    signal,
  });
}

export async function deleteProject(projectId, signal) {
  return apiFetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: "DELETE",
    signal,
  });
}

export async function fetchFiles(projectId, signal) {
  return apiFetch(`${API_BASE_URL}/projects/${projectId}/files`, { signal });
}

export async function createFile(projectId, name, language, code, signal) {
  return apiFetch(`${API_BASE_URL}/projects/${projectId}/files`, {
    method: "POST",
    body: JSON.stringify({ name, language, code }),
    signal,
  });
}

export async function updateFile(projectId, fileId, name, language, code, signal) {
  return apiFetch(`${API_BASE_URL}/projects/${projectId}/files/${fileId}`, {
    method: "PUT",
    body: JSON.stringify({ name, language, code }),
    signal,
  });
}

export async function deleteFile(projectId, fileId, signal) {
  return apiFetch(`${API_BASE_URL}/projects/${projectId}/files/${fileId}`, {
    method: "DELETE",
    signal,
  });
}

// ── GDB Breakpoint Debugger ───────────────────────────────────────────────────

export async function debugWithBreakpoints(code, language, breakpoints, stdin, signal) {
  return apiFetch(`${API_BASE_URL}/debug/breakpoints`, {
    method: "POST",
    body: JSON.stringify({ code, language, breakpoints: [...breakpoints], stdin: stdin || "" }),
    signal,
  });
}

// ── News ──────────────────────────────────────────────────────────────────────

export async function fetchNews(signal) {
  return apiFetch(`${API_BASE_URL}/news`, { signal });
}

export async function refreshNews(signal) {
  return apiFetch(`${API_BASE_URL}/news/refresh`, { method: "POST", signal });
}

export async function fetchComments(articleId, signal) {
  return apiFetch(`${API_BASE_URL}/news/${articleId}/comments`, { signal });
}

export async function postComment(articleId, text, signal) {
  return apiFetch(`${API_BASE_URL}/news/${articleId}/comments`, {
    method: "POST",
    body: JSON.stringify({ text }),
    signal,
  });
}

export async function joinWaitlist(email) {
  return apiFetch(`${API_BASE_URL}/waitlist`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}
