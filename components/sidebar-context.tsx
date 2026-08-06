"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { useIsMounted } from "@/components/use-is-mounted";

type SidebarState = "expanded" | "rail";

interface SidebarContextValue {
  state: SidebarState;
  setState: (s: SidebarState) => void;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

const STORAGE_KEY = "rh_sidebar_state";

function getStored(): SidebarState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === "expanded" || raw === "rail") return raw;
  return null;
}

function store(s: SidebarState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, s);
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SidebarState>("expanded");
  const mounted = useIsMounted();

  useEffect(() => {
    const stored = getStored();
    if (stored) setState(stored);
  }, []);

  useEffect(() => {
    if (mounted) store(state);
  }, [state, mounted]);

  const toggle = useCallback(() => {
    setState((prev) => (prev === "expanded" ? "rail" : "expanded"));
  }, []);

  const value = useMemo(() => ({ state, setState, toggle }), [state, setState, toggle]);

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
