import React from "react";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  variant?: "full" | "icon" | "wordmark";
  theme?: "dark" | "light" | "auto";
  showSubtitle?: boolean;
  className?: string;
}

/**
 * Exact RH Monogram + Hexagon Shield Vector Logo
 * Meticulously matching the ResourceHub Brand Identity Specification
 */
export function LogoIcon({
  size = 32,
  theme = "auto",
  className = "",
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number | string; theme?: "dark" | "light" | "auto" }) {
  const isDark = theme === "dark";
  const rColor = isDark ? "#FFFFFF" : "#0F172A";
  const rFacetColor = isDark ? "#E2E8F0" : "#1E293B";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 115"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      {...props}
    >
      <defs>
        <linearGradient id="rh-h-left" x1="50" y1="10" x2="68" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
        <linearGradient id="rh-h-right" x1="68" y1="10" x2="95" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
      </defs>

      {/* === LEFT HALF: 'R' (Hexagon Left Facet) === */}
      <g id="rh-monogram-R">
        {/* R Left Vertical Spine */}
        <path
          d="M8 30 L26 19 L26 82 L8 93 Z"
          fill={rColor}
        />
        {/* R Top Loop Outer */}
        <path
          d="M26 19 L46 7 L46 45 L26 57 Z"
          fill={rFacetColor}
        />
        {/* R Inner Counter Hole (Negative Space) */}
        <path
          d="M26 31 L36 25 L36 39 L26 45 Z"
          fill={isDark ? "#0B1120" : "#FFFFFF"}
        />
        {/* R Diagonal Leg (Bottom Right) */}
        <path
          d="M26 57 L46 45 L46 95 L34 102 L26 82 Z"
          fill={rColor}
        />
      </g>

      {/* === RIGHT HALF: 'H' (Hexagon Right Facet) === */}
      <g id="rh-monogram-H">
        {/* H Left Column */}
        <path
          d="M54 20 L68 12 L68 98 L54 106 Z"
          fill="url(#rh-h-left)"
        />
        {/* H Isometric Crossbar */}
        <path
          d="M68 47 L80 40 L80 62 L68 69 Z"
          fill="#F97316"
        />
        {/* H Right Column */}
        <path
          d="M80 12 L94 4 L94 82 L80 90 Z"
          fill="url(#rh-h-right)"
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
    <div className={`inline-flex items-center gap-3.5 ${className}`}>
      {variant !== "wordmark" && <LogoIcon size={iconSize} theme={theme} {...props} />}
      <div className="flex flex-col leading-none text-left">
        <div className="flex items-center tracking-tight font-black text-2xl">
          <span className={textColor}>Resource</span>
          <span className="text-[#F97316]">Hub</span>
        </div>
        {showSubtitle && (
          <span
            className={`text-[10px] font-bold tracking-[0.22em] uppercase mt-1.5 ${subtextColor}`}
          >
            IT ASSET MANAGEMENT
          </span>
        )}
      </div>
    </div>
  );
}
