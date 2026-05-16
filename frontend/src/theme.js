import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const themes = {
  light:    "light",
  dark:     "dark",
  ocean:    "ocean",
  forest:   "forest",
  midnight: "midnight",
};

const ALL_THEME_CLASSES = ["light-theme", "dark-theme", "theme-ocean", "theme-forest", "theme-midnight"];
const DARK_THEMES = new Set(["dark", "ocean", "forest", "midnight"]);

export const isDarkTheme = (t) => DARK_THEMES.has(t);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const stored = localStorage.getItem("theme");
    if (stored && themes[stored]) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? themes.dark : themes.light;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    document.body.classList.remove(...ALL_THEME_CLASSES);
    if (DARK_THEMES.has(theme)) {
      document.body.classList.add("dark-theme");
      if (theme !== "dark") document.body.classList.add(`theme-${theme}`);
    } else {
      document.body.classList.add("light-theme");
    }
  }, [theme]);

  const setTheme = (t) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
