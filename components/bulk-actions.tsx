"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Trash2, X } from "lucide-react";

interface BulkActionsProps {
  selectedIds: string[];
  onClear: () => void;
  /** API endpoint prefix, e.g. "/api/assets" */
  resource: string;
  /** Label for the resource, e.g. "assets" */
  resourceLabel: string;
  /** Extra actions beyond delete */
  extraActions?: { label: string; action: (ids: string[]) => Promise<void> }[];
}

export function BulkActionBar({ selectedIds, onClear, resource, resourceLabel }: BulkActionsProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  const handleDelete = useCallback(async () => {
    const ok = await confirm({
      title: `Delete ${selectedIds.length} ${resourceLabel}`,
      description: `This action cannot be undone. Are you sure?`,
      confirmLabel: "Delete All",
      variant: "destructive",
    });
    if (!ok) return;

    setLoading(true);
    let failed = 0;
    for (const id of selectedIds) {
      try {
        const res = await fetch(`${resource}/${id}`, { method: "DELETE" });
        if (!res.ok) failed++;
      } catch { failed++; }
    }
    setLoading(false);

    if (failed === 0) {
      toast(`Deleted ${selectedIds.length} ${resourceLabel} successfully`, "success");
    } else {
      toast(`${failed} ${resourceLabel} could not be deleted`, "error");
    }
    onClear();
    router.refresh();
  }, [selectedIds, resource, resourceLabel, confirm, toast, onClear, router]);

  if (selectedIds.length === 0) return null;

  const countLabel = selectedIds.length === 1
    ? resourceLabel.replace(/s$/i, "")
    : resourceLabel;

  return (
    <>
      <ConfirmDialog />
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border border-zinc-800 dark:border-zinc-200 px-5 py-3 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-200 min-w-max">
        <span className="text-sm font-semibold tracking-tight">
          {selectedIds.length} {countLabel} selected
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="h-8 text-xs rounded-xl shadow-xs font-semibold px-3"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            {loading ? "Deleting..." : "Delete"}
          </Button>
          <button
            onClick={onClear}
            className="flex items-center justify-center h-7 w-7 rounded-lg text-zinc-400 hover:text-white dark:hover:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}

