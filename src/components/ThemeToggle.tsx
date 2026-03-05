"use client";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all hover:scale-110 bg-[var(--card)] border border-[var(--border)]"
      title={theme === "dark" ? "切换浅色" : "切换深色"}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
