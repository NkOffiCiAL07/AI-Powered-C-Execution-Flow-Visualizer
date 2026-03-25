const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export async function analyzeCode(code, stdin, signal) {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, stdin }),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || errorData.error || errorData.message || `Server error: ${response.status}`
    );
  }

  return response.json();
}

export async function stepAnalyzeSession(sessionId, direction, signal) {
  const response = await fetch(`${API_BASE_URL}/analyze/${sessionId}/step`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ direction }),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.detail || errorData.error || errorData.message || `Server error: ${response.status}`
    );
  }

  return response.json();
}
