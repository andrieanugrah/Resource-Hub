import { requireUser } from "@/lib/auth";
import { readTable } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wrench, Search } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { can } from "@/lib/permissions";

interface Props {
  searchParams: Promise<{ status?: string; search?: string; severity?: string }>;
}

export default async function MaintenancePage({ searchParams }: Props) {
  const user = await requireUser();
  const sp = await searchParams;
  const [logs, assets, _users] = await Promise.all([
    readTable("maintenance_logs"),
    readTable("assets"),
    readTable("users"),
  ]);

  const assetName = (id: string) => assets.find((a) => a.id === id)?.asset_name ?? "-";
  const assetCode = (id: string) => assets.find((a) => a.id === id)?.asset_code ?? "-";
  const showCreate = can(user.role, "maintenance.create");

  let sorted = [...logs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (sp.status) sorted = sorted.filter((l) => l.status === sp.status);
  if (sp.severity) sorted = sorted.filter((l) => l.severity === sp.severity);
  if (sp.search) {
    const q = sp.search.toLowerCase();
    sorted = sorted.filter((l) =>
      l.maintenance_code.toLowerCase().includes(q) ||
      l.issue_description.toLowerCase().includes(q) ||
      assetName(l.asset_id).toLowerCase().includes(q) ||
      assetCode(l.asset_id).toLowerCase().includes(q)
    );
  }

  const statusOptions = ["open", "in_progress", "waiting_vendor", "resolved", "closed"];
  const severityOptions = ["low", "medium", "high", "critical"];
  const openCount = logs.filter((l) => l.status !== "closed" && l.status !== "resolved").length;

  return (
    <div>
      <PageHeader
        title="Maintenance"
        description={`${openCount} open ticket${openCount !== 1 ? "s" : ""}`}
        action={showCreate ? { href: "/maintenance/new", label: "+ New Ticket" } : undefined}
      />

      <Card className="mb-6 rounded-2xl border-0 shadow-[var(--shadow-card)]">
        <div className="px-5 py-4">
          <form method="get" className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="search"
                defaultValue={sp.search ?? ""}
                placeholder="Search by code, issue, asset..."
                className="pl-10"
              />
            </div>
            <select name="status" defaultValue={sp.status ?? ""} className="h-10 rounded-xl border bg-card px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">All Status</option>
              {statusOptions.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
            <select name="severity" defaultValue={sp.severity ?? ""} className="h-10 rounded-xl border bg-card px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">All Severity</option>
              {severityOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button type="submit">Filter</Button>
            {(sp.status || sp.search || sp.severity) && (
              <Link href="/maintenance" className="inline-flex items-center justify-center rounded-xl border bg-secondary text-secondary-foreground px-4 py-2.5 text-sm font-medium hover:bg-secondary/80 transition-colors">
                Clear
              </Link>
            )}
          </form>
        </div>
      </Card>

      <Card className="overflow-hidden rounded-2xl border-0 shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Code</TableHead>
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Asset</TableHead>
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Issue</TableHead>
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Severity</TableHead>
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Status</TableHead>
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Cost</TableHead>
              <TableHead scope="col" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Wrench className="h-8 w-8 text-muted-foreground/20" />
                    <p className="text-sm font-medium text-muted-foreground">No maintenance records found</p>
                    <p className="text-xs text-muted-foreground/60">{(sp.status || sp.search || sp.severity) ? "Try adjusting your filters" : "Create your first maintenance ticket"}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : sorted.map((l) => (
              <TableRow key={l.id} className="transition-colors hover:bg-muted/30">
                <TableCell className="font-mono text-sm">
                  <Link href={`/maintenance/${l.id}`} className="font-medium text-primary hover:underline">{l.maintenance_code}</Link>
                </TableCell>
                <TableCell className="font-medium">{assetName(l.asset_id)}</TableCell>
                <TableCell className="text-muted-foreground max-w-[250px] truncate">{l.issue_description}</TableCell>
                <TableCell><Badge value={l.severity} /></TableCell>
                <TableCell><Badge value={l.status} /></TableCell>
                <TableCell className="text-muted-foreground">{l.actual_cost ? formatCurrency(l.actual_cost) : l.cost_estimate ? formatCurrency(l.cost_estimate) : "-"}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{new Date(l.created_at).toLocaleDateString("id-ID")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="border-t px-5 py-3 text-xs text-muted-foreground flex items-center gap-2">
          <Wrench className="h-3.5 w-3.5" />
          {sorted.length} ticket{sorted.length !== 1 ? "s" : ""}
        </div>
      </Card>
    </div>
  );
}

