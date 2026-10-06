import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "positive" | "negative" | "warning" | "neutral" | "brand";
  size?: "sm" | "md";
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  size = "sm",
  className,
  icon,
}) => {
  const variantStyles = {
    positive: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    negative: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    neutral: "bg-slate-800 text-slate-300 border-slate-700/60",
    brand: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  };

  const sizeStyles = {
    sm: "text-[10px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium border rounded-full tracking-wide",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
