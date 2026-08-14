import React from "react";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  variant?: "full" | "icon" | "wordmark";
  theme?: "dark" | "light" | "auto";
  showSubtitle?: boolean;
  className?: string;
}

export function LogoIcon({
  size = 32,
  theme = "auto",
  className = "",
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number | string; theme?: "dark" | "light" | "auto" }) {
  const isDark = theme === "dark";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      {...props}
    >
      <defs>
        <linearGradient id="rh-orange-grad" x1="45" y1="10" x2="85" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="50%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id="rh-orange-light" x1="45" y1="15" x2="65" y2="55" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDBA74" />
          <stop offset="100%" stopColor="#FB923C" />
        </linearGradient>
        <linearGradient id="rh-orange-dark" x1="65" y1="50" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#C2410C" />
        </linearGradient>
        <linearGradient id="rh-dark-r" x1="10" y1="10" x2="45" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>

      {/* Hexagonal Isometric Outline / Silhouette */}
      <g>
        {/* === R MONOGRAM (Left Face) === */}
        {/* Left vertical column of R */}
        <path
          d="M12 24 L30 14 L30 86 L12 96 Z"
          fill={isDark ? "#FFFFFF" : "url(#rh-dark-r)"}
        />
        {/* Upper loop of R */}
        <path
          d="M30 14 L46 23 L46 50 L30 59 Z"
          fill={isDark ? "#E2E8F0" : "#334155"}
        />
        {/* Inner hole of R */}
        <path
          d="M30 28 L38 32 L38 42 L30 46 Z"
          fill={isDark ? "#0F172A" : "#FFFFFF"}
        />
        {/* Diagonal lower leg of R */}
        <path
          d="M30 50 L46 59 L46 86 L30 77 Z"
          fill={isDark ? "#CBD5E1" : "#1E293B"}
        />

        {/* === H MONOGRAM (Right Face) === */}
        {/* Left vertical column of H */}
        <path
          d="M52 23 L66 15 L66 87 L52 95 Z"
          fill="url(#rh-orange-light)"
        />
        {/* Isometric Crossbar of H */}
        <path
          d="M66 45 L76 39 L76 55 L66 61 Z"
          fill="url(#rh-orange-grad)"
        />
        {/* Right vertical column of H */}
        <path
          d="M76 15 L90 7 L90 79 L76 87 Z"
          fill="url(#rh-orange-dark)"
        />
      </g>
    </svg>
  );
}

export function Logo({
  size = 32,
  variant = "full",
  theme = "auto",
  showSubtitle = false,
  className = "",
  ...props
}: LogoProps) {
  const iconSize = typeof size === "number" ? size : 32;

  if (variant === "icon") {
    return <LogoIcon size={size} theme={theme} className={className} {...props} />;
  }

  const textColor =
    theme === "dark"
      ? "text-white"
      : theme === "light"
      ? "text-slate-900"
      : "text-slate-900 dark:text-white";

  const subtextColor =
    theme === "dark"
      ? "text-slate-400"
      : theme === "light"
      ? "text-slate-500"
      : "text-slate-500 dark:text-slate-400";

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {variant !== "wordmark" && <LogoIcon size={iconSize} theme={theme} {...props} />}
      <div className="flex flex-col leading-none text-left">
        <div className="flex items-center tracking-tight font-extrabold text-xl">
          <span className={textColor}>Resource</span>
          <span className="text-[#F97316]">Hub</span>
        </div>
        {showSubtitle && (
          <span
            className={`text-[9px] font-semibold tracking-[0.2em] uppercase mt-1 ${subtextColor}`}
          >
            IT ASSET MANAGEMENT
          </span>
        )}
      </div>
    </div>
  );
}
