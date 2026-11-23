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
    "inline-flex items-center justify-center font-medium transition-[background-color,border-color,color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#262724] disabled:opacity-50 disabled:pointer-events-none rounded-[6px]";

  const sizeStyles = {
    sm: "text-xs px-2.5 py-1.5 gap-1.5",
    md: "text-xs md:text-sm px-3.5 py-2 gap-2",
    lg: "text-sm md:text-base px-4 py-2.5 gap-2.5",
  };

  const variantStyles = {
    primary: "bg-[#262724] hover:bg-[#262724] text-white font-semibold",
    secondary: "bg-white hover:bg-[#f5f4f0] text-[#20211f] border border-[#d5d4cc]",
    subtle: "bg-transparent hover:bg-[#f5f4f0] text-[#575953] hover:text-[#20211f]",
    outline: "bg-transparent border border-[#d5d4cc] hover:bg-[#f5f4f0] text-[#20211f]",
    danger: "bg-[#a04646] hover:bg-[#873b3b] text-white",
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
