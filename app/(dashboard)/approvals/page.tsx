"use client";

import { apiClient } from "@/app/api-client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { StaggerContainer, StaggerItem } from "@/components/animated-list";
import {
  Check, X, Clock, Building2, Search, ArrowRight,
  ClipboardList, Timer, ExternalLink, RefreshCw,
} from "lucide-react";
import Link from "next/link";
import type { AssetRequest, User, Department } from "@/lib/db";

export default function ApprovalsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "processed">("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();

  const load = useCallback(() => {
    setError("");
    Promise.all([
      apiClient("/api/requests").then((r) => r.json()),
      apiClient("/api/meta").then((r) => r.json()),
    ]).then(([reqs, meta]) => {
      const role = meta.current_user?.role;
      if (role !== "manager" && role !== "super_admin") {
        router.replace("/dashboard");
        return;
      }
      setRequests(Array.isArray(reqs) ? reqs : []);
      setUsers(meta.users ?? []);
      setDepartments(meta.departments ?? []);
      setLoading(false);
    }).catch(() => setError("Failed to load approvals"));
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function approve(id: string) {
    setActionLoading(id);
    try {
      const res = await apiClient(`/api/requests/${id}/approve`, { method: "POST" });
      const d = await res.json();
      if (!res.ok) { toast(d.error, "error"); return; }
      toast("Request approved", "success");
      load();
    } catch { toast("Network error", "error"); }
    finally { setActionLoading(null); }
  }

  async function reject(id: string) {
    if (!rejectReason.trim()) { toast("Rejection reason is required", "error"); return; }
    setActionLoading(id);
    try {
      const res = await apiClient(`/api/requests/${id}/reject`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const d = await res.json();
      if (!res.ok) { toast(d.error, "error"); return; }
      toast("Request rejected", "success");
      setRejectReason("");
      load();
    } catch { toast("Network error", "error"); }
    finally { setActionLoading(null); setRejectDialogOpen(null); }
  }

  const userName = (id: string) => users.find((u) => u.id === id)?.name ?? "Unknown";
  const userDept = (id: string) => {
    const u = users.find((x) => x.id === id);
    if (!u?.department_id) return "";
    return departments.find((d) => d.id === u.department_id)?.department_name ?? "";
  };
  const initials = (id: string) => {
    const n = userName(id);
    if (n === "Unknown") return "?";
    return n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  };
  const now = useMemo(() => Date.now(), [requests, activeTab, search]);

  const timeAgo = (date: string) => {
    const diff = now - new Date(date).getTime();
    const hrs = Math.floor(diff / (1000 * 60 * 60));
    if (hrs < 1) return "Just now";
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const pending = requests.filter((r) => r.status === "pending_approval");
  const processed = requests.filter((r) => ["approved", "rejected", "completed", "cancelled"].includes(r.status));
  const displayed = activeTab === "pending" ? pending : processed;
  const filtered = search ? displayed.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.request_code.toLowerCase().includes(search.toLowerCase()) ||
    userName(r.requester_id).toLowerCase().includes(search.toLowerCase())
  ) : displayed;

  const avgHrs = pending.length > 0
    ? Math.round(pending.reduce((acc, r) => acc + (now - new Date(r.created_at).getTime()), 0) / pending.length / (1000 * 60 * 60))
    : 0;

  return (
    <div className="pb-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Approval Queue</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">Review and manage incoming asset requests from team members.</p>
        </div>
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
          <button onClick={() => setActiveTab("pending")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "pending" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            Pending ({pending.length})
          </button>
          <button onClick={() => setActiveTab("processed")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "processed" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            Processed
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search requests..." className="pl-10" />
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (<Skeleton key={i} className="h-24 w-full rounded-2xl" />))}
            </div>
          ) : error ? (
            <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)]">
              <CardContent className="flex flex-col items-center gap-3 py-12">
                <ClipboardList className="h-10 w-10 text-muted-foreground/20" />
                <p className="text-sm font-medium text-destructive">{error}</p>
                <Button variant="outline" size="sm" onClick={load}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)]">
              <CardContent className="flex flex-col items-center gap-3 py-12">
                <ClipboardList className="h-10 w-10 text-muted-foreground/20" />
                <p className="text-sm font-medium text-muted-foreground">{activeTab === "pending" ? "No pending approvals" : "No processed requests"}</p>
                <p className="text-xs text-muted-foreground/60">{activeTab === "pending" ? "All caught up!" : "Requests you've reviewed will appear here."}</p>
              </CardContent>
            </Card>
          ) : (
            <StaggerContainer className="space-y-3">
              {filtered.map((r) => {
                const isActive = r.status === "pending_approval";
                return (
                  <StaggerItem key={r.id}>
                    <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-200 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-primary/15 to-primary/5 text-primary">{initials(r.requester_id)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-semibold text-foreground truncate">{userName(r.requester_id)}</span>
                                <Badge value={r.priority} />
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Requested:{" "}
                                <Link href={`/requests/${r.id}`} className="font-medium text-foreground hover:text-primary underline-offset-2 hover:underline">{r.title}</Link>
                              </p>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/70"><Clock className="h-3 w-3" /> {timeAgo(r.created_at)}</span>
                                {userDept(r.requester_id) && (<span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/70"><Building2 className="h-3 w-3" /> {userDept(r.requester_id)}</span>)}
                                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/70 font-mono">{r.request_code}</span>
                              </div>
                            </div>
                          </div>
                          {isActive ? (
                            <div className="flex items-center gap-2 sm:flex-col sm:items-stretch shrink-0 sm:w-36">
                              <Button onClick={() => approve(r.id)} disabled={actionLoading === r.id} size="sm" className="flex-1 sm:flex-initial"><Check className="h-4 w-4" /> Approve</Button>
                              <Button variant="outline" size="sm" onClick={() => { setRejectDialogOpen(r.id); setRejectReason(""); }} disabled={actionLoading === r.id} className="border-destructive/30 text-destructive hover:bg-destructive/5 h-8"><X className="h-4 w-4" /><span className="hidden sm:inline">Reject</span></Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge value={r.status} />
                              <Link href={`/requests/${r.id}`} className="text-muted-foreground hover:text-foreground transition-colors"><ArrowRight className="h-4 w-4" /></Link>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          )}
        </div>

        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)]">
            <CardContent className="p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><ClipboardList className="h-4.5 w-4.5 text-primary" /></div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Guidelines</h3>
              </div>
              <div className="space-y-4 text-sm">
                <div><h4 className="font-semibold text-foreground mb-1">Hardware Requests</h4><p className="text-muted-foreground leading-relaxed">Verify that requests align with employee tier and role requirements. Replacements need an IT diagnostic ticket.</p></div>
                <Separator />
                <div><h4 className="font-semibold text-foreground mb-1">Software Licenses</h4><p className="text-muted-foreground leading-relaxed">Check current seat availability before approving. Enterprise tiers require Director approval.</p></div>
                <Separator />
                <Link href="/requests" className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium">View all requests <ExternalLink className="h-3.5 w-3.5" /></Link>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)]">
            <CardContent className="p-5 flex items-center justify-between">
              <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Avg Wait Time</p><p className="text-2xl font-bold text-foreground mt-1">{avgHrs} hrs</p></div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chart-3/10"><Timer className="h-6 w-6 text-chart-3" /></div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)]">
            <CardContent className="p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-3">Quick Stats</p>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl bg-muted/50 p-3"><p className="text-xl font-bold text-foreground">{pending.length}</p><p className="text-[10px] font-medium text-muted-foreground uppercase">Pending</p></div>
                <div className="rounded-xl bg-muted/50 p-3"><p className="text-xl font-bold text-foreground">{processed.length}</p><p className="text-[10px] font-medium text-muted-foreground uppercase">Processed</p></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reject Dialog — rendered at root level */}
      <Dialog open={rejectDialogOpen !== null} onOpenChange={(open) => { if (!open) { setRejectDialogOpen(null); setRejectReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>Provide a reason for rejection. This will be sent to the requester.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Rejection Reason</Label>
            <Input id="reject-reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. Budget not approved..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialogOpen(null); setRejectReason(""); }}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (rejectDialogOpen) reject(rejectDialogOpen); }} disabled={!rejectReason.trim()}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
