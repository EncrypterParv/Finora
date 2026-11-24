"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme, Theme } from "@/components/providers/ThemeProvider";
import { Palette, Check } from "lucide-react";

const themes: { id: Theme; name: string; description: string; preview: string }[] = [
  {
    id: "fin",
    name: "Fin Theme",
    description: "Warm brass, stone canvas & paper",
    preview: "bg-[#886731] border-[#d7ba82]",
  },
  {
    id: "dark",
    name: "True Dark",
    description: "Deep neutral obsidian, zero-blue cockpit",
    preview: "bg-[#15161b] border-[#383a42]",
  },
  {
    id: "amoled",
    name: "AMOLED Black",
    description: "Pure #000000 pitch black for OLED",
    preview: "bg-[#000000] border-[#ffffff]",
  },
];

export function ThemeSelector({
  className = "",
  pill = false,
}: {
  className?: string;
  pill?: boolean;
}) {
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
        className={
          pill
            ? "inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 dark:border-white/20 dark:bg-black/40 backdrop-blur-md px-3.5 py-1.5 text-xs font-medium text-current transition-all hover:scale-105 active:scale-95"
            : "theme-selector-trigger inline-flex items-center gap-2 rounded-lg border border-inherit px-2.5 py-1.5 text-xs font-medium transition-all hover:bg-black/5 dark:hover:bg-white/5 focus-visible:outline-2"
        }
      >
        <Palette size={13} aria-hidden="true" className="shrink-0 text-current opacity-80" />
        <span className="hidden sm:inline">{currentTheme.name}</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="theme-selector-menu absolute right-0 z-50 mt-2 w-60 rounded-xl border border-[#282828] bg-[#0d0e12]/95 dark:bg-[#000000]/95 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#9ca3af]">
            Theme Appearance
          </div>
          <div className="space-y-1">
            {themes.map((t) => {
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setTheme(t.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                    isSelected
                      ? "bg-white/15 text-white font-semibold"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-3.5 w-3.5 rounded-full border ${t.preview}`}
                    />
                    <div>
                      <div className="font-medium text-white">{t.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {t.description}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <Check size={14} className="text-emerald-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
