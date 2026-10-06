import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 md:p-12 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/30",
        className
      )}
    >
      <div className="p-3 bg-slate-800/80 rounded-2xl text-slate-400 mb-3 border border-slate-700/60 shadow-inner">
        {icon}
      </div>
      <h3 className="text-sm md:text-base font-semibold text-slate-200">{title}</h3>
      <p className="text-xs md:text-sm text-slate-400 max-w-sm mt-1 mb-4 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button size="sm" variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
