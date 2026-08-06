"use client";

import { useState, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "default";
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({
        ...options,
        open: true,
        onConfirm: () => {
          setState((s) => ({ ...s, open: false }));
          resolve(true);
        },
        onCancel: () => {
          setState((s) => ({ ...s, open: false }));
          resolve(false);
        },
      });
    });
  }, []);

  const ConfirmDialog = useCallback(() => {
    if (!state.open) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-modal animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start gap-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              state.variant === "destructive" ? "bg-destructive/10" : "bg-amber-50"
            }`}>
              <AlertTriangle className={`h-5 w-5 ${
                state.variant === "destructive" ? "text-destructive" : "text-amber-600"
              }`} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">{state.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{state.description}</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={state.onCancel}>
              {state.cancelLabel || "Cancel"}
            </Button>
            <Button
              variant={state.variant === "destructive" ? "destructive" : "default"}
              onClick={state.onConfirm}
            >
              {state.confirmLabel || "Confirm"}
            </Button>
          </div>
        </div>
      </div>
    );
  }, [state]);

  return { confirm, ConfirmDialog };
}

