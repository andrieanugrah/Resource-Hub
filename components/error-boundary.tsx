"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center p-8">
          <div className="flex flex-col items-center gap-4 text-center max-w-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {this.state.error.message || "An unexpected error occurred."}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            >
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </Button>
            <p className="text-[11px] text-muted-foreground/60">
              Try refreshing the page. If the issue persists, contact IT support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

