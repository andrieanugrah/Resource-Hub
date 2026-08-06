"use client";

import { ErrorBoundary } from "./error-boundary";

export function ErrorShell({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

