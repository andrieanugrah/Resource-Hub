"use client";

import { apiClient } from "@/app/api-client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AssetForm } from "@/components/asset-form";

export default function NewAssetPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(body: Record<string, unknown>) {
    setSubmitting(true);
    try {
      const res = await apiClient("/api/assets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) return { error: data.error ?? "Failed" };
      return { id: data.id };
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AssetForm
      title="New Asset"
      submitLabel="Save Asset"
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
      onSuccess={(id) => router.push(`/assets/${id}`)}
      submitting={submitting}
    />
  );
}

