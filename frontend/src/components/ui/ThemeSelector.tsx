"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme, Theme } from "@/components/providers/ThemeProvider";
import { Palette, Check } from "lucide-react";

const themes: { id: Theme; name: string; description: string; preview: string }[] = [
  {
    id: "fin",
    name: "Fin Theme",
    description: "Original stone, warm paper & brass",
    preview: "bg-[#886731] border-[#ded0b5]",
  },
  {
    id: "blue",
    name: "Light Blue",
    description: "Clean white surface with blue accents",
    preview: "bg-[#2563eb] border-[#bfdbfe]",
  },
  {
    id: "dark",
    name: "Dark Glow",
    description: "Deep obsidian dashboard with white glow",
    preview: "bg-[#ffffff] border-[#383a42]",
  },
];

export function ThemeSelector({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const currentTheme = themes.find((t) => t.id === theme) || themes[0];

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Current theme: ${currentTheme.name}. Click to change theme`}
        className="theme-selector-trigger inline-flex items-center gap-2 rounded-md border border-[#d5d4cc] px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5 focus-visible:outline-2"
      >
        <Palette size={14} aria-hidden="true" className="shrink-0 text-current opacity-80" />
        <span className="hidden sm:inline">{currentTheme.name}</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="theme-selector-menu absolute right-0 z-50 mt-1.5 w-56 rounded-lg border border-[var(--prototype-line,#d5d4cc)] bg-[var(--prototype-surface,#ffffff)] p-1.5 shadow-lg backdrop-blur-md"
        >
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--prototype-muted,#62645d)]">
            Select Theme
          </div>
          {themes.map((t) => {
            const isSelected = theme === t.id;
            return (
              <button
                key={t.id}
                role="menuitem"
                type="button"
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors ${
                  isSelected
                    ? "bg-[var(--finora-accent-soft,#f0e9da)] text-[var(--finora-ink,#20211f)] font-semibold"
                    : "text-[var(--prototype-ink,#20211f)] hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`inline-block h-3 w-3 rounded-full border ${t.preview} shrink-0`}
                    aria-hidden="true"
                  />
                  <div className="truncate">
                    <p className="truncate text-xs leading-4">{t.name}</p>
                    <p className="truncate text-[10px] text-[var(--prototype-muted,#62645d)] leading-3 opacity-80">
                      {t.description}
                    </p>
                  </div>
                </div>
                {isSelected && (
                  <Check size={14} className="shrink-0 text-[var(--finora-accent,#886731)]" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
