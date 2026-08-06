"use client";

import { apiClient } from "@/app/api-client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AssetForm } from "@/components/asset-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Package } from "lucide-react";
import type { Asset } from "@/lib/db";

export default function EditAssetPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient(`/api/assets/${id}`).then((r) => r.json()).then((d) => { setAsset(d); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  async function handleSubmit(body: Record<string, unknown>) {
    const res = await apiClient(`/api/assets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) return { error: data.error ?? "Failed" };
    return { id: data.id };
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Package className="h-12 w-12 text-muted-foreground/20" />
        <p className="text-destructive text-sm font-medium">Asset not found.</p>
        <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <AssetForm
      initial={asset}
      title="Edit Asset"
      submitLabel="Save Changes"
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
      onSuccess={(assetId) => router.push(`/assets/${assetId}`)}
    />
  );
}
