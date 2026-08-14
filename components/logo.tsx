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
  className = "",
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number | string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      {...props}
    >
      <defs>
        <linearGradient id="rh-dark-grad" x1="20" y1="15" x2="60" y2="105" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="rh-orange-grad" x1="60" y1="15" x2="105" y2="105" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="50%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id="rh-orange-light" x1="60" y1="20" x2="90" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDBA74" />
          <stop offset="100%" stopColor="#FB923C" />
        </linearGradient>
        <linearGradient id="rh-orange-dark" x1="70" y1="60" x2="105" y2="105" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#C2410C" />
        </linearGradient>
      </defs>

      {/* R Monogram (Left - Dark Slate / Navy Facets) */}
      <g id="letter-R">
        {/* Main Vertical Spine of R */}
        <path
          d="M22 25 L40 15 L40 95 L22 105 Z"
          fill="url(#rh-dark-grad)"
        />
        {/* Top Loop Outer */}
        <path
          d="M40 15 L60 25 L60 55 L40 65 Z"
          fill="#1E293B"
        />
        {/* Inner Counter Hole for R */}
        <path
          d="M40 32 L50 37 L50 48 L40 53 Z"
          fill="#0F172A"
          opacity="0.9"
        />
        {/* Diagonal Leg of R */}
        <path
          d="M40 55 L58 64 L58 95 L40 85 Z"
          fill="#334155"
        />
      </g>

      {/* H Monogram (Right - Vibrant Orange / Amber Facets) */}
      <g id="letter-H">
        {/* Left Leg of H */}
        <path
          d="M66 28 L80 20 L80 100 L66 108 Z"
          fill="url(#rh-orange-light)"
        />
        {/* Crossbar of H (Isometric Angle) */}
        <path
          d="M80 52 L95 44 L95 62 L80 70 Z"
          fill="url(#rh-orange-grad)"
        />
        {/* Right Leg of H */}
        <path
          d="M95 20 L110 12 L110 92 L95 100 Z"
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
    return <LogoIcon size={size} className={className} {...props} />;
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
      {variant !== "wordmark" && <LogoIcon size={iconSize} {...props} />}
      <div className="flex flex-col leading-none">
        <div className="flex items-center tracking-tight font-extrabold text-xl">
          <span className={textColor}>Resource</span>
          <span className="text-orange-500">Hub</span>
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
