import { requireUser } from "@/lib/auth";
import { SidebarContent } from "@/components/sidebar-content";
import { DashboardShell } from "./dashboard-shell";
import { Topbar } from "@/components/topbar";
import { ToastProvider } from "@/components/ui/toast";
import { ErrorShell } from "@/components/error-shell";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotificationsBell from "@/components/notifications";
import { DashboardProviders } from "@/components/dashboard-providers";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <ErrorShell>
      <TooltipProvider>
      <ToastProvider>
        <DashboardProviders>
        <DashboardShell
          sidebar={<SidebarContent user={user} />}
          topbar={
            <Topbar
              user={user}
              sidebar={<SidebarContent user={user} mobile />}
              notifications={<NotificationsBell />}
            />
          }
        >
          {children}
        </DashboardShell>
        </DashboardProviders>
      </ToastProvider>
      </TooltipProvider>
    </ErrorShell>
  );
}

