"use client";

import { Fragment, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/app/api-client";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { ClipboardList, RefreshCw, ChevronDown, ChevronUp, Minus } from "lucide-react";
import type { AuditLog, User } from "@/lib/db";

// ponytail: inline diff builder, no library needed. Add diff2html if complex merges needed.

function getChanges(before: Record<string, unknown> | null, after: Record<string, unknown> | null) {
  const allKeys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  const changes: { key: string; before: unknown; after: unknown; changed: boolean }[] = [];
  for (const k of allKeys) {
    const b = before?.[k];
    const a = after?.[k];
    if (b !== a && JSON.stringify(b) !== JSON.stringify(a)) {
      changes.push({ key: k, before: b, after: a, changed: true });
    }
  }
  return changes;
}

function formatVal(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v, null, 1).slice(0, 200);
  return String(v);
}

export default function AuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiClient("/api/audit-logs").then(async (r) => {
        if (r.status === 403) {
          router.push("/dashboard");
          return [];
        }
        return r.json();
      }),
      apiClient("/api/meta").then((r) => r.json()),
    ])
      .then(([auditLogs, meta]) => {
        setLogs(Array.isArray(auditLogs) ? auditLogs : []);
        setUsers(meta.users ?? []);
        setError("");
      })
      .catch(() => setError("Failed to load audit logs"))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const userName = (id: string) => users.find((u) => u.id === id)?.name ?? id;

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div>
      <PageHeader title="Audit Logs" description="Immutable record of all system actions" />
      <Card className="overflow-hidden rounded-2xl border-0 shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col" className="w-8" />
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Time</TableHead>
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Actor</TableHead>
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Action</TableHead>
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Entity</TableHead>
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Entity ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <ClipboardList className="h-8 w-8 text-muted-foreground/20" />
                    <p className="text-sm font-medium text-destructive">{error}</p>
                    <Button variant="outline" size="sm" onClick={() => void load()}>
                      <RefreshCw className="h-3.5 w-3.5" /> Retry
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-14 text-center">
                  <ClipboardList className="h-8 w-8 mx-auto text-muted-foreground/20" />
                  <p className="text-sm font-medium text-muted-foreground mt-2">No audit logs yet</p>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((l) => {
                const beforeObj = l.before_json ? (() => { try { return JSON.parse(l.before_json); } catch { return null; } })() : null;
                const afterObj = l.after_json ? (() => { try { return JSON.parse(l.after_json); } catch { return null; } })() : null;
                const changes = getChanges(beforeObj, afterObj);
                const isExpanded = expandedId === l.id;
                const hasDiff = changes.length > 0;

                return (
                  <Fragment key={l.id}>
                    <TableRow className={`transition-colors hover:bg-muted/30 ${isExpanded ? "bg-muted/20" : ""}`}>
                      <TableCell>
                        {hasDiff ? (
                          <button onClick={() => toggle(l.id)} className="cursor-pointer rounded p-0.5 hover:bg-muted transition-colors">
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-primary" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                          </button>
                        ) : (
                          <Minus className="h-3 w-3 text-muted-foreground/20" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{formatDateTime(l.created_at)}</TableCell>
                      <TableCell className="font-medium text-foreground">{userName(l.actor_user_id)}</TableCell>
                      <TableCell><Badge value={l.action_type} /></TableCell>
                      <TableCell className="text-muted-foreground capitalize">{l.entity_type}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-[120px] truncate" title={l.entity_id}>{l.entity_id}</TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-muted/10">
                        <TableCell colSpan={6} className="py-3 px-4">
                          <div className="rounded-xl border bg-muted/20 overflow-hidden">
                            <div className="grid grid-cols-2 divide-x text-xs">
                              <div className="p-3 bg-red-50/30 dark:bg-red-950/10">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive/70 mb-2">Before</p>
                                {changes.map((c) => (
                                  <div key={c.key} className="flex items-start gap-2 py-0.5">
                                    <span className="font-mono text-[11px] text-destructive/50 shrink-0 min-w-[80px]">{c.key}:</span>
                                    <span className="text-destructive/80 break-all line-through decoration-destructive/30">{formatVal(c.before)}</span>
                                  </div>
                                ))}
                                {changes.length === 0 && <p className="text-muted-foreground/40 italic">(no changes)</p>}
                              </div>
                              <div className="p-3 bg-emerald-50/30 dark:bg-emerald-950/10">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600/70 mb-2">After</p>
                                {changes.map((c) => (
                                  <div key={c.key} className="flex items-start gap-2 py-0.5">
                                    <span className="font-mono text-[11px] text-emerald-600/50 shrink-0 min-w-[80px]">{c.key}:</span>
                                    <span className="text-emerald-700/80 break-all">{formatVal(c.after)}</span>
                                  </div>
                                ))}
                                {changes.length === 0 && <p className="text-muted-foreground/40 italic">(no changes)</p>}
                              </div>
                            </div>
                          </div>
                          <button onClick={() => setExpandedId(null)} className="mt-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Collapse</button>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
        <div className="border-t px-5 py-3 text-xs text-muted-foreground flex items-center gap-2">
          <ClipboardList className="h-3.5 w-3.5" />
          Last 200 entries — Immutable
        </div>
      </Card>
    </div>
  );
}
