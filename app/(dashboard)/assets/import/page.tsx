"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/app/api-client";
import { useToast } from "@/components/ui/toast";
import { Upload, FileSpreadsheet, Download, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const TEMPLATE = "asset_code,asset_name,category_id,brand,model,serial_number,condition,status,purchase_date,purchase_price,useful_life_years,salvage_value,warranty_end_date,location_id,notes\n";

export default function ImportAssetsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: { row: number; error: string }[] } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { toast("Select a CSV file", "error"); return; }
    setSubmitting(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await apiClient("/api/assets/import", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) { toast(d.error, "error"); setResult(null); }
      else {
        setResult(d);
        toast(`${d.imported} assets imported`, "success");
      }
    } catch {
      toast("Import failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "assets_template.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader title="Import Assets" description="Bulk import assets from CSV file" />
      <Link href="/assets" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Assets
      </Link>

      <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)] mb-6">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileSpreadsheet className="h-4 w-4" />
            <span>CSV format: header row + one asset per row.</span>
          </div>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-3.5 w-3.5" /> Download CSV Template
          </Button>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="rounded-xl border-2 border-dashed p-6 text-center">
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); }}
                className="hidden"
              />
              <button type="button" onClick={() => fileRef.current?.click()} className="flex flex-col items-center gap-2 cursor-pointer">
                <Upload className="h-8 w-8 text-muted-foreground/40" />
                <span className="text-sm font-medium text-foreground">
                  {file ? file.name : "Click to select CSV file"}
                </span>
                <span className="text-xs text-muted-foreground/60">.csv files only</span>
              </button>
            </div>
            <Button type="submit" disabled={!file || submitting} className="gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <Upload className="h-4 w-4" /> Import
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)]">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <h3 className="font-semibold">Import Result</h3>
              <Badge value={`${result.imported} imported`} />
            </div>
            {result.errors.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2 text-sm text-amber-600 font-medium">
                  <AlertCircle className="h-4 w-4" /> {result.errors.length} rows skipped
                </div>
                <div className="max-h-60 overflow-y-auto rounded-xl border bg-muted/20">
                  {result.errors.map((e, i) => (
                    <div key={i} className="flex gap-2 px-3 py-1.5 text-xs border-b last:border-b-0">
                      <span className="font-mono text-muted-foreground shrink-0">Row {e.row}:</span>
                      <span className="text-destructive">{e.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.imported > 0 && result.errors.length === 0 && (
              <p className="text-sm text-muted-foreground">All rows imported successfully.</p>
            )}
            <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push("/assets")}>
              View Assets
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Badge({ value }: { value: string }) {
  return <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">{value}</span>;
}