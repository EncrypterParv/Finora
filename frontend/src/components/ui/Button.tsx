import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "subtle" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "primary",
  size = "md",
  icon,
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none rounded-lg";

  const sizeStyles = {
    sm: "text-xs px-2.5 py-1.5 gap-1.5",
    md: "text-xs md:text-sm px-3.5 py-2 gap-2",
    lg: "text-sm md:text-base px-4 py-2.5 gap-2.5",
  };

  const variantStyles = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm font-semibold",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700/80",
    subtle: "bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white",
    outline: "bg-transparent border border-slate-700 hover:bg-slate-800 text-slate-200",
    danger: "bg-rose-600/90 hover:bg-rose-500 text-white",
  };

  return (
    <button
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
