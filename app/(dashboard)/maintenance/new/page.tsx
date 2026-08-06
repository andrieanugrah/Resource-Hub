"use client";

import { apiClient } from "@/app/api-client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Wrench, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import type { Asset } from "@/lib/db";

const selectClass = "w-full rounded-lg border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export default function NewMaintenancePage() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    apiClient("/api/assets?all=true").then((r) => r.json()).then((d) => setAssets(d.data ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    try {
      const res = await apiClient("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); setLoading(false); return; }
      toast("Maintenance ticket created", "success");
      router.push(`/maintenance/${data.id}`);
    } catch { setError("Network error"); setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={() => router.back()} className="mb-5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        ← Back
      </button>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-foreground">New Maintenance Ticket</h1>
      {error && <p className="mb-5 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{error}</p>}
      <form onSubmit={handleSubmit} className="rounded-2xl border-0 bg-card shadow-[var(--shadow-card)] p-6 space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="asset_id">Asset <span className="text-destructive">*</span></Label>
          <select id="asset_id" name="asset_id" required className={selectClass}>
            <option value="">Select asset...</option>
            {assets.filter((a) => !a.deleted_at).map((a) => (
              <option key={a.id} value={a.id}>{a.asset_code} - {a.asset_name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="issue_description">Issue Description <span className="text-destructive">*</span></Label>
          <Textarea id="issue_description" name="issue_description" required rows={3} placeholder="Describe the issue..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="severity">Severity</Label>
            <select id="severity" name="severity" defaultValue="medium" className={selectClass}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="started_at">Started At</Label>
            <Input id="started_at" type="date" name="started_at" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="vendor_name">Vendor Name</Label>
            <Input id="vendor_name" name="vendor_name" placeholder="e.g. Tech Service Co" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="technician_name">Technician</Label>
            <Input id="technician_name" name="technician_name" placeholder="e.g. John" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cost_estimate">Cost Estimate</Label>
            <Input id="cost_estimate" type="number" name="cost_estimate" min="0" placeholder="0" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={2} placeholder="Additional notes..." />
        </div>
        <div className="flex gap-3 pt-2 border-t">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Wrench className="h-4 w-4" />
            {loading ? "Saving..." : "Create Ticket"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

