import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        "rounded-xl bg-slate-900/70 border border-slate-800/80 p-4 md:p-5 backdrop-blur-sm",
        hoverable && "transition-all duration-150 hover:border-slate-700 hover:bg-slate-900/90 hover:shadow-lg hover:shadow-black/20",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
