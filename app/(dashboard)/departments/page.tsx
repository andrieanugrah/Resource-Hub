"use client";

import { apiClient } from "@/app/api-client";
import { useEffect, useState } from "react";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Plus, Pencil, Trash2, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import type { Department } from "@/lib/db";

export default function DepartmentsPage() {
  const [items, setItems] = useState<Department[]>([]);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Department>>({});
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  const load = () => {
    setError("");
    setLoading(true);
    apiClient("/api/departments").then((r) => r.json()).then(setItems).catch(() => setError("Failed to load departments")).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault(); setMsg("");
    setSubmitting(true);
    const res = await apiClient("/api/departments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ department_code: code, department_name: name, description: desc }),
    });
    const d = await res.json();
    if (!res.ok) { setMsg(d.error); toast(d.error, "error"); setSubmitting(false); return; }
    setCode(""); setName(""); setDesc(""); load();
    toast("Department created successfully", "success");
    setSubmitting(false);
  }

  function startEdit(dep: Department) {
    setEditId(dep.id);
    setEditData({ department_code: dep.department_code, department_name: dep.department_name, description: dep.description });
  }
  function cancelEdit() { setEditId(null); setEditData({}); }

  async function saveEdit(id: string) {
    const res = await apiClient(`/api/departments/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editData),
    });
    const d = await res.json();
    if (!res.ok) { toast(d.error, "error"); return; }
    cancelEdit(); load(); toast("Department updated successfully", "success");
  }

  async function deleteDept(dep: Department) {
    const ok = await confirm({
      title: "Delete Department",
      description: `Are you sure you want to delete "${dep.department_name}"? This action cannot be undone.`,
      confirmLabel: "Delete", variant: "destructive",
    });
    if (!ok) return;
    const res = await apiClient(`/api/departments/${dep.id}`, { method: "DELETE" });
    const d = await res.json();
    if (!res.ok) { toast(d.error, "error"); return; }
    load(); toast("Department deleted successfully", "success");
  }

  async function toggleStatus(dep: Department) {
    const newStatus = dep.status === "active" ? "inactive" : "active";
    const res = await apiClient(`/api/departments/${dep.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast(d.error ?? "Failed to update", "error"); return; }
    load();
    toast(`Department ${newStatus === "active" ? "activated" : "deactivated"}`, "success");
  }

  return (
    <div>
      <PageHeader title="Departments" description="Manage organizational departments" />
      <ConfirmDialog />

      {msg && (
        <div className="mb-5 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive font-medium">{msg}</div>
      )}

      <Card className="mb-6 rounded-2xl border-0 shadow-[var(--shadow-card)]">
        <CardContent className="p-5">
          <form onSubmit={add} className="flex flex-wrap items-end gap-3">
            <div className="w-28">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Code *</label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} required placeholder="e.g. IT" />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Name *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Information Technology" />
            </div>
            <div className="flex-[2] min-w-[200px]">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Description</label>
              <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional description" />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <Plus className="h-4 w-4" /> Add Department
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-2xl border-0 shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Code</TableHead>
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Name</TableHead>
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Description</TableHead>
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Status</TableHead>
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="h-8 w-8 text-destructive/20" />
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
                <TableCell colSpan={5} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="h-8 w-8 text-muted-foreground/20" />
                    <p className="text-sm font-medium text-muted-foreground">No departments yet</p>
                    <p className="text-xs text-muted-foreground/60">Create your first department above</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : items.map((d) => (
              <TableRow key={d.id} className="transition-colors hover:bg-muted/30">
                {editId === d.id ? (
                  <>
                    <TableCell><Input value={editData.department_code || ""} onChange={(e) => setEditData({ ...editData, department_code: e.target.value })} className="h-8 text-sm" /></TableCell>
                    <TableCell><Input value={editData.department_name || ""} onChange={(e) => setEditData({ ...editData, department_name: e.target.value })} className="h-8 text-sm" /></TableCell>
                    <TableCell><Input value={editData.description || ""} onChange={(e) => setEditData({ ...editData, description: e.target.value })} className="h-8 text-sm" /></TableCell>
                    <TableCell><Badge value={d.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => saveEdit(d.id)} className="text-emerald-600 hover:text-emerald-700 text-xs">Save</Button>
                        <Button variant="ghost" size="sm" onClick={cancelEdit} className="text-xs">Cancel</Button>
                      </div>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell className="font-mono font-medium">{d.department_code}</TableCell>
                    <TableCell className="font-medium">{d.department_name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[300px]"><span className="truncate block">{d.description || "-"}</span></TableCell>
                    <TableCell>
                      <button onClick={() => toggleStatus(d)} className="cursor-pointer"><Badge value={d.status} /></button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(d)} className="gap-1 text-xs">
                          <Pencil className="h-3 w-3" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteDept(d)} className="gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/5">
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
          <Building2 className="h-3.5 w-3.5" />
          {items.length} department{items.length !== 1 ? "s" : ""}
        </div>
      </Card>
    </div>
  );
}

