"use client";

import type { ReactNode } from "react";
import { useSidebar } from "@/components/sidebar-context";
import { useSplitViewStore } from "@/stores/split-view-store";
import { SplitPanel } from "@/components/split-panel";

import Link from "next/link";

const WIDTH_MAP = {
  expanded: "w-60",
  rail: "w-[60px]",
} as const;

export function DashboardShell({ sidebar, topbar, children }: { sidebar: ReactNode; topbar: ReactNode; children: ReactNode }) {
  const { state } = useSidebar();
  const tabs = useSplitViewStore((s) => s.tabs);
  const sidebarWidth = WIDTH_MAP[state];

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      <div className={`hidden lg:flex shrink-0 transition-all duration-300 overflow-hidden ${sidebarWidth}`}>
        {sidebar}
      </div>

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {topbar}
        <main className="flex-1 overflow-auto scroll-smooth flex flex-col">
          <div className="flex-1 p-4 sm:p-5 lg:p-6">{children}</div>
          <footer className="mt-auto border-t border-border/40 py-3 px-4 sm:px-6 lg:px-8 text-xs text-muted-foreground/70 flex flex-wrap items-center justify-between gap-3 bg-card/20 backdrop-blur-xs shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground/80">ResourceHub</span>
              <span>·</span>
              <span>IT Asset & Inventory Management</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                All Systems Normal
              </span>
              <Link href="/requests" className="hover:text-foreground transition-colors">Requests</Link>
              <Link href="/assets" className="hover:text-foreground transition-colors">Assets</Link>
            </div>
          </footer>
        </main>
      </div>

      {tabs.length > 0 && <SplitPanel />}
    </div>
  );
}
