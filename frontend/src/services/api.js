const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

function handleFetchError(err) {
  if (err.name === "AbortError") throw err;
  if (err.message === "Failed to fetch" || err.message === "NetworkError when attempting to fetch resource.") {
    throw new Error(
      "Cannot connect to the server. Make sure the backend is running (python run_server.py) on port 8000."
    );
  }
  throw err;
}

export async function analyzeCode(code, stdin, signal) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code, stdin: stdin || "" }),
      signal,
    });
  } catch (err) {
    handleFetchError(err);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || errorData.error || errorData.message || `Server error: ${response.status}`
    );
  }

  return response.json();
}

export async function runCode(code, stdin, signal) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code, stdin: stdin || "" }),
      signal,
    });
  } catch (err) {
    handleFetchError(err);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || errorData.error || errorData.message || `Server error: ${response.status}`
    );
  }

  return response.json();
}

export async function stepAnalyzeSession(sessionId, direction, stepType, signal) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/analyze/${sessionId}/step`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ direction, step_type: stepType }),
      signal,
    });
  } catch (err) {
    handleFetchError(err);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || errorData.error || errorData.message || `Server error: ${response.status}`
    );
  }

  return response.json();
}

export async function explainCode(code, signal) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/explain`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
      signal,
    });
  } catch (err) {
    handleFetchError(err);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || errorData.error || errorData.message || `Server error: ${response.status}`
    );
  }

  return response.json();
}
