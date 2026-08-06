"use client";

import { SidebarProvider } from "@/components/sidebar-context";
import type { ReactNode } from "react";

export function DashboardProviders({ children }: { children: ReactNode }) {
  return <SidebarProvider>{children}</SidebarProvider>;
}
