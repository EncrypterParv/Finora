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
    positive: "bg-[#edf4ed] text-[#2f6b45] border-[#cfe0d0]",
    negative: "bg-[#faeeee] text-[#a04646] border-[#edcece]",
    warning: "bg-[#fbf4df] text-[#8a641e] border-[#ebddb5]",
    neutral: "bg-[#f7f3e5] text-[#6c5c55] border-[#e7e3dc]",
    brand: "bg-[#fdf5f0] text-[#4e342e] border-[#fae8dc]",
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
