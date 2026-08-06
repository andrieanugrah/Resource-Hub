"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { apiClient } from "@/app/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { Category, Location, Department } from "@/lib/db";
import type { Asset } from "@/lib/db";

interface Props {
  initial?: Asset;
  onSubmit: (body: Record<string, unknown>) => Promise<{ error?: string; id?: string }>;
  onSuccess: (id: string) => void;
  onCancel: () => void;
  title: string;
  submitLabel: string;
  submitting?: boolean;
}

const selectClass = "w-full rounded-lg border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export function AssetForm({ initial, onSubmit, onSuccess, onCancel, title, submitLabel, submitting: submittingProp }: Props) {
  const [cats, setCats] = useState<Category[]>([]);
  const [locs, setLocs] = useState<Location[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(initial?.image_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [specs, setSpecs] = useState<Record<string, string>>(initial?.specifications ?? {});

  const submitting = submittingProp ?? loading;

  useEffect(() => {
    Promise.all([
      apiClient("/api/meta").then((r) => r.json()),
      apiClient("/api/assets?all=true").then((r) => r.json()),
    ]).then(([d, a]) => {
      setCats(d.categories ?? []);
      setLocs(d.locations ?? []);
      setDepts(d.departments ?? []);
      setAllAssets((a.data ?? []).filter((x: Asset) => x.id !== initial?.id));
    });
  }, [initial?.id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = Object.fromEntries(fd.entries());
    // Convert empty purchase_price to undefined instead of "0" to satisfy Zod z.number()
    if (body.purchase_price === "" || body.purchase_price === "0") {
      delete body.purchase_price;
    } else if (typeof body.purchase_price === "string") {
      body.purchase_price = Number(body.purchase_price);
    }
    if (!body.parent_asset_id) delete body.parent_asset_id;
    if (!body.asset_code) delete body.asset_code;

    body.specifications = specs;
    try {
      const result = await onSubmit(body);
      if (result.error) { setError(result.error); setLoading(false); return; }
      if (result.id) onSuccess(result.id);
      setLoading(false);
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !initial?.id) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiClient(`/api/assets/${initial.id}/upload-image`, { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) setImagePreview(data.url);
      else setError(data.error ?? "Upload failed");
    } catch {
      setError("Network error");
    } finally {
      setUploading(false);
    }
  }

  function removeSpec(key: string) {
    setSpecs((prev) => { const next = { ...prev }; delete next[key]; return next; });
  }
  function addSpec() {
    setSpecs((prev) => ({ ...prev, __new__: "" }));
  }
  function updateSpec(key: string, value: string) {
    setSpecs((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={onCancel} className="mb-5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        ← Back
      </button>
      <h1 className="mb-6 text-[22px] font-bold tracking-tight text-foreground">{title}</h1>

      {error && (
        <p className="mb-5 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="rounded-2xl border-0 bg-card shadow-[var(--shadow-card)] p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="asset_code">Asset Code <span className="text-xs text-muted-foreground font-normal">(Auto if empty)</span></Label>
            <Input id="asset_code" name="asset_code" placeholder="Auto AST-YYYY-XXXX" defaultValue={initial?.asset_code ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="asset_name">Asset Name <span className="text-destructive">*</span></Label>
            <Input id="asset_name" name="asset_name" required defaultValue={initial?.asset_name ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category_id">Category <span className="text-destructive">*</span></Label>
            <select id="category_id" name="category_id" required defaultValue={initial?.category_id ?? ""} className={selectClass}>
              <option value="">Select...</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.category_name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location_id">Location <span className="text-destructive">*</span></Label>
            <select id="location_id" name="location_id" required defaultValue={initial?.location_id ?? ""} className={selectClass}>
              <option value="">Select...</option>
              {locs.map((l) => <option key={l.id} value={l.id}>{l.location_name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="parent_asset_id">Parent Asset <span className="text-xs text-muted-foreground font-normal">(Optional for Peripherals like Keyboard/Mouse)</span></Label>
            <select id="parent_asset_id" name="parent_asset_id" defaultValue={initial?.parent_asset_id ?? ""} className={selectClass}>
              <option value="">None (Independent Asset)</option>
              {allAssets.map((a) => (
                <option key={a.id} value={a.id}>{a.asset_name} ({a.asset_code})</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="brand">Brand</Label>
            <Input id="brand" name="brand" defaultValue={initial?.brand ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="model">Model</Label>
            <Input id="model" name="model" defaultValue={initial?.model ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="serial_number">Serial Number <span className="text-destructive">*</span></Label>
            <Input id="serial_number" name="serial_number" required defaultValue={initial?.serial_number ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="condition">Condition <span className="text-destructive">*</span></Label>
            <select id="condition" name="condition" required defaultValue={initial?.condition ?? "good"} className={selectClass}>
              <option value="new">New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="damaged">Damaged</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="purchase_date">Purchase Date <span className="text-destructive">*</span></Label>
            <Input id="purchase_date" type="date" name="purchase_date" required defaultValue={initial?.purchase_date ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="purchase_price">Purchase Price</Label>
            <Input id="purchase_price" type="number" name="purchase_price" min="0" defaultValue={initial?.purchase_price ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="warranty_end_date">Warranty End</Label>
            <Input id="warranty_end_date" type="date" name="warranty_end_date" defaultValue={initial?.warranty_end_date ?? ""} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="warranty_note">Warranty Note</Label>
            <Input id="warranty_note" name="warranty_note" defaultValue={initial?.warranty_note ?? ""} placeholder="e.g. AppleCare+" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cost_center">Cost Center</Label>
            <select id="cost_center" name="cost_center" defaultValue={initial?.cost_center ?? ""} className={selectClass}>
              <option value="">Select department...</option>
              {depts.map((d) => <option key={d.id} value={d.id}>{d.department_name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" name="notes" defaultValue={initial?.notes ?? ""} />
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <Label htmlFor="product_image">Product Image</Label>
          <div className="flex items-center gap-4">
            <div className="h-24 w-32 rounded-lg border bg-muted/30 flex items-center justify-center overflow-hidden">
              {imagePreview ? (
                <Image src={imagePreview} alt="Preview" width={128} height={96} unoptimized className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-muted-foreground">No image</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Input id="product_image" type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" disabled={uploading || !initial?.id} />
              {imagePreview && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setImagePreview(null)} className="text-xs text-destructive">
                  Remove
                </Button>
              )}
            </div>
          </div>
          {!initial?.id && <p className="text-xs text-muted-foreground">Save the asset first to upload an image.</p>}
        </div>

        {/* Specifications */}
        <div className="space-y-2">
          <Label>Technical Specifications</Label>
          <div className="space-y-2">
            {Object.entries(specs).map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <Input value={key} onChange={(e) => { removeSpec(key); updateSpec(e.target.value, value); }} placeholder="Key" className="flex-1" />
                <Input value={value} onChange={(e) => updateSpec(key, e.target.value)} placeholder="Value" className="flex-1" />
                <Button type="button" variant="ghost" size="sm" onClick={() => removeSpec(key)} className="text-destructive">×</Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addSpec}>+ Add Specification</Button>
        </div>

        <div className="flex gap-3 pt-2 border-t">
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Saving..." : submitLabel}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

