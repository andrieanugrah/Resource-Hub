import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { readTable } from "@/lib/db";
import DashboardCharts from "@/components/dashboard-charts";
import { AnimatedKpiCards } from "@/components/animated-kpi-cards";
import { AnimatedDepartmentBars } from "@/components/animated-department-bars";
import { checkWarrantyExpirationNotifications, checkExpiredReservations } from "@/lib/notifications";
import Link from "next/link";
import { Package, CheckCircle2, UserCheck, Wrench, ClipboardList, ShieldAlert, TrendingUp, Building2 } from "lucide-react";

const cardConfigs = [
  { label: "Total Assets", iconKey: "package", accent: "from-primary/20 to-primary/5", dot: "bg-primary", link: "/assets" },
  { label: "Available", iconKey: "check", accent: "from-emerald-500/20 to-emerald-500/5", dot: "bg-emerald-500", link: "/assets?status=available" },
  { label: "Assigned", iconKey: "user-check", accent: "from-blue-500/20 to-blue-500/5", dot: "bg-blue-500", link: "/assets?status=assigned" },
  { label: "In Repair", iconKey: "wrench", accent: "from-amber-500/20 to-amber-500/5", dot: "bg-amber-500", link: "/assets?status=in_repair" },
  { label: "Pending", iconKey: "clipboard", accent: "from-orange-500/20 to-orange-500/5", dot: "bg-orange-500", link: "/requests" },
  { label: "Expiring", iconKey: "shield", accent: "from-red-500/20 to-red-500/5", dot: "bg-red-500", link: "/assets?warranty=expiring" },
];

export default async function DashboardPage() {
  const user = await requireUser();
  void checkWarrantyExpirationNotifications();
  void checkExpiredReservations();
  const [assets, requests, users, departments, txs] = await Promise.all([
    readTable("assets"), readTable("requests"), readTable("users"),
    readTable("departments"), readTable("asset_transactions"),
  ]);

  const live = assets.filter((a) => !a.deleted_at);
  const byStatus = (s: string) => live.filter((a) => a.status === s).length;
  const pendingRequests = requests.filter((r) => r.status === "pending_approval").length;
  const warrantyExpiring = live.filter((a) => {
    if (!a.warranty_end_date) return false;
    const d = new Date(a.warranty_end_date);
    const thirty = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return d <= thirty && d >= new Date();
  }).length;

  const cards = cardConfigs.map((cfg) => ({
    ...cfg,
    value: cfg.label === "Total Assets" ? live.length :
           cfg.label === "Available" ? byStatus("available") :
           cfg.label === "Assigned" ? byStatus("assigned") :
           cfg.label === "In Repair" ? byStatus("in_repair") :
           cfg.label === "Pending" ? pendingRequests : warrantyExpiring,
  }));

  // Pre-build lookup maps — single pass, not per-row find
  const assetMap = new Map(live.map((a) => [a.id, a]));
  const userMap = new Map(users.map((u) => [u.id, u.name]));
  const userDeptMap = new Map(users.filter((u) => u.department_id).map((u) => [u.id, u.department_id!]));
  const recent = [...txs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8);

  const deptAssetCounts = departments
    .map((d) => ({
      name: d.department_name,
      count: live.filter((a) =>
        a.assigned_department_id === d.id ||
        (a.assigned_user_id ? userDeptMap.get(a.assigned_user_id) === d.id : false)
      ).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const deptMax = Math.max(...deptAssetCounts.map((d) => d.count), 1);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Dashboard" description={`Welcome back, ${user.name.split(" ")[0]}`} />

      {/* KPI Cards — Animated Grid */}
      <AnimatedKpiCards cards={cards} />

      {/* Charts Row */}
      <DashboardCharts />

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 rounded-2xl border-0 shadow-(--shadow-card) overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                <CardDescription>Latest asset transactions</CardDescription>
              </div>
              <TrendingUp className="h-4 w-4 text-muted-foreground/40" />
            </div>
          </CardHeader>
          {recent.length === 0 ? (
            <CardContent className="flex flex-col items-center gap-2 py-10">
              <Package className="h-8 w-8 text-muted-foreground/20" />
              <p className="text-sm font-medium text-muted-foreground">No activity recorded yet</p>
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 w-35">Asset</TableHead>
                  <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Action</TableHead>
                  <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">By</TableHead>
                  <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 text-right w-25">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((tx) => {
                  const a = assetMap.get(tx.asset_id);
                  return (
                    <TableRow key={tx.id} className="transition-colors hover:bg-muted/30">
                      <TableCell className="font-mono text-sm">
                        {a ? <Link href={`/assets/${a.id}`} className="font-medium text-primary hover:underline">{a.asset_code}</Link> : <span className="text-muted-foreground/60">-</span>}
                      </TableCell>
                      <TableCell><Badge value={tx.transaction_type} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{userMap.get(tx.created_by) ?? "Unknown"}</TableCell>
                      <TableCell className="text-muted-foreground/60 text-right text-xs">{new Date(tx.created_at).toLocaleDateString("id-ID")}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="rounded-2xl border-0 shadow-(--shadow-card)">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Top Departments</CardTitle>
                <CardDescription>Assets by department</CardDescription>
              </div>
              <Building2 className="h-4 w-4 text-muted-foreground/40" />
            </div>
          </CardHeader>
          <CardContent>
            {deptAssetCounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Building2 className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">No departments yet</p>
              </div>
            ) : (
              <AnimatedDepartmentBars departments={deptAssetCounts} maxCount={deptMax} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
