import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

const themes = {
  dark: "dark",
  light: "light",
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem("theme");
    if (stored === themes.light || stored === themes.dark) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? themes.dark : themes.light;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    if (theme === themes.light) {
      document.body.classList.add("light-theme");
    } else {
      document.body.classList.remove("light-theme");
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === themes.dark ? themes.light : themes.dark));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
