import React from "react";
import { cn } from "@/lib/utils";

export interface TabOption<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps<T extends string = string> {
  options: TabOption<T>[];
  activeId: T;
  onChange: (id: T) => void;
  className?: string;
  size?: "sm" | "md";
}

export function Tabs<T extends string>({
  options,
  activeId,
  onChange,
  className,
  size = "md",
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center bg-slate-900 border border-slate-800 p-1 rounded-lg gap-1",
        className
      )}
    >
      {options.map((tab) => {
        const isActive = activeId === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex items-center gap-1.5 font-medium rounded-md transition-all",
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs md:text-sm",
              isActive
                ? "bg-indigo-600 text-white shadow-sm font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full",
                  isActive ? "bg-indigo-700 text-white" : "bg-slate-800 text-slate-400"
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
