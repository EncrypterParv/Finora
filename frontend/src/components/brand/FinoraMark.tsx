import React from "react";

interface FinoraMarkProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}

const sizes = {
  sm: { box: "h-8 w-8", icon: 16, wordmark: "text-sm" },
  md: { box: "h-10 w-10", icon: 20, wordmark: "text-base" },
  lg: { box: "h-12 w-12", icon: 25, wordmark: "text-xl" },
};

export const FinoraMark: React.FC<FinoraMarkProps> = ({
  size = "md",
  showWordmark = true,
  className = "",
}) => {
  const scale = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`${scale.box} flex shrink-0 items-center justify-center rounded-[10px] bg-[#3546A8] text-[#ffffff] shadow-[0_3px_10px_rgba(53,70,168,0.18)]`}
        aria-hidden="true"
      >
        <svg width={scale.icon} height={scale.icon} viewBox="0 0 24 24" fill="none">
          <path
            d="M6 5.5h12v2.6H8.8v3.3h7.4v2.5H8.8v5.6H6V5.5Z"
            fill="currentColor"
          />
          <path d="M15.1 16.1h2.9v3.4h-2.9v-3.4Z" fill="currentColor" opacity=".72" />
        </svg>
      </div>
      {showWordmark && (
        <div className="leading-none">
          <div className={`${scale.wordmark} font-semibold tracking-[-0.03em] text-[#1C2024]`}>
            Finora
          </div>
          <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[#7A838A]">
            Financial intelligence
          </div>
        </div>
      )}
    </div>
  );
};
