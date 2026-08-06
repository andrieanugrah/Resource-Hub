import { requireUser, can } from "@/lib/auth";
import { readTable } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Download, Package, FileText, Wrench } from "lucide-react";
import Link from "next/link";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ status?: string; category?: string; search?: string; reportType?: string; format?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  if (!can(user.role, "report.view_all")) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-destructive text-sm font-medium">You do not have permission to view reports.</p>
      </div>
    );
  }
  const [assets, categories, , , requests, maintenance] = await Promise.all([
    readTable("assets"), readTable("categories"), readTable("locations"),
    readTable("departments"), readTable("requests"), readTable("maintenance_logs"),
  ]);

  const live = assets.filter((a) => !a.deleted_at);

  const byStatus: Record<string, number> = {};
  for (const a of live) byStatus[a.status] = (byStatus[a.status] || 0) + 1;

  const byCategory: Record<string, { name: string; count: number }> = {};
  for (const a of live) {
    const cat = categories.find((c) => c.id === a.category_id);
    const name = cat?.category_name ?? "Unknown";
    if (!byCategory[name]) byCategory[name] = { name, count: 0 };
    byCategory[name].count++;
  }

  const warrantyExpiring = live.filter((a) => {
    if (!a.warranty_end_date) return false;
    const d = new Date(a.warranty_end_date);
    const thirty = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return d <= thirty && d >= new Date();
  });

  const pendingRequests = requests.filter((r) => r.status === "pending_approval").length;
  const openMaintenance = maintenance.filter((m) => m.status !== "closed" && m.status !== "resolved").length;

  const statusColor: Record<string, string> = {
    available: "bg-emerald-500", assigned: "bg-blue-500", reserved: "bg-amber-500",
    in_repair: "bg-orange-500", retired: "bg-slate-500", lost: "bg-red-500", disposed: "bg-gray-500",
  };

  return (
    <div>
      <PageHeader title="Reports" description="Asset and operations overview" />

      {/* Export filter — exports respect selected filters */}
      <Card className="mb-8 rounded-2xl border-0 shadow-[var(--shadow-card)]">
        <CardContent className="py-4">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="reportType">Report type</label>
              <select id="reportType" name="reportType" defaultValue={sp.reportType ?? "assets"} className="h-10 rounded-xl border bg-card px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="assets">All Assets</option>
                <option value="in_repair">In Repair</option>
                <option value="retired">Retired</option>
                <option value="warranty_expiring">Warranty Expiring (≤30d)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="search">Search</label>
              <Input id="search" name="search" defaultValue={sp.search ?? ""} placeholder="Code, name, serial, brand…" className="w-56" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="status">Status</label>
              <select id="status" name="status" defaultValue={sp.status ?? ""} className="h-10 rounded-xl border bg-card px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">All Status</option>
                <option value="available">Available</option><option value="assigned">Assigned</option>
                <option value="reserved">Reserved</option><option value="in_repair">In Repair</option>
                <option value="retired">Retired</option><option value="lost">Lost</option><option value="disposed">Disposed</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="category">Category</label>
              <select id="category" name="category" defaultValue={sp.category ?? ""} className="h-10 rounded-xl border bg-card px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">All Categories</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.category_name}</option>)}
              </select>
            </div>
            <Button type="submit">Apply</Button>
            <Link
              href={`/api/reports/export?type=${encodeURIComponent(sp.reportType ?? "assets")}&format=xlsx${sp.status ? `&status=${encodeURIComponent(sp.status)}` : ""}${sp.category ? `&category=${encodeURIComponent(sp.category)}` : ""}${sp.search ? `&search=${encodeURIComponent(sp.search)}` : ""}`}
              className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
              title="Export filtered report to styled Excel"
            >
              <Download className="h-4 w-4" /> Export Excel
            </Link>
            <Link
              href={`/api/reports/export?type=${encodeURIComponent(sp.reportType ?? "assets")}&format=csv${sp.status ? `&status=${encodeURIComponent(sp.status)}` : ""}${sp.category ? `&category=${encodeURIComponent(sp.category)}` : ""}${sp.search ? `&search=${encodeURIComponent(sp.search)}` : ""}`}
              className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
              title="Export filtered report to CSV"
            >
              <Download className="h-4 w-4" /> Export CSV
            </Link>
          </form>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <Package className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{live.length}</div>
            <div className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Total Assets</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <FileText className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{pendingRequests}</div>
            <div className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Pending Requests</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <Wrench className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{openMaintenance}</div>
            <div className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Open Tickets</div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <BarChart3 className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-foreground">{warrantyExpiring.length}</div>
            <div className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Warranty Expiring</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Asset Status Breakdown */}
        <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)]">
          <CardHeader><CardTitle className="text-base font-semibold">Assets by Status</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(byStatus).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
                const pct = Math.round((count / live.length) * 100);
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground capitalize font-medium">{status.replace(/_/g, " ")}</span>
                      <span className="text-sm font-semibold">{count} <span className="text-muted-foreground font-normal text-xs">({pct}%)</span></span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${statusColor[status] ?? "bg-slate-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Assets by Category */}
        <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)]">
          <CardHeader><CardTitle className="text-base font-semibold">Assets by Category</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.values(byCategory).sort((a, b) => b.count - a.count).map(({ name, count }) => {
                const pct = Math.round((count / live.length) * 100);
                return (
                  <div key={name}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground font-medium">{name}</span>
                      <span className="text-sm font-semibold">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-chart-2 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {Object.keys(byCategory).length === 0 && (
                <p className="text-sm text-muted-foreground">No assets categorized.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warranty Expiring Table */}
      <Card className="mb-8 rounded-2xl border-0 shadow-[var(--shadow-card)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Warranty Expiring Soon (30 days)</CardTitle>
        </CardHeader>
        {warrantyExpiring.length === 0 ? (
          <CardContent className="flex flex-col items-center gap-2 py-10">
            <BarChart3 className="h-8 w-8 text-muted-foreground/20" />
            <p className="text-sm font-medium text-muted-foreground">No warranties expiring in the next 30 days</p>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Asset</TableHead>
                <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Warranty End</TableHead>
                <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 text-right">Days Left</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warrantyExpiring.map((a) => {
                const days = Math.ceil((new Date(a.warranty_end_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <TableRow key={a.id} className="transition-colors hover:bg-muted/30">
                    <TableCell className="font-mono text-sm">
                      <Link href={`/assets/${a.id}`} className="font-medium text-primary hover:underline">{a.asset_code}</Link>
                      <span className="ml-2 text-muted-foreground">{a.asset_name}</span>
                    </TableCell>
                    <TableCell>{a.warranty_end_date ? new Date(a.warranty_end_date).toLocaleDateString("id-ID") : "-"}</TableCell>
                    <TableCell className={`text-right font-medium ${days <= 7 ? "text-destructive" : "text-muted-foreground"}`}>{days} days</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      </div>
  );
}

