"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

const CYCLE = ["light", "dark", "system"] as const;

const ICON: Record<(typeof CYCLE)[number], string> = {
  light: "☀️",
  dark: "🌙",
  system: "🖥️",
};

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  // Pre-mount: render a same-sized, disabled placeholder instead of null,
  // so the button never pops into existence and shifts layout (CLS).
  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        aria-hidden="true"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted"
      />
    );
  }

  const current = (theme as (typeof CYCLE)[number]) ?? "system";
  const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Theme: ${current}. Switch to ${next}`}
      aria-pressed={current === "dark"}
      title={`Theme: ${current} (click for ${next})`}
      className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-surface"
    >
      <span aria-hidden="true">{ICON[current]}</span>
    </button>
  );
}
