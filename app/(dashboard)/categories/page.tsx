"use client";

import { apiClient } from "@/app/api-client";
import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { FolderTree, Plus, Pencil, Trash2, Loader2, RefreshCw } from "lucide-react";
import type { Category } from "@/lib/db";

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  const load = useCallback(() => {
    setError("");
    setLoading(true);
    apiClient("/api/categories")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => setError("Failed to load categories"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setSubmitting(true);
    const res = await apiClient("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category_name: name, description: desc }),
    });
    const d = await res.json();
    if (!res.ok) { setMsg(d.error); toast(d.error, "error"); setSubmitting(false); return; }
    setName(""); setDesc(""); load();
    toast("Category created successfully", "success");
    setSubmitting(false);
  }

  function startEdit(c: Category) { setEditId(c.id); setEditName(c.category_name); setEditDesc(c.description); }
  function cancelEdit() { setEditId(null); setEditName(""); setEditDesc(""); }

  async function saveEdit(id: string) {
    const res = await apiClient(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category_name: editName, description: editDesc }),
    });
    const d = await res.json();
    if (!res.ok) { toast(d.error, "error"); return; }
    cancelEdit(); load();
    toast("Category updated successfully", "success");
  }

  async function deleteCategory(c: Category) {
    const ok = await confirm({
      title: "Delete Category",
      description: `Are you sure you want to delete "${c.category_name}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!ok) return;
    const res = await apiClient(`/api/categories/${c.id}`, { method: "DELETE" });
    const d = await res.json();
    if (!res.ok) { toast(d.error, "error"); return; }
    load();
    toast("Category deleted successfully", "success");
  }

  async function toggleStatus(c: Category) {
    const newStatus = c.status === "active" ? "inactive" : "active";
    const res = await apiClient(`/api/categories/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); toast(d.error ?? "Failed to update", "error"); return; }
    load();
    toast(`Category ${newStatus === "active" ? "activated" : "deactivated"}`, "success");
  }

  return (
    <div>
      <PageHeader title="Categories" description="Manage asset categories and classifications" />
      <ConfirmDialog />

      {msg && (
        <div className="mb-5 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive font-medium">{msg}</div>
      )}

      <Card className="mb-6 rounded-2xl border-0 shadow-[var(--shadow-card)]">
        <CardContent className="p-5">
          <form onSubmit={add} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Category Name *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Laptop" />
            </div>
            <div className="flex-[2] min-w-[200px]">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Description</label>
              <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional description" />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <Plus className="h-4 w-4" /> Add Category
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-2xl border-0 shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
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
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={4} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <FolderTree className="h-8 w-8 text-destructive/20" />
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
                <TableCell colSpan={4} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <FolderTree className="h-8 w-8 text-muted-foreground/20" />
                    <p className="text-sm font-medium text-muted-foreground">No categories yet</p>
                    <p className="text-xs text-muted-foreground/60">Create your first category above</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((c) => (
                <TableRow key={c.id} className="transition-colors hover:bg-muted/30">
                  <TableCell className="font-medium">
                    {editId === c.id ? (
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 text-sm" />
                    ) : c.category_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[300px]">
                    {editId === c.id ? (
                      <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="h-8 text-sm" placeholder="Description" />
                    ) : <span className="truncate block">{c.description || "-"}</span>}
                  </TableCell>
                  <TableCell>
                    <button onClick={() => toggleStatus(c)} className="cursor-pointer">
                      <Badge value={c.status} />
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {editId === c.id ? (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => saveEdit(c.id)} className="text-emerald-600 hover:text-emerald-700 text-xs">Save</Button>
                          <Button variant="ghost" size="sm" onClick={cancelEdit} className="text-xs">Cancel</Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => startEdit(c)} className="gap-1 text-xs">
                            <Pencil className="h-3 w-3" /> Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteCategory(c)} className="gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/5">
                            <Trash2 className="h-3 w-3" /> Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="border-t px-5 py-3 text-xs text-muted-foreground flex items-center gap-2">
          <FolderTree className="h-3.5 w-3.5" />
          {items.length} categor{items.length !== 1 ? "ies" : "y"}
        </div>
      </Card>
    </div>
  );
}

