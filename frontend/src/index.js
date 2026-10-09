import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./theme";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import logger from "./utils/logger";

logger.info("Traceon initializing", { env: process.env.NODE_ENV });

// Suppress benign ResizeObserver loop errors triggered by Monaco and flex resizers
window.addEventListener("error", (e) => {
  if (
    e?.message?.includes("ResizeObserver loop") ||
    e?.message?.includes("ResizeObserver loop completed")
  ) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
