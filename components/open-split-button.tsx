"use client";

import { PanelRight } from "lucide-react";
import { useSplitViewStore, type SplitTab } from "@/stores/split-view-store";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export function OpenSplitButton({ tab, label }: { tab: SplitTab; label?: string }) {
  const openTab = useSplitViewStore((s) => s.openTab);

  return (
    <Tooltip>
      <TooltipTrigger>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => { e.preventDefault(); openTab(tab); }}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openTab(tab); } }}
          className="inline-flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground/50 hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
          aria-label={label ?? `Open ${tab.label} in split view`}
        >
          <PanelRight className="h-3.5 w-3.5" />
        </span>
      </TooltipTrigger>
      <TooltipContent>{label ?? `Open in split view`}</TooltipContent>
    </Tooltip>
  );
}
