import React from "react";
interface FinoraMarkProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}
const sizes = {
  sm: { icon: 24, wordmark: "text-sm" },
  md: { icon: 30, wordmark: "text-xl" },
  lg: { icon: 38, wordmark: "text-2xl" },
};
export function FinoraMark({
  size = "md",
  showWordmark = true,
  className = "",
}: FinoraMarkProps) {
  const scale = sizes[size];
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={scale.icon}
        height={scale.icon}
        viewBox="0 0 32 32"
        aria-hidden="true"
      >
        <path d="M4 4h24v6H11v6h12v6H11v6H4Z" fill="#2e211e" />
        <path d="m17 4 11 6V4ZM17 16l6 6v-6Z" fill="#d18047" />
      </svg>
      {showWordmark && (
        <span
          className={`${scale.wordmark} font-semibold tracking-[-0.035em] text-[#2e211e]`}
        >
          finora
        </span>
      )}
    </div>
  );
}
