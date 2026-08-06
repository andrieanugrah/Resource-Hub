"use client";

import { apiClient } from "@/app/api-client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, Plus, Pencil, Trash2, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import type { Location } from "@/lib/db";

export default function LocationsPage() {
  const [items, setItems] = useState<Location[]>([]);
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [room, setRoom] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Location>>({});
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  const load = () => {
    setError("");
    setLoading(true);
    apiClient("/api/locations").then((r) => r.json()).then(setItems).catch(() => setError("Failed to load locations")).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault(); setMsg("");
    setSubmitting(true);
    const res = await apiClient("/api/locations", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location_name: name, branch_name: branch, building, floor, room }),
    });
    const d = await res.json();
    if (!res.ok) { setMsg(d.error); toast(d.error, "error"); setSubmitting(false); return; }
    setName(""); setBranch(""); setBuilding(""); setFloor(""); setRoom(""); load();
    toast("Location created successfully", "success");
    setSubmitting(false);
  }

  function startEdit(loc: Location) {
    setEditId(loc.id);
    setEditData({ location_name: loc.location_name, branch_name: loc.branch_name, building: loc.building, floor: loc.floor, room: loc.room });
  }
  function cancelEdit() { setEditId(null); setEditData({}); }

  async function saveEdit(id: string) {
    const res = await apiClient(`/api/locations/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editData),
    });
    const d = await res.json();
    if (!res.ok) { toast(d.error, "error"); return; }
    cancelEdit(); load(); toast("Location updated successfully", "success");
  }

  async function deleteLocation(loc: Location) {
    const ok = await confirm({
      title: "Delete Location",
      description: `Are you sure you want to delete "${loc.location_name}"? This action cannot be undone.`,
      confirmLabel: "Delete", variant: "destructive",
    });
    if (!ok) return;
    const res = await apiClient(`/api/locations/${loc.id}`, { method: "DELETE" });
    const d = await res.json();
    if (!res.ok) { toast(d.error, "error"); return; }
    load(); toast("Location deleted successfully", "success");
  }

  return (
    <div>
      <PageHeader title="Locations" description="Manage physical locations and rooms" />
      <ConfirmDialog />

      {msg && (
        <div className="mb-5 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive font-medium">{msg}</div>
      )}

      <Card className="mb-6 rounded-2xl border-0 shadow-[var(--shadow-card)]">
        <CardContent className="p-5">
          <form onSubmit={add} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Location Name *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Main Office" />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Branch</label>
              <Input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="e.g. Jakarta" />
            </div>
            <div className="w-32">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Building</label>
              <Input value={building} onChange={(e) => setBuilding(e.target.value)} placeholder="e.g. A" />
            </div>
            <div className="w-20">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Floor</label>
              <Input value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="e.g. 3" />
            </div>
            <div className="w-20">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Room</label>
              <Input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g. 301" />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <Plus className="h-4 w-4" /> Add Location
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-2xl border-0 shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Name</TableHead>
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Branch</TableHead>
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Building</TableHead>
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Floor</TableHead>
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Room</TableHead>
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <MapPin className="h-8 w-8 text-destructive/20" />
                    <p className="text-sm font-medium text-destructive">{error}</p>
                    <Button variant="outline" size="sm" onClick={load}>
                      <RefreshCw className="h-4 w-4" />
                      Retry
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <MapPin className="h-8 w-8 text-muted-foreground/20" />
                    <p className="text-sm font-medium text-muted-foreground">No locations yet</p>
                    <p className="text-xs text-muted-foreground/60">Create your first location above</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : items.map((l) => (
              <TableRow key={l.id} className="transition-colors hover:bg-muted/30">
                {editId === l.id ? (
                  <>
                    <TableCell><Input value={editData.location_name || ""} onChange={(e) => setEditData({ ...editData, location_name: e.target.value })} className="h-8 text-sm" /></TableCell>
                    <TableCell><Input value={editData.branch_name || ""} onChange={(e) => setEditData({ ...editData, branch_name: e.target.value })} className="h-8 text-sm" /></TableCell>
                    <TableCell><Input value={editData.building || ""} onChange={(e) => setEditData({ ...editData, building: e.target.value })} className="h-8 text-sm" /></TableCell>
                    <TableCell><Input value={editData.floor || ""} onChange={(e) => setEditData({ ...editData, floor: e.target.value })} className="h-8 text-sm" /></TableCell>
                    <TableCell><Input value={editData.room || ""} onChange={(e) => setEditData({ ...editData, room: e.target.value })} className="h-8 text-sm" /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => saveEdit(l.id)} className="text-emerald-600 hover:text-emerald-700 text-xs">Save</Button>
                        <Button variant="ghost" size="sm" onClick={cancelEdit} className="text-xs">Cancel</Button>
                      </div>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell className="font-medium">{l.location_name}</TableCell>
                    <TableCell className="text-muted-foreground">{l.branch_name || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{l.building || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{l.floor || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{l.room || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(l)} className="gap-1 text-xs">
                          <Pencil className="h-3 w-3" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteLocation(l)} className="gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/5">
                          <Trash2 className="h-3 w-3" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="border-t px-5 py-3 text-xs text-muted-foreground flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5" />
          {items.length} location{items.length !== 1 ? "s" : ""}
        </div>
      </Card>
    </div>
  );
}

