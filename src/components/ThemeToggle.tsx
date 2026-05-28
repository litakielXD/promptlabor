"use client";

import { useEffect, useState } from "react";

const THEME_KEY = "promptlabor-theme";

type Theme = "dark" | "warm";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "warm") {
    root.dataset.theme = "warm";
  } else {
    delete root.dataset.theme;
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem(THEME_KEY) === "warm" ? "warm" : "dark";
  });

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    const nextTheme = theme === "warm" ? "dark" : "warm";
    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem(THEME_KEY, nextTheme);
  }

  const isWarm = theme === "warm";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      suppressHydrationWarning
      aria-pressed={isWarm}
      aria-label={isWarm ? "Dunklen Grafikmodus aktivieren" : "Warmen hellen Grafikmodus aktivieren"}
      title={isWarm ? "Dunkler Grafikmodus" : "Warmer heller Grafikmodus"}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {isWarm ? "☀" : "◐"}
      </span>
      <span className="theme-toggle-label">{isWarm ? "Warm" : "Dunkel"}</span>
    </button>
  );
}
