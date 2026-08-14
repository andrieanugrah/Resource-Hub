"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo, LogoIcon } from "@/components/logo";
import { apiClient } from "@/app/api-client";
import {
  LayoutDashboard, Package, Tags, MapPin, Key,
  FileText, CheckCircle, Wrench, Users,
  Building2, BarChart3, ScrollText, LifeBuoy,
  LogOut, Plus, PanelLeft, ScanLine,
} from "lucide-react";
import type { User } from "@/lib/db";
import { can } from "@/lib/permissions";
import { useSidebar } from "@/components/sidebar-context";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  perm?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Inventory",
    items: [
      { href: "/assets", label: "Assets", icon: Package },
      { href: "/assets/new", label: "New Asset", icon: Plus, perm: "asset.create" },
      { href: "/scan", label: "Scan QR", icon: ScanLine },
      { href: "/categories", label: "Categories", icon: Tags, perm: "master.manage" },
      { href: "/locations", label: "Locations", icon: MapPin, perm: "master.manage" },
      { href: "/licenses", label: "Software Licenses", icon: Key },
    ],
  },
  {
    title: "Workflows",
    items: [
      { href: "/requests", label: "Requests", icon: FileText },
      { href: "/approvals", label: "Approvals", icon: CheckCircle, perm: "request.approve" },
      { href: "/maintenance", label: "Maintenance", icon: Wrench, perm: "maintenance.view" },
    ],
  },
  {
    title: "Management",
    items: [
      { href: "/users", label: "User Management", icon: Users, perm: "user.manage" },
      { href: "/departments", label: "Departments", icon: Building2, perm: "master.manage" },
    ],
  },
  {
    title: "Insights",
    items: [
      { href: "/reports", label: "Reports", icon: BarChart3, perm: "report.view_all" },
      { href: "/audit-logs", label: "Audit Trail", icon: ScrollText, perm: "audit.view" },
    ],
  },
  {
    title: "Help",
    items: [
      { href: "/support", label: "Support", icon: LifeBuoy },
    ],
  },
];

export function SidebarContent({ user, mobile = false }: { user: User; mobile?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const { state, toggle } = useSidebar();
  // Mobile sheet forces expanded layout; collapse control hidden in sheet.
  const expanded = mobile ? true : state === "expanded";

  async function handleLogout() {
    setLoggingOut(true);
    try { await apiClient("/api/auth/logout", { method: "POST" }); } catch {}
    router.push("/login");
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/assets/new") return pathname === "/assets/new";
    return pathname.startsWith(href);
  };

  const sections = useMemo(() => {
    const check = (items: NavItem[]) =>
      items.filter((item) => !item.perm || can(user.role, item.perm));
    return navSections
      .map((s) => ({ ...s, items: check(s.items) }))
      .filter((s) => s.items.length > 0);
  }, [user.role]);

  const bg = "linear-gradient(180deg, var(--sidebar) 0%, oklch(0.09 0.02 260) 100%)";

  return (
    <aside className="flex w-full flex-col text-[var(--sidebar-foreground)]" style={{ background: bg, height: "100vh" }} aria-label="Sidebar">
      {/* Header */}
      <div className={`flex items-center h-14 border-b border-[var(--sidebar-border)] shrink-0 ${mobile ? "px-4 justify-start" : expanded ? "px-4 justify-between" : "px-1 justify-between"}`}>
        {expanded ? (
          <Link href="/dashboard" className="flex items-center py-1">
            <Logo size={28} theme="dark" showSubtitle={false} />
          </Link>
        ) : (
          <Link href="/dashboard" className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/5 transition-colors" title="ResourceHub Dashboard" aria-label="Dashboard">
            <LogoIcon size={26} theme="dark" />
          </Link>
        )}
        {!mobile && (
          <span
            role="button"
            tabIndex={0}
            onClick={toggle}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggle(); }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/30 hover:bg-white/10 hover:text-white/60 transition-colors cursor-pointer"
            title={expanded ? "Collapse sidebar" : "Expand sidebar"}
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            <PanelLeft className="h-4 w-4" />
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto py-3 ${expanded ? "px-2.5 space-y-0.5" : "px-2 space-y-1"}`} aria-label="Main navigation">
        {sections.map((section, si) => {
          const isLast = si === sections.length - 1;
          return (
            <div key={section.title} role="group" aria-label={section.title}>
              {expanded && (
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/20 px-3 pt-3 pb-1.5 first:pt-0">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const active = isActive(item.href);
                if (!expanded) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      className={`relative flex items-center justify-center h-10 rounded-lg transition-colors ${
                        active ? "text-white" : "text-white/50 hover:bg-[var(--sidebar-accent)] hover:text-white/80"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-[var(--accent)]" />
                      )}
                      <item.icon className={`h-5 w-5 shrink-0 ${active ? "text-[var(--accent)]" : "text-white/30"}`} />
                    </Link>
                  );
                }
                const Icon = item.icon;
                const base = "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors";
                const activeClass = active ? "bg-sky-500/20 text-white" : "text-white/50 hover:bg-[var(--sidebar-accent)] hover:text-white/80";
                const iconClass = active ? "text-[var(--accent)]" : "text-white/30";
                return (
                  <Link key={item.href} href={item.href} className={`${base} ${activeClass}`}>
                    <Icon className={`h-4 w-4 shrink-0 ${iconClass}`} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
              {!expanded && !isLast && (
                <div className="border-t border-white/[0.08] mx-3 my-2" role="separator" />
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--sidebar-border)] shrink-0 p-3 space-y-2">
        {expanded ? (
          <>
            <div className="flex items-center justify-between px-2 text-[11px] text-white/30">
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-400/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                v1.0.0
              </span>
              <span>Enterprise</span>
            </div>
            <Link
              href="/support"
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-white/50 hover:bg-[var(--sidebar-accent)] hover:text-white/90 transition-colors"
            >
              <LifeBuoy className="h-4 w-4 shrink-0 text-white/40" />
              <span>Help & Support</span>
            </Link>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="System Operational (v1.0.0)" />
            <Link
              href="/support"
              title="Help & Support"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:bg-[var(--sidebar-accent)] hover:text-white/80 transition-colors"
              aria-label="Help & Support"
            >
              <LifeBuoy className="h-4 w-4 shrink-0" />
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
