// Server Component — reads data directly, no "use server" directive needed
import { readTable } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wrench, BarChart3 } from "lucide-react";
import Link from "next/link";

function statusColor(s: string): string {
  const m: Record<string, string> = {
    available: "#059669", assigned: "#3B82F6", in_repair: "#F59E0B",
    retired: "#94A3B8", lost: "#EF4444", disposed: "#6B7280", reserved: "#8B5CF6",
  };
  return m[s] ?? "#94A3B8";
}

function statusLabel(s: string): string {
  const m: Record<string, string> = {
    available: "Available", assigned: "Assigned", in_repair: "In Repair",
    retired: "Retired", lost: "Lost", disposed: "Disposed", reserved: "Reserved",
  };
  return m[s] ?? s.replace(/_/g, " ");
}

async function StatusPieChart() {
  const assets = await readTable("assets");
  const live = assets.filter((a) => !a.deleted_at);
  const counts: Record<string, number> = {};
  for (const a of live) counts[a.status] = (counts[a.status] || 0) + 1;

  const total = live.length || 1;
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  const { segments } = entries.reduce(
    (acc, [status, count]) => {
      const pct = count / total;
      const dash = pct * circumference;
      acc.segments.push({ status, count, dash, offset: acc.offset });
      acc.offset += dash;
      return acc;
    },
    { segments: [] as { status: string; count: number; dash: number; offset: number }[], offset: 0 }
  );

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
          {/* Background circle */}
          <circle cx="90" cy="90" r={radius} fill="none" stroke="currentColor" strokeWidth="20" className="text-muted/20" />
          {segments.map(({ status, dash, offset }) => (
            <circle
              key={status}
              cx="90" cy="90" r={radius}
              fill="none"
              stroke={statusColor(status)}
              strokeWidth="20"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              className="transition-all duration-700"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{total}</span>
          <span className="text-[10px] text-muted-foreground font-medium">Total</span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {entries.map(([status, count]) => (
          <Link
            key={status}
            href={`/assets?status=${status}`}
            className="flex items-center gap-1.5 text-xs rounded-full px-2 py-1 transition-colors hover:bg-muted/60"
          >
            <span className="h-2 w-2 rounded-full" style={{ background: statusColor(status) }} />
            <span className="text-muted-foreground">{statusLabel(status)}</span>
            <span className="font-medium text-foreground">{count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

async function RequestBarChart() {
  const reqs = await readTable("requests");
  const now = new Date();
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleDateString("en-US", { month: "short" }));
  }

  const counts = months.map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    return reqs.filter((r) => {
      const c = new Date(r.created_at);
      return c >= d && c < next;
    }).length;
  });

  const max = Math.max(...counts, 1);
  return (
    <div className="flex flex-col justify-end h-40 pt-4">
      <div className="relative flex items-end gap-2.5 h-32 border-b border-border/50 pb-1">
        {/* Subtle grid line */}
        <div className="absolute inset-x-0 top-0 border-b border-dashed border-border/30" />
        <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-border/20" />

        {months.map((m, i) => {
          const h = Math.max((counts[i] / max) * 100, 8);
          const hasData = counts[i] > 0;
          return (
            <div key={m} className="group relative flex flex-1 flex-col items-center justify-end h-full">
              <span className={`text-[11px] font-bold transition-transform group-hover:scale-110 mb-1 ${hasData ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground/40"}`}>
                {counts[i]}
              </span>
              <div
                className={`w-full rounded-t-xl transition-all duration-500 group-hover:brightness-110 shadow-xs ${
                  hasData
                    ? "bg-gradient-to-t from-blue-600 via-indigo-500 to-sky-400 dark:from-blue-500 dark:via-indigo-400 dark:to-cyan-400"
                    : "bg-muted/40"
                }`}
                style={{ height: `${h}%`, minHeight: 6 }}
              />
              <span className="mt-2 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{m}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

async function MaintenanceStats() {
  const [assets, maintenance] = await Promise.all([
    readTable("assets"), readTable("maintenance_logs"),
  ]);
  const live = assets.filter((a) => !a.deleted_at);
  const openCount = maintenance.filter((m) => m.status !== "closed" && m.status !== "resolved").length;
  const inRepairCount = live.filter((a) => a.status === "in_repair").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
            <Wrench className="h-5 w-5 text-amber-500 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Open Tickets</p>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </div>
        </div>
        <span className="text-2xl font-bold text-amber-500 dark:text-amber-400">{openCount}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20">
            <BarChart3 className="h-5 w-5 text-orange-500 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">In Repair</p>
            <p className="text-xs text-muted-foreground">Currently serviced</p>
          </div>
        </div>
        <span className="text-2xl font-bold text-orange-500 dark:text-orange-400">{inRepairCount}</span>
      </div>
    </div>
  );
}

export default async function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="rounded-2xl border-0 shadow-(--shadow-card)">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Asset Distribution</CardTitle>
          <CardDescription>By current status</CardDescription>
        </CardHeader>
        <CardContent>
          <StatusPieChart />
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-0 shadow-(--shadow-card)">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Request Trends</CardTitle>
          <CardDescription>Monthly request volume</CardDescription>
        </CardHeader>
        <CardContent>
          <RequestBarChart />
        </CardContent>
      </Card>
      <Card className="rounded-2xl border-0 shadow-(--shadow-card)">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Asset Health</CardTitle>
          <CardDescription>Maintenance overview</CardDescription>
        </CardHeader>
        <CardContent>
          <MaintenanceStats />
        </CardContent>
      </Card>
    </div>
  );
}

