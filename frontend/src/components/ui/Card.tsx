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
        "rounded-[10px] bg-white border border-[#e7e3dc] p-4 md:p-5",
        hoverable && "transition-[border-color,box-shadow] duration-200 hover:border-[#c7bcb7] hover:shadow-[0_2px_8px_rgba(37,26,23,0.04)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
