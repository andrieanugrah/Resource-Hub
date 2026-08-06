import type { Role } from "./db";

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin", admin_it: "IT Admin", manager: "Manager", employee: "Employee",
};

export function can(role: Role, action: string): boolean {
  const matrix: Record<string, Role[]> = {
    "asset.create": ["super_admin", "admin_it"],
    "asset.edit": ["super_admin", "admin_it"],
    "asset.delete": ["super_admin", "admin_it"],
    "asset.assign": ["super_admin", "admin_it"],
    "asset.view": ["super_admin", "admin_it", "manager"],
    "asset.view_own": ["super_admin", "admin_it", "manager", "employee"],
    "asset.return": ["super_admin", "admin_it"],
    "request.submit": ["super_admin", "admin_it", "manager", "employee"],
    "request.approve": ["super_admin", "manager"],
    "report.view_all": ["super_admin", "admin_it"],
    "user.manage": ["super_admin"],
    "master.manage": ["super_admin", "admin_it"],
    "maintenance.create": ["super_admin", "admin_it"],
    "maintenance.view": ["super_admin", "admin_it", "manager"],
    "maintenance.edit": ["super_admin", "admin_it"],
    "maintenance.close": ["super_admin", "admin_it"],
    "audit.view": ["super_admin"],
  };
  return matrix[action]?.includes(role) ?? false;
}
