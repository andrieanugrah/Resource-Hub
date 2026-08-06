"use client";

import { apiClient } from "@/app/api-client";
import { useEffect, useState, useRef, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Plus, Trash2, Search, Loader2, RefreshCw, Pencil, Key, User as UserIcon, Shield, Building } from "lucide-react";
import { motion } from "motion/react";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { OpenSplitButton } from "@/components/open-split-button";
import type { User, Department, Role } from "@/lib/db";

const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  admin_it: "IT Admin",
  manager: "Manager",
  employee: "Employee",
};

const ROLE_AVATAR_COLORS: Record<Role, string> = {
  super_admin: "bg-violet-500/15 text-violet-700 border-violet-500/20",
  admin_it: "bg-blue-500/15 text-blue-700 border-blue-500/20",
  manager: "bg-amber-500/15 text-amber-700 border-amber-500/20",
  employee: "bg-emerald-500/15 text-emerald-700 border-emerald-500/20",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function SectionLabel({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

/* ── shared error banner ── */
function ErrorBanner({ children }: { children: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, height: 0, y: -4 }}
      animate={{ opacity: 1, height: "auto", y: 0 }}
      className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-xs text-destructive"
    >{children}</motion.p>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPassword, setCPassword] = useState("");
  const [cRole, setCRole] = useState<Role>("employee");
  const [cDept, setCDept] = useState("");
  const [cJobTitle, setCJobTitle] = useState("");
  const [createError, setCreateError] = useState("");

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [eName, setEName] = useState("");
  const [eEmail, setEEmail] = useState("");
  const [eRole, setERole] = useState<Role>("employee");
  const [eDept, setEDept] = useState("");
  const [eJobTitle, setEJobTitle] = useState("");
  const [editError, setEditError] = useState("");

  // Reset password
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");

  const [jobTitleEdits, setJobTitleEdits] = useState<Record<string, string>>({});
  const canManageUsers = !error;

  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const createRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setError("");
    setLoading(true);
    Promise.all([apiClient("/api/users"), apiClient("/api/meta").then((r) => r.json())])
      .then(async ([usersRes, meta]) => {
        if (usersRes.status === 403) {
          setError("You do not have permission to manage users.");
          setUsers([]);
          setDepartments(meta.departments ?? []);
          return;
        }
        const users = await usersRes.json();
        setUsers(users ?? []);
        setDepartments(meta.departments ?? []);
      })
      .catch(() => setError("Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (createOpen) setTimeout(() => createRef.current?.focus(), 100); }, [createOpen]);
  useEffect(() => { if (editOpen) setTimeout(() => editRef.current?.focus(), 100); }, [editOpen]);

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  async function patchUser(id: string, data: Record<string, unknown>) {
    setSaving(true);
    const res = await apiClient(`/api/users/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) { toast(d.error, "error"); return false; }
    load(); router.refresh();
    return true;
  }

  async function saveInline(id: string, data: Record<string, unknown>) {
    const ok = await patchUser(id, data);
    if (ok) toast("User updated successfully", "success");
  }

  function openEdit(u: User) {
    setEditId(u.id);
    setEName(u.name); setEEmail(u.email); setERole(u.role); setEDept(u.department_id ?? ""); setEJobTitle(u.job_title ?? "");
    setEditError(""); setResetOpen(false); setResetPassword(""); setResetError("");
    setEditOpen(true);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault(); setCreateError(""); setSaving(true);
    const res = await apiClient("/api/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: cName, email: cEmail, password: cPassword, role: cRole, department_id: cDept || null, job_title: cJobTitle || null }),
    });
    const d = await res.json(); setSaving(false);
    if (!res.ok) { setCreateError(d.error); return; }
    setCreateOpen(false); clearCreate();
    load(); toast("User created successfully", "success");
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault(); if (!editId) return; setEditError(""); setSaving(true);
    const res = await apiClient(`/api/users/${editId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: eName, email: eEmail, role: eRole, department_id: eDept || null, job_title: eJobTitle || null }),
    });
    const d = await res.json(); setSaving(false);
    if (!res.ok) { setEditError(d.error); return; }
    setEditOpen(false); setEditId(null);
    load(); router.refresh(); toast("User updated successfully", "success");
  }

  async function handleResetPassword() {
    if (!editId) return; setResetError(""); setSaving(true);
    const res = await apiClient(`/api/users/${editId}/reset-password`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ new_password: resetPassword }),
    });
    const d = await res.json(); setSaving(false);
    if (!res.ok) { setResetError(d.error); return; }
    setResetOpen(false); setResetPassword("");
    toast("Password reset successfully", "success");
  }

  async function deleteUser(u: User) {
    const ok = await confirm({ title: "Deactivate User", description: `Deactivate "${u.name}"?`, confirmLabel: "Deactivate", variant: "destructive" });
    if (!ok) return;
    await patchUser(u.id, { status: "inactive" });
    toast("User deactivated", "success");
  }

  function clearCreate() {
    setCName(""); setCEmail(""); setCPassword(""); setCRole("employee"); setCDept(""); setCJobTitle("");
  }

  return (
    <div>
      <PageHeader title="Users" />
      <ConfirmDialog />

      {/* ─── Search + Add ─── */}
      <Card className="mb-6 rounded-2xl border-0 shadow-(--shadow-card)">
        <CardContent className="py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="pl-10" />
            </div>
            <Button onClick={() => { clearCreate(); setCreateError(""); setCreateOpen(true); }} disabled={!!error}>
              <Plus className="h-4 w-4" /> Add User
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── Table ─── */}
      <Card className="overflow-hidden rounded-2xl border-0 shadow-(--shadow-card)">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Name</TableHead>
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Email</TableHead>
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Role</TableHead>
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Department</TableHead>
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Job Title</TableHead>
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Status</TableHead>
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 text-right">Actions</TableHead>
              <TableHead scope="col" className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-8 w-8 text-destructive/20" />
                    <p className="text-sm font-medium text-destructive">{error}</p>
                    <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" />Retry</Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-8 w-8 text-muted-foreground/20" />
                    <p className="text-sm font-medium text-muted-foreground">{search ? "No users match your search" : "No users yet"}</p>
                    {!search && <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" />Create first user</Button>}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u, idx) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut", delay: Math.min(idx * 0.04, 0.3) }}
                  className="group transition-colors hover:bg-muted/30 border-b border-border/50"
                >
                  <TableCell>
                    <button onClick={() => openEdit(u)} className="font-medium text-left hover:text-primary transition-colors cursor-pointer">{u.name}</button>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Select
                      value={u.role}
                      onValueChange={(v) => saveInline(u.id, { role: v as Role })}
                      disabled={saving || !canManageUsers}
                    >
                      <SelectTrigger size="sm" className="w-auto min-w-[110px] text-xs">
                        <SelectValue>{ROLE_LABELS[u.role]}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={u.department_id ?? ""}
                      onValueChange={(v) => saveInline(u.id, { department_id: v || null })}
                      disabled={saving || !canManageUsers}
                    >
                      <SelectTrigger size="sm" className="w-auto min-w-[130px] text-xs max-w-40">
                        <SelectValue>
                          {u.department_id
                            ? departments.find((d) => d.id === u.department_id)?.department_name ?? "—"
                            : <span className="text-muted-foreground/50">None</span>}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.department_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={jobTitleEdits[u.id] ?? u.job_title ?? ""}
                      onChange={(e) => setJobTitleEdits((p) => ({ ...p, [u.id]: e.target.value }))}
                      onBlur={(e) => { saveInline(u.id, { job_title: e.target.value || null }); setJobTitleEdits((p) => { const n = { ...p }; delete n[u.id]; return n; }); }}
                      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                      disabled={saving || !canManageUsers} className="h-8 text-xs" placeholder="Job title" />
                  </TableCell>
                  <TableCell>
                    <button onClick={() => saveInline(u.id, { status: u.status === "active" ? "inactive" : "active" })} className="cursor-pointer" disabled={!canManageUsers}>
                      <Badge value={u.status} />
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(u)} disabled={!canManageUsers} className="text-muted-foreground hover:text-foreground text-xs" aria-label="Edit"><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteUser(u)} disabled={!canManageUsers} className="text-destructive hover:text-destructive hover:bg-destructive/5 text-xs" aria-label="Delete"><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                  <TableCell className="w-8"><OpenSplitButton tab={{ id: u.id, type: "user", label: u.name }} /></TableCell>
                  </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
        <div className="border-t px-5 py-3 text-xs text-muted-foreground flex items-center gap-2">
          <Users className="h-3.5 w-3.5" />{filtered.length} user{filtered.length !== 1 ? "s" : ""}
        </div>
      </Card>

      {/* ═══════════════ Create User Dialog ═══════════════ */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle>Create User</DialogTitle>
                <DialogDescription>Add a new user to the system.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {createError && <ErrorBanner>{createError}</ErrorBanner>}
          <form onSubmit={handleCreate} className="space-y-4">
            {/* ── Account Information ── */}
            <div className="space-y-3 rounded-xl bg-muted/50 p-4">
              <SectionLabel icon={UserIcon} label="Account Information" />
              <div className="space-y-1.5">
                <Label htmlFor="c_name" className="text-xs font-medium">Name <span className="text-destructive">*</span></Label>
                <Input id="c_name" ref={createRef} value={cName} onChange={(e) => setCName(e.target.value)} required className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c_email" className="text-xs font-medium">Email <span className="text-destructive">*</span></Label>
                <Input id="c_email" type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} required className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c_password" className="text-xs font-medium">Password <span className="text-destructive">*</span></Label>
                <Input id="c_password" type="password" value={cPassword} onChange={(e) => setCPassword(e.target.value)} required minLength={6} className="h-9" placeholder="Minimum 6 characters" />
              </div>
            </div>

            {/* ── Role & Access ── */}
            <div className="space-y-3 rounded-xl bg-muted/50 p-4">
              <SectionLabel icon={Shield} label="Role & Access" />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="c_role" className="text-xs font-medium">Role</Label>
                  <Select value={cRole} onValueChange={(v) => setCRole(v as Role)}>
                    <SelectTrigger id="c_role" className="h-9"><SelectValue>{ROLE_LABELS[cRole]}</SelectValue></SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c_dept" className="text-xs font-medium">Department</Label>
                  <Select value={cDept} onValueChange={(v) => setCDept(v ?? "")}>
                    <SelectTrigger id="c_dept" className="h-9"><SelectValue>{cDept ? departments.find((d) => d.id === cDept)?.department_name : <span className="text-muted-foreground/50">None</span>}</SelectValue></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.department_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* ── Additional ── */}
            <div className="space-y-3 rounded-xl bg-muted/50 p-4">
              <SectionLabel icon={Building} label="Additional" />
              <div className="space-y-1.5">
                <Label htmlFor="c_job" className="text-xs font-medium">Job Title</Label>
                <Input id="c_job" value={cJobTitle} onChange={(e) => setCJobTitle(e.target.value)} placeholder="e.g. Senior Engineer" className="h-9" />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setCreateOpen(false)} disabled={saving} className="h-9">Cancel</Button>
              <Button type="submit" disabled={saving} className="h-9">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ═══════════════ Edit User Dialog ═══════════════ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold", ROLE_AVATAR_COLORS[eRole])}>
                {getInitials(eName)}
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base">{eName}</DialogTitle>
                <DialogDescription className="flex items-center gap-2 text-xs">
                  <span className="truncate">{eEmail}</span>
                  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {ROLE_LABELS[eRole]}
                  </span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {editError && <ErrorBanner>{editError}</ErrorBanner>}
          <form onSubmit={handleEdit} className="space-y-4">
            {/* ── Account Information ── */}
            <div className="space-y-3 rounded-xl bg-muted/50 p-4">
              <SectionLabel icon={UserIcon} label="Account Information" />
              <div className="space-y-1.5">
                <Label htmlFor="e_name" className="text-xs font-medium">Name <span className="text-destructive">*</span></Label>
                <Input id="e_name" ref={editRef} value={eName} onChange={(e) => setEName(e.target.value)} required className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="e_email" className="text-xs font-medium">Email <span className="text-destructive">*</span></Label>
                <Input id="e_email" type="email" value={eEmail} onChange={(e) => setEEmail(e.target.value)} required className="h-9" />
              </div>
            </div>

            {/* ── Role & Access ── */}
            <div className="space-y-3 rounded-xl bg-muted/50 p-4">
              <SectionLabel icon={Shield} label="Role & Access" />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="e_role" className="text-xs font-medium">Role</Label>
                  <Select value={eRole} onValueChange={(v) => setERole(v as Role)}>
                    <SelectTrigger id="e_role" className="h-9"><SelectValue>{ROLE_LABELS[eRole]}</SelectValue></SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="e_dept" className="text-xs font-medium">Department</Label>
                  <Select value={eDept} onValueChange={(v) => setEDept(v ?? "")}>
                    <SelectTrigger id="e_dept" className="h-9"><SelectValue>{eDept ? departments.find((d) => d.id === eDept)?.department_name : <span className="text-muted-foreground/50">None</span>}</SelectValue></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.department_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* ── Additional ── */}
            <div className="space-y-3 rounded-xl bg-muted/50 p-4">
              <SectionLabel icon={Building} label="Additional" />
              <div className="space-y-1.5">
                <Label htmlFor="e_job" className="text-xs font-medium">Job Title</Label>
                <Input id="e_job" value={eJobTitle} onChange={(e) => setEJobTitle(e.target.value)} placeholder="e.g. Senior Engineer" className="h-9" />
              </div>
            </div>

            {/* ─── Reset Password ─── */}
            <div className="space-y-3 rounded-xl bg-muted/50 p-4">
              <SectionLabel icon={Key} label="Security" />
              {!resetOpen ? (
                <Button type="button" variant="outline" size="sm" onClick={() => setResetOpen(true)} className="h-8 text-xs">
                  <Key className="h-3.5 w-3.5 mr-1.5" />Reset Password
                </Button>
              ) : (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2.5">
                  <Label htmlFor="r_pw" className="text-xs font-medium">New Password</Label>
                  <Input id="r_pw" type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} placeholder="Minimum 6 characters" minLength={6} required className="h-9" />
                  {resetError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-destructive">{resetError}</motion.p>}
                  <div className="flex gap-2 pt-1">
                    <Button type="button" size="sm" disabled={saving || resetPassword.length < 6} onClick={handleResetPassword} className="h-8 text-xs">
                      {saving && <Loader2 className="h-3 w-3 animate-spin" />}{saving ? "Setting..." : "Set New Password"}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setResetOpen(false); setResetPassword(""); setResetError(""); }} className="h-8 text-xs">Cancel</Button>
                  </div>
                </motion.div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditOpen(false)} disabled={saving} className="h-9">Cancel</Button>
              <Button type="submit" disabled={saving} className="h-9">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
