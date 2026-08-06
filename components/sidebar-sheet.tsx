"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { useIsMounted } from "@/components/use-is-mounted";

export function MobileSidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const mounted = useIsMounted();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function handleItemClick(e: React.MouseEvent) {
    const t = e.target as HTMLElement;
    if (t.closest("a, button:not([data-sidebar-toggle])")) setOpen(false);
  }

  const overlay = mounted ? createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-200 lg:hidden ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpen(false)}
      />
      {/* Panel */}
      <div
        style={{ height: "100vh" }}
        className={`fixed top-0 left-0 bottom-0 z-60 w-72 max-w-[85vw] transition-transform duration-300 ease-out lg:hidden bg-card overflow-hidden shadow-2xl rounded-r-2xl border-r border-[var(--sidebar-border)] ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>

        <div onClick={handleItemClick} className="h-full">
          {children}
        </div>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden inline-flex items-center justify-center rounded-lg p-2 -ml-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      {overlay}
    </>
  );
}
