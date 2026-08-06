"use client";

import { apiClient } from "@/app/api-client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { QRCodeDisplay } from "@/components/qr-code";
import { formatDate } from "@/lib/format";
import { useToast } from "@/components/ui/toast";
import { Wrench, User, Package, ArrowLeft, Plus, Building2, Cpu, MemoryStick, HardDrive, Monitor, Battery } from "lucide-react";
import type { Asset, AssetTransaction, MaintenanceLog, User as UserType, Category, Location, Department } from "@/lib/db";

interface Meta { current_user: { id: string; role: string }; categories: Category[]; locations: Location[]; departments: Department[]; users: UserType[]; }

const SPEC_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  processor: Cpu, memory: MemoryStick, storage: HardDrive,
  display: Monitor, battery_health: Battery, os_version: Monitor,
};

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>([]);
  const [meta, setMeta] = useState<Meta>({ current_user: { id: "", role: "" }, categories: [], locations: [], departments: [], users: [] });
  const [loading, setLoading] = useState(true);

  // Assign dialog
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignDeptId, setAssignDeptId] = useState("");
  const [assignNotes, setAssignNotes] = useState("");

  // Return dialog
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnStatus, setReturnStatus] = useState("available");
  const [returnCondition, setReturnCondition] = useState("");
  const [returnNotes, setReturnNotes] = useState("");

  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [txs, setTxs] = useState<AssetTransaction[]>([]);

  const canEditAsset = meta.current_user.role === "super_admin" || meta.current_user.role === "admin_it";
  const canAssignAsset = meta.current_user.role === "super_admin" || meta.current_user.role === "admin_it";
  const canCreateMaintenance = meta.current_user.role === "super_admin" || meta.current_user.role === "admin_it";

  useEffect(() => {
    Promise.all([
      apiClient(`/api/assets/${id}`).then((r) => r.json()).then(setAsset),
      apiClient("/api/meta").then((r) => r.json()).then(setMeta),
      apiClient(`/api/assets/${id}/transactions`).then((r) => r.json()).then((d) => setTxs(Array.isArray(d) ? d : [])),
      apiClient("/api/maintenance").then((r) => r.json()).then((all: MaintenanceLog[]) => setMaintenance(all.filter((m) => m.asset_id === id))),
    ]).finally(() => setLoading(false));
  }, [id]);

  async function action(endpoint: string, body: Record<string, unknown>) {
    setActionError("");
    setActionLoading(true);
    try {
      const res = await apiClient(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setActionError(data.error); return; }
      setAsset(data);
      setAssignOpen(false);
      setReturnOpen(false);
      toast("Action completed successfully", "success");
    } catch {
      setActionError("Network error");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Package className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-destructive text-sm font-medium">Asset not found.</p>
        <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const cat = meta.categories.find((c) => c.id === asset.category_id);
  const owner = asset.assigned_user_id ? meta.users.find((u) => u.id === asset.assigned_user_id) : null;
  const dept = asset.assigned_department_id ? meta.departments.find((d) => d.id === asset.assigned_department_id) : null;

  const assignTx = txs.filter((t) => t.asset_id === asset.id && (t.transaction_type === "assign" || t.transaction_type === "return"));
  const currentAssignment = assignTx.filter((t) => t.transaction_type === "assign");
  const prevAssignments = assignTx.filter((t) => t.transaction_type === "return").slice().reverse();

  const formatDuration = (from: string, to: string) => {
    const start = new Date(from);
    const end = new Date(to);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    if (months < 1) return "< 1 mo";
    if (months < 12) return `${months} mos`;
    const yrs = Math.floor(months / 12);
    const rem = months % 12;
    return rem > 0 ? `${yrs}.${rem} yrs` : `${yrs} yrs`;
  };

  const specEntries = asset.specifications && Object.keys(asset.specifications).length > 0
    ? Object.entries(asset.specifications)
    : null;

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-1">
        <button onClick={() => router.back()} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Assets
        </button>
        {cat && (
          <>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-sm text-muted-foreground">{cat.category_name}</span>
          </>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{asset.asset_name}</h1>
          <p className="text-sm text-muted-foreground font-mono">Asset ID: {asset.asset_code}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge value={asset.status} />
          {canEditAsset && (
            <Button variant="outline" onClick={() => router.push(`/assets/${id}/edit`)}>Edit Asset</Button>
          )}
          {canAssignAsset && (
            <Button onClick={() => setAssignOpen(true)}>Reassign</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Asset Identity */}
          <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)]">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Image + QR */}
                <div className="sm:col-span-1 space-y-4">
                  <div className="aspect-square rounded-xl border bg-muted/30 flex items-center justify-center overflow-hidden">
                    {asset.image_url ? (
                      <img src={asset.image_url} alt={asset.asset_name} className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-12 w-12 text-muted-foreground/20" />
                    )}
                  </div>
                  <div className="text-center">
                    <QRCodeDisplay value={asset.qr_code_value || asset.id} label={asset.asset_code} />
                    <p className="text-xs text-muted-foreground mt-1">Scan for quick audit</p>
                  </div>
                </div>

                {/* Details */}
                <div className="sm:col-span-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-4">Asset Identity</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Manufacturer</span>
                      <p className="mt-1 text-foreground">{asset.brand || "-"}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Model</span>
                      <p className="mt-1 text-foreground">{asset.model || "-"}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Serial Number</span>
                      <p className="mt-1"><span className="inline-flex items-center rounded-md bg-muted px-2 py-1 font-mono text-xs">{asset.serial_number}</span></p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Purchase Date</span>
                      <p className="mt-1 text-foreground">{formatDate(asset.purchase_date)}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Warranty Expiration</span>
                      <p className="mt-1 text-foreground">
                        {formatDate(asset.warranty_end_date)}
                        {asset.warranty_note && <span className="text-muted-foreground"> ({asset.warranty_note})</span>}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Cost Center</span>
                      <p className="mt-1 text-foreground">{dept?.department_name ?? "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Specifications */}
          <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)]">
            <CardContent className="p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-4">Technical Specifications</h3>
              {specEntries ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {specEntries.map(([key, value]) => {
                    const Icon = SPEC_ICONS[key];
                    const isBattery = key === "battery_health";
                    return (
                      <div key={key} className="rounded-xl border bg-muted/20 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 capitalize">{key.replace(/_/g, " ")}</p>
                        </div>
                        <p className="text-sm font-medium text-foreground">{value || "—"}</p>
                        {isBattery && value && (
                          <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(parseInt(value) || 0, 100)}%` }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No specifications added.</p>
              )}
            </CardContent>
          </Card>

          {/* Maintenance Logs */}
          <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Maintenance Logs</h3>
                {canCreateMaintenance && (
                  <Button variant="ghost" size="sm" onClick={() => router.push(`/maintenance/new?asset_id=${asset.id}`)} aria-label="Add maintenance ticket">
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {maintenance.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8">
                  <Wrench className="h-8 w-8 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">No maintenance records</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {maintenance.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-xl border bg-muted/10 p-3">
                      <div>
                        <p className="text-sm font-medium">{m.issue_description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{m.maintenance_code} · {formatDate(m.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge value={m.severity} />
                        <Badge value={m.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <div className="lg:sticky lg:top-6 space-y-6">
            {/* Assignment Card */}
            <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)]">
              <CardHeader className="pb-3 bg-primary/5 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Assignment</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground/40" />
                </div>
              </CardHeader>
              <CardContent>
                {owner ? (
                  <div className="text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-lg font-bold text-primary mx-auto mb-2">
                      {owner.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <p className="font-semibold text-foreground">{owner.name}</p>
                    <p className="text-sm text-muted-foreground">{owner.job_title || "-"}</p>
                    {currentAssignment.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Assigned: {formatDate(currentAssignment[0].created_at)}
                      </p>
                    )}
                  </div>
                ) : dept ? (
                  <div className="text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mx-auto mb-2">
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="font-semibold text-foreground">{dept.department_name}</p>
                    <p className="text-sm text-muted-foreground">Department assignment</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Not assigned</p>
                )}

                {prevAssignments.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-3">Previous Assignees</p>
                    <div className="space-y-3">
                      {prevAssignments.map((pa, i) => {
                        const prevUser = pa.from_user_id ? meta.users.find((u) => u.id === pa.from_user_id) : null;
                        const nextAssign = assignTx.find((t) => t.transaction_type === "assign" && t.to_user_id === pa.from_user_id);
                        const duration = nextAssign ? formatDuration(pa.created_at, nextAssign.created_at) : null;
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                              {prevUser ? prevUser.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{prevUser?.name ?? "-"}</p>
                            </div>
                            {duration && <span className="text-xs text-muted-foreground">{duration}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Assign Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign Asset</DialogTitle>
            <DialogDescription>Assign this asset to a user or department.</DialogDescription>
          </DialogHeader>
          {actionError && (
            <p className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-xs text-destructive">{actionError}</p>
          )}
          <form onSubmit={(e) => { e.preventDefault(); action(`/api/assets/${id}/assign`, { user_id: assignUserId || null, department_id: assignDeptId || null, notes: assignNotes }); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assign_user">User</Label>
              <select id="assign_user" value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} className="w-full rounded-lg border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Select user...</option>
                {meta.users.filter((u) => u.status === "active").map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assign_department">Department (optional)</Label>
              <select id="assign_department" value={assignDeptId} onChange={(e) => setAssignDeptId(e.target.value)} className="w-full rounded-lg border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">None</option>
                {meta.departments.map((d) => <option key={d.id} value={d.id}>{d.department_name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assign_notes">Notes</Label>
              <Input id="assign_notes" value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)} placeholder="Optional notes" />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setAssignOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={actionLoading}>{actionLoading ? "Reassigning..." : "Confirm"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return Asset</DialogTitle>
            <DialogDescription>Return this asset and record its condition.</DialogDescription>
          </DialogHeader>
          {actionError && (
            <p className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-xs text-destructive">{actionError}</p>
          )}
          <form onSubmit={(e) => { e.preventDefault(); action(`/api/assets/${id}/return`, { status: returnStatus, condition: returnCondition || undefined, notes: returnNotes }); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="return_status">New Status</Label>
              <select id="return_status" value={returnStatus} onChange={(e) => setReturnStatus(e.target.value)} className="w-full rounded-lg border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="available">Available</option>
                <option value="in_repair">In Repair</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="return_condition">Condition After Return</Label>
              <select id="return_condition" value={returnCondition} onChange={(e) => setReturnCondition(e.target.value)} className="w-full rounded-lg border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">No change</option>
                <option value="new">New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="damaged">Damaged</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="return_notes">Notes</Label>
              <Input id="return_notes" value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} placeholder="Optional notes" />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setReturnOpen(false)}>Cancel</Button>
              <Button type="submit" variant="default" disabled={actionLoading}>{actionLoading ? "Returning..." : "Confirm Return"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
