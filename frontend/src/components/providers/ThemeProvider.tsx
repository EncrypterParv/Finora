"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "fin" | "dark" | "amoled";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "amoled",
  setTheme: () => {},
});

const THEME_STORAGE_KEY = "finora-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("amoled");

  const applyThemeToDOM = (t: Theme) => {
    document.documentElement.setAttribute("data-theme", t);
    if (t === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("amoled");
    } else if (t === "amoled") {
      document.documentElement.classList.add("dark", "amoled");
    } else {
      document.documentElement.classList.remove("dark", "amoled");
    }
  };

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (savedTheme && (savedTheme === "fin" || savedTheme === "dark" || savedTheme === "amoled")) {
        setThemeState(savedTheme);
        applyThemeToDOM(savedTheme);
      } else {
        setThemeState("amoled");
        applyThemeToDOM("amoled");
      }
    } catch {
      // localStorage may not be available in private mode or test environments
      setThemeState("amoled");
      applyThemeToDOM("amoled");
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // ignore storage errors
    }
    applyThemeToDOM(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
