"use client";

import { useRouter } from "next/navigation";
import { useState, memo } from "react";
import { apiClient } from "@/app/api-client";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MobileSidebar } from "@/components/sidebar-sheet";
import { LogOut, Settings, UserCircle, ChevronDown } from "lucide-react";
import { motion } from "motion/react";

export const Topbar = memo(function Topbar({ user, sidebar, notifications }: {
  user: { name: string; email: string; role: string };
  sidebar: React.ReactNode;
  notifications?: React.ReactNode;
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const roleLabels: Record<string, string> = { super_admin: "Super Admin", admin_it: "IT Admin", manager: "Manager", employee: "Employee" };
  const roleLabel = roleLabels[user.role] ?? user.role;

  async function handleLogout() {
    setLoggingOut(true);
    try { await apiClient("/api/auth/logout", { method: "POST" }); } catch {}
    router.push("/login");
  }

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center justify-between border-b bg-card/80 backdrop-blur-sm px-3 md:px-6 lg:px-8 py-2.5 sticky top-0 z-30 shrink-0"
    >
      <div className="flex items-center gap-2">
        <MobileSidebar>{sidebar}</MobileSidebar>
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 hidden sm:inline">IT Asset Management</span>
      </div>

      <div className="flex items-center gap-1.5 md:gap-3">
          {notifications}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 pl-2.5 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-[11px] font-bold bg-gradient-to-br from-primary/20 to-primary/10 text-primary ring-1 ring-primary/20">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-foreground leading-tight">{user.name}</p>
                <p className="text-[10px] text-muted-foreground">{roleLabel}</p>
              </div>
              <ChevronDown className="hidden md:block h-3.5 w-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-1.5 py-1">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{roleLabel}
              </span>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer"><UserCircle className="h-4 w-4 text-muted-foreground" /> My Profile</DropdownMenuItem>
            {user.role === "super_admin" && (
              <DropdownMenuItem onClick={() => router.push("/users")} className="cursor-pointer"><Settings className="h-4 w-4 text-muted-foreground" /> User Management</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} disabled={loggingOut} variant="destructive" className="cursor-pointer"><LogOut className="h-4 w-4" /> {loggingOut ? "Signing out..." : "Sign Out"}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
    </motion.header>
  );
});

