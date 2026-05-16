export const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// ── Central authenticated fetch ──────────────────────────────────────────────
// Attaches the JWT from localStorage, intercepts 401 (fires a global event so
// App.js can clear state and redirect), and normalises error shapes.
async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("traceon_auth_token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    if (
      err.message === "Failed to fetch" ||
      err.message.includes("NetworkError")
    ) {
      throw new Error(
        "Cannot connect to the server. Make sure the backend is running " +
          "(python run_server.py) on port 8000."
      );
    }
    throw err;
  }

  // 401 → token expired or revoked; clear session and notify the app
  if (response.status === 401) {
    localStorage.removeItem("traceon_user");
    localStorage.removeItem("traceon_auth_token");
    window.dispatchEvent(new CustomEvent("traceon:session-expired"));
    throw new Error("Session expired. Please sign in again.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail ||
        errorData.error ||
        errorData.message ||
        `Server error: ${response.status}`
    );
  }

  return response.json();
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function analyzeCode(code, stdin, signal, language = "cpp") {
  return apiFetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    body: JSON.stringify({ code, stdin: stdin || "", language }),
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

// ── Project / File API (P6) ───────────────────────────────────────────────────

export async function fetchProjects(signal) {
  return apiFetch(`${API_BASE_URL}/projects`, { signal });
}

export async function fetchProject(projectId, signal) {
  return apiFetch(`${API_BASE_URL}/projects/${projectId}`, { signal });
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
