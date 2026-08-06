"use client";

import { useEffect, useRef } from "react";

interface Props {
  value: number;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({ value, duration = 0.6, className }: Props) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const prevRef = useRef(0);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;

    const prev = prevRef.current;
    prevRef.current = value;

    if (value === prev) {
      el.textContent = String(value);
      return;
    }

    const start = performance.now();
    let raf: number;

    function tick(now: number) {
      const elapsed = (now - start) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic for ultra-smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(prev + (value - prev) * eased);
      if (el) el.textContent = String(current);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span ref={spanRef} className={className}>{value}</span>;
}
