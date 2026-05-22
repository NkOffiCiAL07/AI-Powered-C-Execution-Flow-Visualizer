const IS_DEV = process.env.NODE_ENV !== "production";

const LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const MIN_LEVEL = IS_DEV ? LEVELS.DEBUG : LEVELS.WARN;

const STYLES = {
  DEBUG: "color:#888;font-weight:bold",
  INFO:  "color:#4A90D9;font-weight:bold",
  WARN:  "color:#E5A623;font-weight:bold",
  ERROR: "color:#D94848;font-weight:bold",
};

function log(level, message, ...data) {
  if (LEVELS[level] < MIN_LEVEL) return;
  const ts = new Date().toISOString();
  const prefix = `[Traceon][${level}] ${ts}`;
  const consoleFn = level === "ERROR" ? console.error : level === "WARN" ? console.warn : console.log;
  if (data.length) {
    consoleFn(`%c${prefix}`, STYLES[level], message, ...data);
  } else {
    consoleFn(`%c${prefix}`, STYLES[level], message);
  }
}

const logger = {
  debug: (msg, ...data) => log("DEBUG", msg, ...data),
  info:  (msg, ...data) => log("INFO",  msg, ...data),
  warn:  (msg, ...data) => log("WARN",  msg, ...data),
  error: (msg, ...data) => log("ERROR", msg, ...data),
};

// Global uncaught error capture
window.addEventListener("error", (event) => {
  logger.error("Uncaught error", {
    message: event.message,
    source:  event.filename,
    line:    event.lineno,
    col:     event.colno,
    stack:   event.error?.stack,
  });
});

// Global unhandled promise rejection capture
window.addEventListener("unhandledrejection", (event) => {
  logger.error("Unhandled promise rejection", {
    reason: event.reason?.message || String(event.reason),
    stack:  event.reason?.stack,
  });
});

export default logger;
