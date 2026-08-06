"use client";

import { apiClient } from "@/app/api-client";
import { useEffect, useState } from "react";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  Users,
  Key,
  Building2,
  Calendar,
  CreditCard,
  X,
  Search,
  Copy,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import type { License, LicenseAssignment } from "@/lib/db";

type LicenseRow = License & { assigned_seats: number };

const TYPE_LABELS: Record<string, string> = {
  subscription: "Subscription",
  perpetual: "Perpetual",
  volume: "Volume",
  oem: "OEM",
};

export default function LicensesPage() {
  const [items, setItems] = useState<LicenseRow[]>([]);
  const [form, setForm] = useState({ license_name: "", license_key: "", vendor: "", license_type: "subscription", total_seats: "0", purchase_cost: "", purchase_date: "", expiry_date: "", description: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(form);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  // Seat management
  const [seatLic, setSeatLic] = useState<LicenseRow | null>(null);
  const [seatAssignments, setSeatAssignments] = useState<LicenseAssignment[]>([]);
  const [seatUsers, setSeatUsers] = useState<{ id: string; name: string; status?: string }[]>([]);
  const [seatUserId, setSeatUserId] = useState("");
  const [seatAddLoading, setSeatAddLoading] = useState(false);

  const load = () => {
    setError("");
    setLoading(true);
    apiClient("/api/licenses")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setError("Failed to load licenses"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  async function openSeats(l: LicenseRow) {
    setSeatLic(l);
    setSeatUserId("");
    // Load assignments + users in parallel
    const [aRes, mRes] = await Promise.all([
      apiClient(`/api/licenses/${l.id}/assignments`),
      apiClient("/api/meta"),
    ]);
    const assignments = await aRes.json();
    const meta = await mRes.json();
    setSeatAssignments(assignments);
    // Risk Fix 2: Only show active users for seat assignment
    const activeUsers = (meta.users ?? []).filter((u: { status?: string }) => u.status !== "inactive");
    setSeatUsers(activeUsers);
  }

  function closeSeats() { setSeatLic(null); }

  async function addSeat() {
    if (!seatLic || !seatUserId) return;
    setSeatAddLoading(true);
    const res = await apiClient(`/api/licenses/${seatLic.id}/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigned_user_id: seatUserId }),
    });
    const d = await res.json();
    if (!res.ok) { toast(d.error, "error"); setSeatAddLoading(false); return; }
    // Refresh
    const aRes = await apiClient(`/api/licenses/${seatLic.id}/assignments`);
    setSeatAssignments(await aRes.json());
    setSeatUserId("");
    setSeatAddLoading(false);
    load();
    toast("Seat assigned successfully", "success");
  }

  async function removeSeat(aid: string) {
    const res = await apiClient(`/api/license-assignments/${aid}`, { method: "DELETE" });
    if (!res.ok) { toast("Failed to remove seat", "error"); return; }
    setSeatAssignments((p) => p.filter((a) => a.id !== aid));
    load();
    toast("Seat assignment removed", "success");
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setSubmitting(true);
    const body: Record<string, unknown> = { license_name: form.license_name };
    if (form.license_key) body.license_key = form.license_key;
    if (form.vendor) body.vendor = form.vendor;
    body.license_type = form.license_type;
    body.total_seats = Number(form.total_seats) || 0;
    if (form.purchase_cost) body.purchase_cost = Number(form.purchase_cost);
    if (form.purchase_date) body.purchase_date = form.purchase_date;
    if (form.expiry_date) body.expiry_date = form.expiry_date;
    if (form.description) body.description = form.description;

    const res = await apiClient("/api/licenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    if (!res.ok) { setMsg(d.error); toast(d.error, "error"); setSubmitting(false); return; }
    setForm({ license_name: "", license_key: "", vendor: "", license_type: "subscription", total_seats: "0", purchase_cost: "", purchase_date: "", expiry_date: "", description: "" });
    load();
    toast("License created", "success");
    setSubmitting(false);
  }

  function startEdit(c: LicenseRow) {
    setEditId(c.id);
    setEditForm({
      license_name: c.license_name,
      license_key: c.license_key,
      vendor: c.vendor,
      license_type: c.license_type,
      total_seats: String(c.total_seats),
      purchase_cost: c.purchase_cost != null ? String(c.purchase_cost) : "",
      purchase_date: c.purchase_date,
      expiry_date: c.expiry_date ?? "",
      description: c.description,
    });
  }
  function cancelEdit() { setEditId(null); }

  async function saveEdit(id: string) {
    const body: Record<string, unknown> = {};
    body.license_name = editForm.license_name;
    if (editForm.license_key) body.license_key = editForm.license_key;
    if (editForm.vendor) body.vendor = editForm.vendor;
    body.license_type = editForm.license_type;
    body.total_seats = Number(editForm.total_seats) || 0;
    body.purchase_cost = editForm.purchase_cost ? Number(editForm.purchase_cost) : null;
    if (editForm.purchase_date) body.purchase_date = editForm.purchase_date;
    body.expiry_date = editForm.expiry_date || null;
    if (editForm.description) body.description = editForm.description;

    const res = await apiClient(`/api/licenses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    if (!res.ok) { toast(d.error, "error"); return; }
    cancelEdit(); load();
    toast("License updated", "success");
  }

  async function deleteLicense(c: License) {
    const ok = await confirm({
      title: "Delete License",
      description: `Delete "${c.license_name}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!ok) return;
    const res = await apiClient(`/api/licenses/${c.id}`, { method: "DELETE" });
    const d = await res.json();
    if (!res.ok) { toast(d.error, "error"); return; }
    load();
    toast("License deleted", "success");
  }

  async function toggleStatus(c: License) {
    const newStatus = c.status === "active" ? "inactive" : "active";
    const res = await apiClient(`/api/licenses/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) { toast("Failed to update status", "error"); return; }
    load();
    toast(`License ${newStatus === "active" ? "activated" : "deactivated"}`, "success");
  }

  function copyKey(id: string, key: string) {
    if (!key || key === "••••••••") return;
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    toast("License key copied to clipboard", "success");
    setTimeout(() => setCopiedId(null), 2000);
  }

  const userName = (uid: string) => seatUsers.find((u) => u.id === uid)?.name ?? uid;
  const assignedIds = new Set(seatAssignments.map((a) => a.assigned_user_id).filter(Boolean));
  const availableUsers = seatUsers.filter((u) => !assignedIds.has(u.id));

  // Quick stats
  const active = items.filter((l) => l.status === "active").length;
  const expiringSoon = items.filter((l) => l.status === "active" && l.expiry_date && new Date(l.expiry_date) < new Date(Date.now() + 30 * 86400000)).length;

  // Filtered items
  const filteredItems = items.filter((l) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      l.license_name.toLowerCase().includes(q) ||
      l.vendor.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      l.license_key.toLowerCase().includes(q);
    const matchesType = filterType === "all" || l.license_type === filterType;
    const matchesStatus = filterStatus === "all" || l.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Licenses" description="Manage software licenses & seat allocations" />
      <ConfirmDialog />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="rounded-2xl border-0 shadow-(--shadow-card)">
          <CardContent className="p-4 flex items-center gap-3">
            <FolderTree className="h-5 w-5 text-primary/60" />
            <div>
              <p className="text-lg font-bold">{items.length}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-(--shadow-card)">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-emerald-500/60" />
            <div>
              <p className="text-lg font-bold">{active}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-(--shadow-card)">
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-amber-500/60" />
            <div>
              <p className="text-lg font-bold">{expiringSoon}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Expiring Soon</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-(--shadow-card)">
          <CardContent className="p-4 flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-blue-500/60" />
            <div>
              <p className="text-lg font-bold">
                {items.reduce((s, l) => s + (l.total_seats || 0), 0)}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Total Seats</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {msg && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive font-medium">{msg}</div>
      )}

      {/* Add form */}
      <Card className="rounded-2xl border-0 shadow-(--shadow-card)">
        <CardContent className="p-5">
          <form onSubmit={add} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[160px] flex-1">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Name *</label>
              <Input value={form.license_name} onChange={(e) => setForm({ ...form, license_name: e.target.value })} required placeholder="Microsoft 365" className="h-9" />
            </div>
            <div className="min-w-[120px]">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">License Key</label>
              <Input value={form.license_key} onChange={(e) => setForm({ ...form, license_key: e.target.value })} placeholder="XXXX-XXXX-XXXX" className="h-9" />
            </div>
            <div className="min-w-[100px]">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Vendor</label>
              <Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="Microsoft" className="h-9" />
            </div>
            <div className="min-w-[110px]">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Type</label>
              <select value={form.license_type} onChange={(e) => setForm({ ...form, license_type: e.target.value })}
                className="h-9 w-full rounded-xl border bg-card px-3 text-sm text-foreground">
                <option value="subscription">Subscription</option>
                <option value="perpetual">Perpetual</option>
                <option value="volume">Volume</option>
                <option value="oem">OEM</option>
              </select>
            </div>
            <div className="min-w-[80px]">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Seats</label>
              <Input value={form.total_seats} onChange={(e) => setForm({ ...form, total_seats: e.target.value })} type="number" min="0" className="h-9" />
            </div>
            <div className="min-w-[120px]">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Expiry</label>
              <Input value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} type="date" className="h-9" />
            </div>
            <div className="min-w-[160px] flex-1">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Description</label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional notes" className="h-9" />
            </div>
            <Button type="submit" disabled={submitting} size="sm" className="h-9 shrink-0">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <Plus className="h-4 w-4" /> Add
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Search & Filter Bar */}
      <Card className="rounded-2xl border-0 shadow-(--shadow-card)">
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, vendor, key..."
                className="pl-9 h-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-9 rounded-xl border bg-card px-3 text-xs text-foreground"
              >
                <option value="all">All Types</option>
                <option value="subscription">Subscription</option>
                <option value="perpetual">Perpetual</option>
                <option value="volume">Volume</option>
                <option value="oem">OEM</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-9 rounded-xl border bg-card px-3 text-xs text-foreground"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden rounded-2xl border-0 shadow-(--shadow-card)">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Name</TableHead>
              <TableHead scope="col" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">License Key</TableHead>
              <TableHead scope="col" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Vendor</TableHead>
              <TableHead scope="col" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Type</TableHead>
              <TableHead scope="col" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 text-center">Seats</TableHead>
              <TableHead scope="col" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Expiry</TableHead>
              <TableHead scope="col" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Status</TableHead>
              <TableHead scope="col" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-14" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} className="py-14 text-center">
                  <p className="text-sm font-medium text-destructive">{error}</p>
                  <Button variant="outline" size="sm" onClick={load} className="mt-2"><RefreshCw className="h-4 w-4" /> Retry</Button>
                </TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-14 text-center">
                  <FolderTree className="h-8 w-8 mx-auto text-muted-foreground/20" />
                  <p className="text-sm font-medium text-muted-foreground mt-2">
                    {search || filterType !== "all" || filterStatus !== "all" ? "No licenses match your filters" : "No licenses yet"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((c) => (
                <TableRow key={c.id} className="transition-colors hover:bg-muted/30">
                  {editId === c.id ? (
                    <>
                      <TableCell><Input value={editForm.license_name} onChange={(e) => setEditForm({ ...editForm, license_name: e.target.value })} className="h-8 text-sm" /></TableCell>
                      <TableCell><Input value={editForm.license_key} onChange={(e) => setEditForm({ ...editForm, license_key: e.target.value })} className="h-8 text-sm font-mono" /></TableCell>
                      <TableCell><Input value={editForm.vendor} onChange={(e) => setEditForm({ ...editForm, vendor: e.target.value })} className="h-8 text-sm" /></TableCell>
                      <TableCell>
                        <select value={editForm.license_type} onChange={(e) => setEditForm({ ...editForm, license_type: e.target.value })}
                          className="h-8 w-full rounded-lg border bg-card px-2 text-xs">
                          <option value="subscription">Subscription</option>
                          <option value="perpetual">Perpetual</option>
                          <option value="volume">Volume</option>
                          <option value="oem">OEM</option>
                        </select>
                      </TableCell>
                      <TableCell><Input value={editForm.total_seats} onChange={(e) => setEditForm({ ...editForm, total_seats: e.target.value })} type="number" min="0" className="h-8 text-sm text-center" /></TableCell>
                      <TableCell><Input value={editForm.expiry_date} onChange={(e) => setEditForm({ ...editForm, expiry_date: e.target.value })} type="date" className="h-8 text-sm" /></TableCell>
                      <TableCell><Badge value={c.status} /></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => saveEdit(c.id)} className="text-emerald-600 text-xs">Save</Button>
                        <Button variant="ghost" size="sm" onClick={cancelEdit} className="text-xs">Cancel</Button>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{c.license_name}</span>
                          {c.description && <span className="text-[11px] text-muted-foreground/70 truncate max-w-[200px]">{c.description}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {c.license_key ? (
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs text-muted-foreground">
                              {showKeys[c.id] ? c.license_key : (c.license_key === "••••••••" ? "••••••••" : "••••••••••••")}
                            </span>
                            {c.license_key !== "••••••••" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setShowKeys((p) => ({ ...p, [c.id]: !p[c.id] }))}
                                  className="text-muted-foreground/60 hover:text-foreground p-0.5"
                                  title={showKeys[c.id] ? "Hide Key" : "Show Key"}
                                >
                                  {showKeys[c.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => copyKey(c.id, c.license_key)}
                                  className="text-muted-foreground/60 hover:text-foreground p-0.5"
                                  title="Copy Key"
                                >
                                  {copiedId === c.id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {c.vendor ? <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" />{c.vendor}</span> : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{TYPE_LABELS[c.license_type] ?? c.license_type}</TableCell>
                      <TableCell className="text-center">
                        <span className={`text-xs font-semibold ${c.assigned_seats > c.total_seats && c.total_seats > 0 ? "text-destructive" : ""}`}>
                          {c.assigned_seats}/{c.total_seats || "∞"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.expiry_date ? new Date(c.expiry_date).toLocaleDateString("id-ID") : "-"}
                      </TableCell>
                      <TableCell>
                        <button onClick={() => toggleStatus(c)} className="cursor-pointer"><Badge value={c.status} /></button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <Button variant="ghost" size="sm" onClick={() => openSeats(c)} className="gap-1 text-xs text-muted-foreground hover:text-foreground">
                            <Users className="h-3 w-3" /> Seats
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => startEdit(c)} className="gap-1 text-xs">
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteLicense(c)} className="gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/5">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="border-t px-5 py-3 text-xs text-muted-foreground flex items-center gap-2">
          <FolderTree className="h-3.5 w-3.5" />
          Showing {filteredItems.length} of {items.length} license{items.length !== 1 ? "s" : ""}
        </div>
      </Card>

      {/* Seat Management Dialog */}
      <Dialog open={!!seatLic} onOpenChange={(o) => { if (!o) closeSeats(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Seat Management — {seatLic?.license_name}</DialogTitle>
            <DialogDescription>
              {seatLic && `${TYPE_LABELS[seatLic.license_type] ?? seatLic.license_type}${seatLic.license_key && seatLic.license_key !== "••••••••" ? ` · ${seatLic.license_key}` : ""}`}
            </DialogDescription>
          </DialogHeader>

          {/* Add seat */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Assign User</label>
              <Select value={seatUserId} onValueChange={(val) => setSeatUserId(val ?? "")}>
                <SelectTrigger className="w-full"><SelectValue>{seatUserId ? userName(seatUserId) : <span className="text-muted-foreground/50">Select user...</span>}</SelectValue></SelectTrigger>
                <SelectContent>
                  {availableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                  {availableUsers.length === 0 && <p className="px-2 py-2 text-xs text-muted-foreground">No users available</p>}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" onClick={addSeat} disabled={!seatUserId || seatAddLoading} className="h-9 shrink-0">
              {seatAddLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <Plus className="h-3.5 w-3.5" /> Assign
            </Button>
          </div>

          {/* Current assignments */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Current Seats ({seatAssignments.length}{seatLic && seatLic.total_seats > 0 ? `/${seatLic.total_seats}` : ""})
            </p>
            {seatAssignments.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center">No seats assigned</p>
            ) : (
              <div className="max-h-52 overflow-y-auto space-y-1">
                {seatAssignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                        {userName(a.assigned_user_id ?? "").charAt(0)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">{userName(a.assigned_user_id ?? "")}</span>
                        <span className="text-[10px] text-muted-foreground">
                          Seat #{a.seat_number} · {new Date(a.allocated_at).toLocaleDateString("id-ID")}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={() => removeSeat(a.id)} className="shrink-0 text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeSeats} className="h-9">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
