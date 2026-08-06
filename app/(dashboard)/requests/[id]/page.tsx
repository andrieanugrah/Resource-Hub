"use client";

import { apiClient } from "@/app/api-client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";
import { useToast } from "@/components/ui/toast";
import type { AssetRequest, User, Category } from "@/lib/db";

interface Meta { current_user: { id: string; role: string; name: string; email: string }; users: User[]; categories: Category[]; }

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [req, setReq] = useState<AssetRequest | null>(null);
  const [meta, setMeta] = useState<Meta>({ current_user: { id: "", role: "", name: "", email: "" }, users: [], categories: [] });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    apiClient(`/api/requests/${id}`).then((r) => r.json()).then((d) => { setReq(d); setLoading(false); });
    apiClient("/api/meta").then((r) => r.json()).then(setMeta);
  }, [id]);

  async function action(verb: string, body: Record<string, string> = {}) {
    setError("");
    setActionLoading(verb);
    try {
      const res = await apiClient(`/api/requests/${id}/${verb}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await res.json();
      if (!res.ok) { setError(d.error); toast(d.error, "error"); return; }
      setReq(d);
      toast("Request updated successfully", "success");
    } catch { setError("Network error"); toast("Network error", "error"); }
    finally { setActionLoading(null); }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-24" />
        <div className="mx-auto max-w-2xl">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!req) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-destructive text-sm font-medium">Request not found.</p>
        <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const requester = meta.users.find((u) => u.id === req.requester_id);
  const approver = meta.users.find((u) => u.id === req.approved_by);
  const cat = meta.categories.find((c) => c.id === req.asset_category_id);
  const isRequester = req.requester_id === meta.current_user.id;
  const canApprove = meta.current_user.role === "super_admin" || meta.current_user.role === "manager";
  const canAdminProcess = ["super_admin", "admin_it"].includes(meta.current_user.role);

  return (
    <div>
      <button onClick={() => router.back()} className="mb-5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        ← Back
      </button>

      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border-0 bg-card shadow-[var(--shadow-card)]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{req.title}</h1>
            <p className="mt-1 font-mono text-sm text-muted-foreground">{req.request_code}</p>
          </div>
          <Badge value={req.status} />
        </div>

        {/* Detail grid */}
        <div className="grid grid-cols-2 gap-y-4 gap-x-8 px-6 pb-6 text-sm">
          <div><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Type</span><p className="mt-1"><Badge value={req.request_type} /></p></div>
          <div><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Priority</span><p className="mt-1"><Badge value={req.priority} /></p></div>
          <div><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Requester</span><p className="mt-1 text-foreground">{requester?.name ?? req.requester_id}</p></div>
          <div><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Category</span><p className="mt-1 text-foreground">{cat?.category_name ?? "-"}</p></div>
          <div className="col-span-2"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Description</span><p className="mt-1 text-foreground">{req.description}</p></div>
          {req.reason && <div className="col-span-2"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Reason</span><p className="mt-1 text-muted-foreground">{req.reason}</p></div>}
          {req.required_date && <div><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Required Date</span><p className="mt-1 text-foreground">{new Date(req.required_date).toLocaleDateString("id-ID")}</p></div>}
          {approver && <div><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Approved by</span><p className="mt-1 text-foreground">{approver.name} <span className="text-muted-foreground text-xs">at {formatDateTime(req.approved_at)}</span></p></div>}
          {req.rejected_reason && <div className="col-span-2"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Rejection Reason</span><p className="mt-1 text-destructive">{req.rejected_reason}</p></div>}
          <div className="col-span-2"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Created</span><p className="mt-1 text-muted-foreground">{formatDateTime(req.created_at)}</p></div>
        </div>

        {/* Error */}
        {error && <div className="mx-6 mb-4 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-xs text-destructive font-medium">{error}</div>}

        {/* Actions */}
        <div className="flex items-center gap-3 border-t px-6 py-4">
          {req.status === "draft" && isRequester && (
            <Button onClick={() => action("submit")} disabled={actionLoading !== null}>Submit Request</Button>
          )}
          {req.status === "pending_approval" && canApprove && (
            <>
              <Button onClick={() => action("approve")} disabled={actionLoading !== null}>Approve</Button>
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Reason (required for rejection)"
                  className="flex-1"
                  disabled={actionLoading !== null}
                />
                <Button variant="destructive" onClick={() => action("reject", { reason: note })} disabled={actionLoading !== null}>Reject</Button>
              </div>
            </>
          )}
          {req.status === "approved" && (isRequester || canAdminProcess) && (
            <Button onClick={() => action("mark_in_progress")} disabled={actionLoading !== null} className="bg-indigo-600 hover:bg-indigo-700 text-white">Mark In Progress</Button>
          )}
          {req.status === "in_progress" && (isRequester || canAdminProcess) && (
            <Button onClick={() => action("mark_completed")} disabled={actionLoading !== null} variant="default">Mark Completed</Button>
          )}
          {(isRequester || canAdminProcess) && !["cancelled", "completed", "rejected"].includes(req.status) && (
            <Button variant="outline" onClick={() => action("cancel")} disabled={actionLoading !== null} className="text-destructive border-destructive/30 hover:bg-destructive/10">Cancel Request</Button>
          )}
        </div>
      </div>
    </div>
  );
}
