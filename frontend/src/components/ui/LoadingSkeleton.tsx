import React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  height?: string;
  width?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  height,
  width,
  ...props
}) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-slate-800/80 border border-slate-700/30",
        height,
        width,
        className
      )}
      {...props}
    />
  );
};

export const LoadingSkeleton = Skeleton;
