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
  const rColor = isDark ? "#FFFFFF" : "#111827";
  const rFacetColor = isDark ? "#D1D5DB" : "#1F2937";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 112"
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
        {/* R Left Vertical Spine (front face) */}
        <path
          d="M8 30 L26 20 L26 85 L8 95 Z"
          fill={rColor}
        />
        {/* R Bowl / Top Loop (side face — lighter shade for 3D depth) */}
        <path
          d="M26 20 L46 8 L46 50 L26 62 Z"
          fill={rFacetColor}
        />
        {/* R Inner Counter Hole (negative space — must read clearly as 'R') */}
        <path
          d="M28 32 L40 24 L40 44 L28 52 Z"
          fill={isDark ? "#111827" : "#FFFFFF"}
        />
        {/* R Diagonal Leg (front face) */}
        <path
          d="M26 62 L46 50 L46 100 L34 107 L26 85 Z"
          fill={rColor}
        />
      </g>

      {/* === RIGHT HALF: 'H' (Hexagon Right Facet) === */}
      <g id="rh-monogram-H">
        {/* H Left Column */}
        <path
          d="M54 20 L68 12 L68 100 L54 108 Z"
          fill="url(#rh-h-left)"
        />
        {/* H Isometric Crossbar */}
        <path
          d="M68 48 L80 41 L80 63 L68 70 Z"
          fill="#F97316"
        />
        {/* H Right Column */}
        <path
          d="M80 12 L94 4 L94 84 L80 92 Z"
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
      ? "text-[#111827]"
      : "text-[#111827] dark:text-white";

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
