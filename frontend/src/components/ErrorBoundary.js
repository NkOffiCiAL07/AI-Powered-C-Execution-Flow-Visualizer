import React from "react";

/**
 * ErrorBoundary — catches render errors in any child subtree and shows a
 * friendly recovery UI instead of a blank white screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error("[Traceon ErrorBoundary]", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: 32,
        background: "var(--bg-primary, #FAF9F7)",
        fontFamily: "Inter, sans-serif",
        textAlign: "center",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: "rgba(192,57,43,0.1)",
          border: "1px solid rgba(192,57,43,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 32, color: "#C0392B" }}>
            error
          </span>
        </div>

        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary, #1A1310)", marginBottom: 8 }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted, #9E8C7C)", maxWidth: 400 }}>
            An unexpected error occurred in Traceon. Your code and projects are safe.
          </p>
          {this.state.error?.message && (
            <pre style={{
              marginTop: 12,
              padding: "8px 14px",
              borderRadius: 8,
              background: "rgba(192,57,43,0.07)",
              border: "1px solid rgba(192,57,43,0.18)",
              fontSize: 11,
              color: "#C0392B",
              maxWidth: 480,
              overflow: "auto",
              textAlign: "left",
              whiteSpace: "pre-wrap",
            }}>
              {this.state.error.message}
            </pre>
          )}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => this.setState({ hasError: false, error: null, info: null })}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              border: "1px solid rgba(100,70,40,0.2)",
              background: "transparent",
              color: "var(--text-secondary, #5A4A3C)",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "9px 20px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, #C96A48, #8B3E24)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 4px 14px rgba(201,106,72,0.35)",
            }}
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}
