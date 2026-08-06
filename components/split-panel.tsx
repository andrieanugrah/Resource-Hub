"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import { X, ExternalLink } from "lucide-react";
import { apiClient } from "@/app/api-client";
import { useSplitViewStore, type SplitTab } from "@/stores/split-view-store";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

function AssetDetail({ id }: { id: string }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient(`/api/assets/${id}`).then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
  }, [id]);

  if (loading) return <DetailSkeleton />;
  if (!data) return <p className="text-sm text-muted-foreground p-4">Asset not found.</p>;

  const fields = [
    ["Code", data.asset_code],
    ["Name", data.asset_name],
    ["Brand", data.brand],
    ["Model", data.model],
    ["Serial", data.serial_number],
    ["Condition", data.condition],
    ["Status", data.status],
    ["Location", data.location_id],
  ] as const;

  return (
    <div className="space-y-3 p-4">
      <h2 className="text-lg font-semibold">{String(data.asset_name)}</h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {fields.map(([label, value]) => (
          <div key={label}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{label}</p>
            <p className="text-sm font-medium">{String(value ?? "-")}</p>
          </div>
        ))}
      </div>
      <Link href={`/assets/${id}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-(--accent) hover:underline">
        <ExternalLink className="h-3 w-3" /> View full detail
      </Link>
    </div>
  );
}

function RequestDetail({ id }: { id: string }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient(`/api/requests/${id}`).then((r) => r.json()).then((d) => { setData(d); setLoading(false); });
  }, [id]);

  if (loading) return <DetailSkeleton />;
  if (!data) return <p className="text-sm text-muted-foreground p-4">Request not found.</p>;

  const fields = [
    ["Code", data.request_code],
    ["Title", data.title],
    ["Type", data.request_type],
    ["Status", data.status],
    ["Priority", data.priority],
    ["Requester", data.requester_id],
    ["Created", data.created_at ? String(data.created_at).slice(0, 10) : "-"],
  ] as const;

  return (
    <div className="space-y-3 p-4">
      <h2 className="text-lg font-semibold">{String(data.title)}</h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {fields.map(([label, value]) => (
          <div key={label}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{label}</p>
            <p className="text-sm font-medium">{String(value ?? "-")}</p>
          </div>
        ))}
      </div>
      <Link href={`/requests/${id}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-(--accent) hover:underline">
        <ExternalLink className="h-3 w-3" /> View full detail
      </Link>
    </div>
  );
}

function UserDetail({ id }: { id: string }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient("/api/meta").then((r) => r.json()).then((meta) => {
      const u = (meta.users ?? []).find((x: { id: string }) => x.id === id);
      setData(u ?? null);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <DetailSkeleton />;
  if (!data) return <p className="text-sm text-muted-foreground p-4">User not found.</p>;

  const fields = [
    ["Name", String(data.name ?? "-")],
    ["Email", String(data.email ?? "-")],
    ["Role", String(data.role ?? "-")],
    ["Job Title", String(data.job_title ?? "-")],
    ["Status", String(data.status ?? "-")],
  ];

  return (
    <div className="space-y-3 p-4">
      <h2 className="text-lg font-semibold">{String(data.name)}</h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {fields.map(([label, value]) => (
          <div key={label}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{label}</p>
            <p className="text-sm font-medium">{value}</p>
          </div>
        ))}
      </div>
      <Link href="/users" className="inline-flex items-center gap-1.5 text-xs font-medium text-(--accent) hover:underline">
        <ExternalLink className="h-3 w-3" /> View in Users
      </Link>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-5 w-40" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="h-3 w-12 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailContent({ tab }: { tab: SplitTab }) {
  switch (tab.type) {
    case "asset": return <AssetDetail id={tab.id} />;
    case "request": return <RequestDetail id={tab.id} />;
    case "user": return <UserDetail id={tab.id} />;
    default: return <p className="text-sm text-muted-foreground p-4">Unsupported entity: {tab.type}</p>;
  }
}

export function SplitPanel() {
  const { tabs, activeTabId, closeTab, setActiveTab, closeAll } = useSplitViewStore(
    useShallow((s) => ({
      tabs: s.tabs,
      activeTabId: s.activeTabId,
      closeTab: s.closeTab,
      setActiveTab: s.setActiveTab,
      closeAll: s.closeAll,
    })),
  );
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[tabs.length - 1];

  return (
    <AnimatePresence>
      {tabs.length > 0 && (
        <motion.div
          key="split-panel"
          initial={{ x: 24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 24, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:flex w-105 xl:w-125 shrink-0 border-l bg-card/50 backdrop-blur-sm flex-col overflow-hidden"
        >
      <div className="flex items-center border-b shrink-0">
        <div className="flex-1 flex overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer shrink-0 ${
                activeTab.id === tab.id
                  ? "border-(--accent) text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="max-w-30 truncate">{tab.label}</span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); closeTab(tab.id); } }}
                className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-sm opacity-0 group-hover:opacity-60 hover:opacity-100 hover:bg-muted transition-opacity cursor-pointer"
              >
                <X className="h-3 w-3" />
              </span>
            </button>
          ))}
        </div>
        <Button variant="ghost" size="icon-sm" onClick={closeAll} className="mr-1 h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <DetailContent tab={activeTab} />
      </div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
