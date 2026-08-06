import { requireUser, can } from "@/lib/auth";
import { readTable } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { SortableHeader } from "@/components/sortable-header";
import { SelectableAssetBody } from "@/components/selectable-assets";
import { AssetScannerTrigger } from "@/components/asset-scanner-trigger";
import { ChevronLeft, ChevronRight, Laptop, Monitor, Keyboard, Mouse, Printer, Server, Smartphone, MonitorUp, Headphones, Webcam, TabletSmartphone, Router, ArrowLeftRight, Wifi, Package, Download, Upload, Plus } from "lucide-react";
import Link from "next/link";

const PAGE_SIZE = 25;

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Laptop, Monitor, Keyboard, Mouse, Printer, Server,
  "Mobile Phone": Smartphone, Desktop: MonitorUp, Headset: Headphones,
  Webcam, Tablet: TabletSmartphone, Router, Switch: ArrowLeftRight,
  "Access Point": Wifi,
};

const categoryColors: Record<string, string> = {
  Laptop: "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20",
  Monitor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20",
  Keyboard: "bg-violet-500/10 text-violet-600 border-violet-500/20 hover:bg-violet-500/20",
  Mouse: "bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/20",
  Printer: "bg-slate-500/10 text-slate-600 border-slate-500/20 hover:bg-slate-500/20",
  Server: "bg-sky-500/10 text-sky-600 border-sky-500/20 hover:bg-sky-500/20",
  "Mobile Phone": "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20",
  Desktop: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 hover:bg-indigo-500/20",
  Headset: "bg-teal-500/10 text-teal-600 border-teal-500/20 hover:bg-teal-500/20",
  Webcam: "bg-pink-500/10 text-pink-600 border-pink-500/20 hover:bg-pink-500/20",
  Tablet: "bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/20",
  Router: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20 hover:bg-cyan-500/20",
  Switch: "bg-lime-500/10 text-lime-600 border-lime-500/20 hover:bg-lime-500/20",
  "Access Point": "bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/20 hover:bg-fuchsia-500/20",
};

function getCategoryColor(catName: string) {
  return categoryColors[catName] ?? "bg-muted text-muted-foreground border-border hover:bg-muted/80";
}

function getCategoryIcon(catName: string) {
  const Icon = categoryIcons[catName];
  return Icon ?? Package;
}

