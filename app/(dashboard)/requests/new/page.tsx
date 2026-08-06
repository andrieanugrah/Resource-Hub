"use client";

import { apiClient } from "@/app/api-client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import type { Category } from "@/lib/db";

const selectClass = "w-full rounded-lg border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export default function NewRequestPage() {
  const router = useRouter();
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => { apiClient("/api/meta").then((r) => r.json()).then((d) => setCats(d.categories)); }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    try {
      const res = await apiClient("/api/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); setLoading(false); return; }
      toast("Request created successfully", "success");
      router.push(`/requests/${data.id}`);
    } catch { setError("Network error"); setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={() => router.back()} className="mb-5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        ← Back
      </button>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-foreground">New Request</h1>
      {error && <p className="mb-5 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{error}</p>}
      <form onSubmit={handleSubmit} className="rounded-2xl border-0 bg-card shadow-[var(--shadow-card)] p-6 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="request_type">Request Type <span className="text-destructive">*</span></Label>
          <select id="request_type" name="request_type" required className={selectClass}>
            <option value="new_asset">New Asset</option><option value="replacement">Replacement</option>
            <option value="temporary_loan">Temporary Loan</option><option value="return">Return</option>
            <option value="repair">Repair</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
          <Input id="title" name="title" required placeholder="e.g. Laptop upgrade for new hire" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="asset_category_id">Category</Label>
          <select id="asset_category_id" name="asset_category_id" className={selectClass}>
            <option value="">Select...</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.category_name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
          <Textarea id="description" name="description" required rows={3} placeholder="Describe your request..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="priority">Priority</Label>
            <select id="priority" name="priority" className={selectClass}>
              <option value="medium">Medium</option><option value="low">Low</option>
              <option value="high">High</option><option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="required_date">Required Date</Label>
            <Input id="required_date" type="date" name="required_date" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reason">Reason</Label>
          <Input id="reason" name="reason" />
        </div>
        <div className="flex gap-3 pt-2 border-t">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Saving..." : "Submit Request"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

