"use client";

import { apiClient } from "@/app/api-client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatDateTime, formatCurrency } from "@/lib/format";
import { Wrench, ArrowRight, Save, X } from "lucide-react";
import type { MaintenanceLog, Asset, User } from "@/lib/db";

const STATUS_ORDER: string[] = ["open", "in_progress", "waiting_vendor", "resolved", "closed"];
const STATUS_LABELS: Record<string, string> = {
  open: "Open", in_progress: "In Progress", waiting_vendor: "Waiting Vendor",
  resolved: "Resolved", closed: "Closed",
};

export default function MaintenanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [log, setLog] = useState<MaintenanceLog | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ vendor_name: "", technician_name: "", cost_estimate: "", actual_cost: "", notes: "" });

  const load = useCallback(() => {
    apiClient(`/api/maintenance/${id}`).then((r) => r.json()).then((d) => { setLog(d); setLoading(false); });
    apiClient("/api/meta").then((r) => r.json()).then((meta) => setUsers(meta.users ?? []));
  }, [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (log?.asset_id) apiClient(`/api/assets/${log.asset_id}`).then((r) => r.json()).then(setAsset).catch(() => {});
  }, [log?.asset_id]);

  async function transition(newStatus: string) {
    setError(""); setActionMsg(""); setActionLoading(true);
    try {
      const res = await apiClient(`/api/maintenance/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
      const d = await res.json();
      if (!res.ok) { setError(d.error); toast(d.error, "error"); return; }
      setLog(d);
      const label = STATUS_LABELS[newStatus] ?? newStatus;
      setActionMsg(`Status updated to ${label}`);
      toast(`Status updated to ${label}`, "success");
    } catch { setError("Network error"); toast("Network error", "error"); }
    finally { setActionLoading(false); }
  }

  function startEdit() {
    if (!log) return;
    setEditForm({
      vendor_name: log.vendor_name ?? "",
      technician_name: log.technician_name ?? "",
      cost_estimate: log.cost_estimate?.toString() ?? "",
      actual_cost: log.actual_cost?.toString() ?? "",
      notes: log.notes ?? "",
    });
    setEditing(true);
  }

  async function saveEdit() {
    setError(""); setActionMsg(""); setActionLoading(true);
    try {
      const res = await apiClient(`/api/maintenance/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_name: editForm.vendor_name || undefined,
          technician_name: editForm.technician_name || undefined,
          cost_estimate: editForm.cost_estimate ? Number(editForm.cost_estimate) : undefined,
          actual_cost: editForm.actual_cost ? Number(editForm.actual_cost) : undefined,
          notes: editForm.notes || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error); toast(d.error, "error"); return; }
      setLog(d);
      setEditing(false);
      setActionMsg("Changes saved");
      toast("Changes saved successfully", "success");
    } catch { setError("Network error"); toast("Network error", "error"); }
    finally { setActionLoading(false); }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><Skeleton className="h-80 w-full rounded-2xl" /></div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!log) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Wrench className="h-12 w-12 text-muted-foreground/20" />
        <p className="text-destructive text-sm font-medium">Maintenance ticket not found.</p>
        <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const createdBy = users.find((u) => u.id === log.created_by);
  const currentIdx = STATUS_ORDER.indexOf(log.status);

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">← Maintenance</button>

      {/* Status Progress — scrollable on mobile */}
      <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)]">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
            {STATUS_ORDER.map((s, i) => {
              const done = i < currentIdx;
              const active = i === currentIdx;
              return (
                <div key={s} className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      done ? "bg-emerald-500 text-white" : active ? "bg-primary text-primary-foreground ring-2 ring-ring ring-offset-2" : "bg-muted text-muted-foreground"
                    }`}>
                      {done ? "✓" : i + 1}
                    </div>
                    <span className={`text-xs font-medium hidden sm:inline whitespace-nowrap ${active ? "text-foreground" : "text-muted-foreground"}`}>{STATUS_LABELS[s]}</span>
                  </div>
                  {i < 4 && <ArrowRight className={`h-3 w-3 shrink-0 ${done ? "text-emerald-500" : "text-muted-foreground/30"}`} />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)]">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">{log.maintenance_code}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">{asset ? `${asset.asset_name} (${asset.asset_code})` : log.asset_id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge value={log.severity} />
                  <Badge value={log.status} />
                </div>
              </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Issue Description</Label>
                    <p className="mt-1 text-sm text-foreground">{log.issue_description}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {editing ? (
                      <>
                        <div className="space-y-1.5"><Label htmlFor="vendor">Vendor</Label><Input id="vendor" value={editForm.vendor_name} onChange={(e) => setEditForm({ ...editForm, vendor_name: e.target.value })} /></div>
                        <div className="space-y-1.5"><Label htmlFor="technician">Technician</Label><Input id="technician" value={editForm.technician_name} onChange={(e) => setEditForm({ ...editForm, technician_name: e.target.value })} /></div>
                        <div className="space-y-1.5"><Label htmlFor="cost_estimate">Cost Estimate</Label><Input id="cost_estimate" type="number" value={editForm.cost_estimate} onChange={(e) => setEditForm({ ...editForm, cost_estimate: e.target.value })} /></div>
                        <div className="space-y-1.5"><Label htmlFor="actual_cost">Actual Cost</Label><Input id="actual_cost" type="number" value={editForm.actual_cost} onChange={(e) => setEditForm({ ...editForm, actual_cost: e.target.value })} /></div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Vendor</Label><p className="text-sm">{log.vendor_name || "-"}</p></div>
                        <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Technician</Label><p className="text-sm">{log.technician_name || "-"}</p></div>
                        <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Cost Estimate</Label><p className="text-sm">{log.cost_estimate ? formatCurrency(log.cost_estimate) : "-"}</p></div>
                        <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Actual Cost</Label><p className="text-sm">{log.actual_cost ? formatCurrency(log.actual_cost) : "-"}</p></div>
                      </>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {editing ? (
                      <>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={2} />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveEdit} disabled={actionLoading}><Save className="h-4 w-4 mr-1" /> Save</Button>
                          <Button size="sm" variant="ghost" disabled={actionLoading} onClick={() => setEditing(false)}><X className="h-4 w-4 mr-1" /> Cancel</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Notes</Label>
                        <p className="text-sm">{log.notes || "-"}</p>
                        <Button size="sm" variant="outline" onClick={startEdit}>Edit Details</Button>
                      </>
                    )}
                  </div>
                </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)]">
            <CardContent className="pt-5">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Status Actions</h3>
              {error && <p className="mb-3 rounded-xl bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive font-medium">{error}</p>}
              {actionMsg && <p className="mb-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs font-medium text-emerald-500 dark:text-emerald-400">{actionMsg}</p>}
              <div className="space-y-2">
                {log.status === "open" && <Button className="w-full" onClick={() => transition("in_progress")} disabled={actionLoading}>Start Progress</Button>}
                {log.status === "in_progress" && (
                  <>
                    <Button className="w-full" onClick={() => transition("waiting_vendor")} disabled={actionLoading}>Send to Vendor</Button>
                    <Button className="w-full" variant="secondary" onClick={() => transition("resolved")} disabled={actionLoading}>Mark Resolved</Button>
                  </>
                )}
                {log.status === "waiting_vendor" && <Button className="w-full" onClick={() => transition("resolved")} disabled={actionLoading}>Mark Resolved</Button>}
                {log.status === "resolved" && <Button className="w-full" onClick={() => transition("closed")} disabled={actionLoading}>Close Ticket</Button>}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)]">
            <CardContent className="pt-5">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Created by</span><span className="font-medium">{createdBy?.name ?? log.created_by}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Started</span><span>{log.started_at ? formatDateTime(log.started_at) : "-"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Completed</span><span>{log.completed_at ? formatDateTime(log.completed_at) : "-"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Est. Cost</span><span>{log.cost_estimate ? formatCurrency(log.cost_estimate) : "-"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Actual Cost</span><span className={log.actual_cost && log.cost_estimate && log.actual_cost > log.cost_estimate ? "text-destructive font-medium" : ""}>{log.actual_cost ? formatCurrency(log.actual_cost) : "-"}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
