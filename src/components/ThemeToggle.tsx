"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

function applyTheme(dark: boolean) {
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.classList.toggle("light", !dark);
  root.style.colorScheme = dark ? "dark" : "light";
  window.localStorage.setItem("cgc-theme", dark ? "dark" : "light");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? "#0A0A0A" : "#F3F2EC");
}

export function ThemeToggle() {
  const [dark, setDark] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("cgc-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextDark = stored ? stored === "dark" : prefersDark;
    setDark(nextDark);
    applyTheme(nextDark);
    setReady(true);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    applyTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-elevated text-fg transition hover:border-line-strong"
      aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      suppressHydrationWarning
    >
      {ready ? dark ? <Sun size={16} /> : <Moon size={16} /> : <Sun size={16} className="opacity-0" />}
    </button>
  );
}
