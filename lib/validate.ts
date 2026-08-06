import { z } from "zod";

const nonEmpty = (name: string) => z.string().min(1, `${name} required`);

export const assetCreate = z.object({
  asset_code: z.string().optional(),
  asset_name: nonEmpty("Asset name"),
  category_id: nonEmpty("Category"),
  brand: z.string().optional(),
  model: z.string().optional(),
  serial_number: nonEmpty("Serial number"),
  condition: z.enum(["new", "good", "fair", "damaged", "critical"]).optional(),
  purchase_date: z.string().optional(),
  purchase_price: z.number().positive().optional().nullable(),
  useful_life_years: z.coerce.number().int().min(1).max(50).optional(),
  salvage_value: z.coerce.number().min(0).optional(),
  warranty_end_date: z.string().optional().nullable(),
  warranty_note: z.string().optional().nullable(),
  location_id: nonEmpty("Location"),
  notes: z.string().optional(),
  parent_asset_id: z.string().optional().nullable(),
  specifications: z.record(z.string(), z.string()).optional().nullable(),
  cost_center: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
});

export const assetUpdate = assetCreate.partial();

export const requestCreate = z.object({
  title: nonEmpty("Title"),
  request_type: z.enum(["new_asset", "replacement", "temporary_loan", "return", "repair"]),
  description: nonEmpty("Description"),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional().default("medium"),
  asset_category_id: z.string().optional().nullable(),
  asset_id: z.string().optional().nullable(),
  department_asset: z.boolean().optional().default(false),
  reason: z.string().optional(),
  required_date: z.string().optional().nullable(),
});

export const loginPayload = z.object({
  email: z.string().email("Invalid email"),
  password: nonEmpty("Password"),
});

export const categoryCreate = z.object({
  category_name: nonEmpty("Category name"),
  description: z.string().optional(),
});

export const locationCreate = z.object({
  location_name: nonEmpty("Location name"),
  branch_name: z.string().optional(),
  building: z.string().optional(),
  floor: z.string().optional(),
  room: z.string().optional(),
  notes: z.string().optional(),
});

export const departmentCreate = z.object({
  department_code: nonEmpty("Department code"),
  department_name: nonEmpty("Department name"),
  description: z.string().optional(),
});

export const licenseCreate = z.object({
  license_name: nonEmpty("License name"),
  license_key: z.string().optional(),
  vendor: z.string().optional(),
  license_type: z.enum(["subscription", "perpetual", "volume", "oem"]).optional(),
  total_seats: z.coerce.number().int().min(0).optional(),
  purchase_cost: z.coerce.number().min(0).optional().nullable(),
  purchase_date: z.string().optional(),
  expiry_date: z.string().optional().nullable(),
  description: z.string().optional(),
});

export const licenseUpdate = licenseCreate.partial().extend({
  status: z.enum(["active", "inactive"]).optional(),
});

export const licenseAssignmentCreate = z.object({
  license_id: nonEmpty("License"),
  assigned_user_id: z.string().optional().nullable(),
  assigned_asset_id: z.string().optional().nullable(),
  seat_number: z.string().optional(),
  notes: z.string().optional(),
});

export const userCreate = z.object({
  name: nonEmpty("Name"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["super_admin", "admin_it", "manager", "employee"]),
  department_id: z.string().optional().nullable(),
  job_title: z.string().optional().nullable(),
});

export const userUpdate = z.object({
  name: z.string().min(1, "Name required").optional(),
  email: z.string().email("Invalid email").optional(),
  role: z.enum(["super_admin", "admin_it", "manager", "employee"]).optional(),
  department_id: z.string().optional().nullable(),
  job_title: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const adminResetPassword = z.object({
  new_password: z.string().min(6, "Password must be at least 6 characters"),
});

export const maintenanceCreate = z.object({
  asset_id: nonEmpty("Asset"),
  issue_description: nonEmpty("Issue description"),
  severity: z.enum(["low", "medium", "high", "critical"]).optional().default("medium"),
  vendor_name: z.string().optional(),
  technician_name: z.string().optional(),
  cost_estimate: z.coerce.number().min(0).optional().nullable(),
  started_at: z.string().optional(),
  notes: z.string().optional(),
});

export const maintenanceUpdate = z.object({
  status: z.enum(["open", "in_progress", "waiting_vendor", "resolved", "closed"]).optional(),
  issue_description: z.string().optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  vendor_name: z.string().optional(),
  technician_name: z.string().optional(),
  cost_estimate: z.coerce.number().min(0).optional().nullable(),
  actual_cost: z.coerce.number().min(0).optional().nullable(),
  started_at: z.string().optional().nullable(),
  notes: z.string().optional(),
});

export function validate<T>(schema: z.ZodType<T>, data: unknown): { ok: true; data: T } | { ok: false; error: string } {
  const r = schema.safeParse(data);
  if (r.success) return { ok: true, data: r.data };
  const msg = r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
  return { ok: false, error: msg };
}
