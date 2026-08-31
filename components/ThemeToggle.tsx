"use client";

import { useEffect, useState } from "react";

// Shares the "brane-theme" key with BraneApp so switching on one surface carries
// to the other — they're the same site, and a reader who picks light on the
// portfolio shouldn't get dark again when they open the graph.
type Theme = "dark" | "light";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem("brane-theme");
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("brane-theme", theme);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="font-mono text-xs hover:underline"
      style={{ color: "var(--text-muted)" }}
      aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
    >
      {theme === "dark" ? "☀ 라이트" : "☾ 다크"}
    </button>
  );
}
