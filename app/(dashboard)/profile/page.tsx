import { requireUser } from "@/lib/auth";
import { readTable } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/badge";
import { AnimatedCounter } from "@/components/animated-counter";
import { formatDate, formatDateTime } from "@/lib/format";
import { Building2, Shield, Clock, Package, FileText } from "lucide-react";

export default async function ProfilePage() {
  const user = await requireUser();
  const [departments, assets, requests, auditLogs] = await Promise.all([
    readTable("departments"),
    readTable("assets"),
    readTable("requests"),
    readTable("audit_logs"),
  ]);

  const dept = departments.find((d) => d.id === user.department_id);
  const myAssets = assets.filter((a) => a.assigned_user_id === user.id && !a.deleted_at);
  const myRequests = requests.filter((r) => r.requester_id === user.id);
  const myActivity = auditLogs.filter((a) => a.actor_user_id === user.id).slice(0, 10);

  const roleLabels: Record<string, string> = {
    super_admin: "Super Admin",
    admin_it: "IT Admin",
    manager: "Manager",
    employee: "Employee",
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1 rounded-2xl border-0 shadow-[var(--shadow-card)]">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-2xl font-bold text-primary ring-2 ring-primary/20">
                {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-3">
                <Badge value={user.role} />
              </div>
            </div>

            <div className="mt-6 space-y-3 border-t pt-5">
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Department:</span>
                <span className="font-medium">{dept?.department_name ?? "—"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Role:</span>
                <span className="font-medium">{roleLabels[user.role] ?? user.role}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Last Login:</span>
                <span className="font-medium">{user.last_login_at ? formatDateTime(user.last_login_at) : "—"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Joined:</span>
                <span className="font-medium">{formatDate(user.created_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)]">
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <AnimatedCounter value={myAssets.length} className="text-2xl font-bold text-foreground" />
                </div>
                <p className="mt-2 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Assigned Assets</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)]">
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <AnimatedCounter value={myRequests.length} className="text-2xl font-bold text-foreground" />
                </div>
                <p className="mt-2 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Total Requests</p>
              </CardContent>
            </Card>
          </div>

          {/* Assigned Assets */}
          <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                My Assigned Assets
              </CardTitle>
            </CardHeader>
            {myAssets.length === 0 ? (
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package className="mb-2 h-8 w-8 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">No assets assigned to you</p>
                </div>
              </CardContent>
            ) : (
              <div className="divide-y">
                {myAssets.slice(0, 5).map((a) => (
                  <a key={a.id} href={`/assets/${a.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="font-mono text-sm font-medium text-primary">{a.asset_code}</p>
                      <p className="text-xs text-muted-foreground">{a.asset_name}</p>
                    </div>
                    <Badge value={a.status} />
                  </a>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Activity */}
          <Card className="rounded-2xl border-0 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            {myActivity.length === 0 ? (
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock className="mb-2 h-8 w-8 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">No activity yet</p>
                </div>
              </CardContent>
            ) : (
              <div className="divide-y">
                {myActivity.map((log) => (
                  <div key={log.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <Badge value={log.action_type} />
                      <span className="text-sm text-muted-foreground capitalize">{log.entity_type}</span>
                    </div>
                    <span className="text-xs text-muted-foreground/60">{formatDateTime(log.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