export default async function AssetsPage({ searchParams }: { searchParams: Promise<{ status?: string; search?: string; page?: string; sort?: string; dir?: string; category?: string; warranty?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const page = parseInt(sp.page ?? "1", 10) || 1;

  const [assets, categories, users, locations] = await Promise.all([
    readTable("assets"), readTable("categories"), readTable("users"), readTable("locations"),
  ]);
  const live = assets.filter((a) => !a.deleted_at);

  // Category summary aggregation (before filtering)
  const catCounts = new Map<string, { name: string; count: number }>();
  for (const a of live) {
    const c = categories.find((x) => x.id === a.category_id);
    const name = c?.category_name ?? "-";
    const entry = catCounts.get(name);
    if (entry) { entry.count++; } else { catCounts.set(name, { name, count: 1 }); }
  }
  const catSummary = [...catCounts.values()].sort((a, b) => b.count - a.count);

  // Filter
  let filtered = live;
  if (sp.category) filtered = filtered.filter((a) => a.category_id === sp.category);
  if (sp.status) filtered = filtered.filter((a) => a.status === sp.status);
  if (sp.warranty === "expiring") {
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    filtered = filtered.filter((a) => a.warranty_end_date && a.warranty_end_date <= thirtyDays);
  }
  if (sp.search) {
    const q = sp.search.toLowerCase();
    filtered = filtered.filter((a) =>
      a.asset_code.toLowerCase().includes(q) || a.asset_name.toLowerCase().includes(q) ||
      a.serial_number.toLowerCase().includes(q) || a.brand.toLowerCase().includes(q) ||
      a.model.toLowerCase().includes(q)
    );
  }

  const catName = (id: string) => categories.find((c) => c.id === id)?.category_name ?? "-";
  const userName = (id: string | null) => id ? (users.find((u) => u.id === id)?.name ?? "Unknown") : "-";
  const locName = (id: string) => locations.find((l) => l.id === id)?.location_name ?? "-";

  // Sort
  const sortField = sp.sort ?? "updated_at";
  const sortDir = sp.dir ?? "desc";
  filtered.sort((a, b) => {
    let va: string, vb: string;
    if (sortField === "category_id") { va = catName(a.category_id); vb = catName(b.category_id); }
    else if (sortField === "location_id") { va = locName(a.location_id); vb = locName(b.location_id); }
    else if (sortField === "assigned_user_id") { va = userName(a.assigned_user_id); vb = userName(b.assigned_user_id); }
    else {
      const av = (a as unknown as Record<string, unknown>)[sortField];
      const bv = (b as unknown as Record<string, unknown>)[sortField];
      va = av != null ? String(av) : "";
      vb = bv != null ? String(bv) : "";
    }
    const cmp = va.localeCompare(vb, undefined, { sensitivity: "base" });
    return sortDir === "asc" ? cmp : -cmp;
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const paged = filtered.slice(start, start + PAGE_SIZE);

  const linkParams = (overrides: Record<string, string>) => {
    const p = new URLSearchParams();
    if (sp.category) p.set("category", sp.category);
    if (sp.status) p.set("status", sp.status);
    if (sp.search) p.set("search", sp.search);
    if (sp.sort) p.set("sort", sp.sort);
    if (sp.dir) p.set("dir", sp.dir);
    for (const [k, v] of Object.entries(overrides)) { p.set(k, v); if (!v) p.delete(k); }
    return p.toString();
  };

  const searchParamsRecord: Record<string, string | undefined> = {
    category: sp.category, status: sp.status, search: sp.search, sort: sp.sort, dir: sp.dir,
  };
  const showCreate = can(user.role, "asset.create");
  const hasFilter = sp.category || sp.status || sp.search;

  return (
    <div>
      <PageHeader title="Assets">
        {showCreate && (
          <div className="flex flex-wrap items-center gap-2">
            <AssetScannerTrigger />
            <Link href="/assets/import" className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Upload className="h-4 w-4" /> Import CSV
            </Link>
            <Link href="/assets/new" className={buttonVariants({ variant: "default", size: "sm" })}>
              <Plus className="h-4 w-4" /> Add Asset
            </Link>
          </div>
        )}
      </PageHeader>

      {/* Category Summary */}
      {catSummary.length > 0 && (
        <div className="mb-5 overflow-x-auto -mx-1 px-1">
          <div className="flex gap-2 pb-1 min-w-max">
            <Link
              href="/assets"
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${!sp.category ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-muted/80"}`}
            >
              All <span className="tabular-nums opacity-70">({live.length})</span>
            </Link>
            {catSummary.map((c) => {
              const Icon = getCategoryIcon(c.name);
              const colorClass = getCategoryColor(c.name);
              const catId = categories.find((x) => x.category_name === c.name)?.id;
              const active = sp.category === catId;
              return (
                <Link
                  key={c.name}
                  href={active ? "/assets" : `/assets?category=${encodeURIComponent(catId ?? "")}`}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap ${active ? "bg-primary text-primary-foreground border-primary" : `${colorClass} border`}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {c.name}
                  <span className="tabular-nums opacity-60">({c.count})</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <Card className="mb-6 rounded-2xl border-0 shadow-[var(--shadow-card)]">
        <CardContent className="py-4 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3">
          <form method="get" className="flex flex-1 flex-wrap items-center gap-2 sm:gap-3">
            {sp.category && <input type="hidden" name="category" value={sp.category} />}
            {sp.sort && <input type="hidden" name="sort" value={sp.sort} />}
            {sp.dir && <input type="hidden" name="dir" value={sp.dir} />}
            <div className="relative min-w-[180px] flex-1">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
              </svg>
              <Input name="search" defaultValue={sp.search ?? ""} placeholder="Search by code, name, serial..." className="pl-10" />
            </div>
            <select name="status" defaultValue={sp.status ?? ""} className="h-10 rounded-xl border bg-card px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">All Status</option>
              <option value="available">Available</option><option value="assigned">Assigned</option>
              <option value="reserved">Reserved</option><option value="in_repair">In Repair</option>
              <option value="retired">Retired</option><option value="lost">Lost</option><option value="disposed">Disposed</option>
            </select>
            <Button type="submit">Filter</Button>
            {hasFilter && <Link href="/assets" className="inline-flex items-center justify-center rounded-lg border bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] text-sm font-medium px-3 py-2">Clear</Link>}
          </form>
          {can(user.role, "report.view_all") && (
            <Link
              href={`/api/reports/export?type=assets&format=xlsx${sp.status ? `&status=${encodeURIComponent(sp.status)}` : ""}${sp.category ? `&category=${encodeURIComponent(sp.category)}` : ""}${sp.search ? `&search=${encodeURIComponent(sp.search)}` : ""}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium hover:bg-muted transition-colors shrink-0"
              title="Export current view to styled Excel"
            >
              <Download className="h-4 w-4" /> Export Excel
            </Link>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-2xl border-0 shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col" className="w-10" />
              <TableHead scope="col"><SortableHeader label="Code" field="asset_code" currentSort={sp.sort} currentDir={sp.dir} searchParams={searchParamsRecord} /></TableHead>
              <TableHead scope="col"><SortableHeader label="Name" field="asset_name" currentSort={sp.sort} currentDir={sp.dir} searchParams={searchParamsRecord} /></TableHead>
              <TableHead scope="col"><SortableHeader label="Category" field="category_id" currentSort={sp.sort} currentDir={sp.dir} searchParams={searchParamsRecord} /></TableHead>
              <TableHead scope="col"><SortableHeader label="Status" field="status" currentSort={sp.sort} currentDir={sp.dir} searchParams={searchParamsRecord} /></TableHead>
              <TableHead scope="col"><SortableHeader label="Condition" field="condition" currentSort={sp.sort} currentDir={sp.dir} searchParams={searchParamsRecord} /></TableHead>
              <TableHead scope="col"><SortableHeader label="Location" field="location_id" currentSort={sp.sort} currentDir={sp.dir} searchParams={searchParamsRecord} /></TableHead>
              <TableHead scope="col"><SortableHeader label="Assigned To" field="assigned_user_id" currentSort={sp.sort} currentDir={sp.dir} searchParams={searchParamsRecord} /></TableHead>
              <TableHead scope="col" className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-14 text-center">
                  <p className="text-sm font-medium text-muted-foreground">No assets found.</p>
                  {hasFilter && <Link href="/assets" className="text-xs text-primary hover:underline mt-1 inline-block">Clear filters</Link>}
                </TableCell>
              </TableRow>
            ) : (
              <SelectableAssetBody
                assets={paged.map((a) => ({
                  id: a.id,
                  asset_code: a.asset_code,
                  asset_name: a.asset_name,
                  status: a.status,
                  condition: a.condition,
                  category_name: catName(a.category_id),
                  location_name: locName(a.location_id),
                  assigned_user_name: userName(a.assigned_user_id),
                }))}
              />
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t px-5 py-3">
          <span className="text-xs text-muted-foreground">
            {total} asset{total !== 1 ? "s" : ""} - page {page} of {Math.max(totalPages, 1)}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              {page > 1 && (
                <Link href={`/assets?${linkParams({ page: String(page - 1) })}`} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link key={p} href={`/assets?${linkParams({ page: String(p) })}`}
                  className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    p === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {p}
                </Link>
              ))}
              {page < totalPages && (
                <Link href={`/assets?${linkParams({ page: String(page + 1) })}`} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
