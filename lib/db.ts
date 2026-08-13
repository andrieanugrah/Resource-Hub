import { eq, inArray, and, like, isNull, desc } from "drizzle-orm";
import type { SQLiteTable, SQLiteColumn } from "drizzle-orm/sqlite-core";
import { db, schema } from "@/drizzle/db";

export type Role = "super_admin" | "admin_it" | "manager" | "employee" | "auditor" | "procurement";
export type AssetStatus =
  | "available" | "assigned" | "reserved" | "in_repair" | "retired" | "lost" | "disposed";
export type AssetCondition = "new" | "good" | "fair" | "damaged" | "critical";
export type RequestStatus =
  | "draft" | "pending_approval" | "approved" | "rejected"
  | "in_progress" | "completed" | "cancelled";
export type RequestType = "new_asset" | "replacement" | "temporary_loan" | "return" | "repair";
export type Priority = "low" | "medium" | "high" | "urgent";

export type MaintenanceStatus = "open" | "in_progress" | "waiting_vendor" | "resolved" | "closed";
export type MaintenanceSeverity = "low" | "medium" | "high" | "critical";

export interface User {
  id: string; name: string; email: string; password_hash: string; password_salt: string;
  role: Role; department_id: string | null; job_title: string | null; status: "active" | "inactive";
  last_login_at: string | null; created_at: string; updated_at: string;
}

export interface Department {
  id: string; department_code: string; department_name: string; description: string;
  status: "active" | "inactive"; created_at: string; updated_at: string;
}

export interface Location {
  id: string; location_name: string; branch_name: string; building: string;
  floor: string; room: string; notes: string; created_at: string; updated_at: string;
}

export interface Category {
  id: string; category_name: string; description: string;
  specifications: Record<string, string> | null;
  status: "active" | "inactive";
  created_at: string; updated_at: string;
}

export interface License {
  id: string; license_name: string; license_key: string; vendor: string;
  license_type: "subscription" | "perpetual" | "volume" | "oem";
  total_seats: number; purchase_cost: number | null;
  purchase_date: string; expiry_date: string | null;
  description: string; status: "active" | "inactive";
  created_at: string; updated_at: string;
}

export interface LicenseAssignment {
  id: string; license_id: string; assigned_user_id: string | null;
  assigned_asset_id: string | null; seat_number: string;
  allocated_at: string; notes: string;
}

export interface Asset {
  id: string; asset_code: string; asset_name: string; category_id: string; brand: string;
  model: string; serial_number: string; condition: AssetCondition; status: AssetStatus;
  purchase_date: string; purchase_price: number | null;
  useful_life_years: number; salvage_value: number;
  warranty_end_date: string | null;
  warranty_note: string | null; location_id: string; assigned_user_id: string | null;
  assigned_department_id: string | null; cost_center: string | null;
  parent_asset_id?: string | null;
  notes: string; qr_code_value: string; image_url: string | null;
  specifications: Record<string, string> | null;
  created_by: string; updated_by: string; created_at: string; updated_at: string; deleted_at: string | null;
}

export function generateRequestCode(existingRequests: AssetRequest[]): string {
  const currentYear = new Date().getFullYear();
  const prefix = `REQ-${currentYear}-`;
  const yearReqs = existingRequests.filter((r) => r.request_code && r.request_code.startsWith(prefix));
  let maxSeq = 0;
  for (const r of yearReqs) {
    const seqStr = r.request_code.replace(prefix, "");
    const seq = parseInt(seqStr, 10);
    if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
  }
  const nextSeq = String(maxSeq + 1).padStart(4, "0");
  return `${prefix}${nextSeq}`;
}

export function generateMaintenanceCode(existingLogs: MaintenanceLog[]): string {
  const currentYear = new Date().getFullYear();
  const prefix = `MNT-${currentYear}-`;
  const yearLogs = existingLogs.filter((l) => l.maintenance_code && l.maintenance_code.startsWith(prefix));
  let maxSeq = 0;
  for (const l of yearLogs) {
    const seqStr = l.maintenance_code.replace(prefix, "");
    const seq = parseInt(seqStr, 10);
    if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
  }
  const nextSeq = String(maxSeq + 1).padStart(4, "0");
  return `${prefix}${nextSeq}`;
}

export function generateAssetCode(existingAssets: Asset[]): string {
  const currentYear = new Date().getFullYear();
  const prefix = `AST-${currentYear}-`;
  const yearAssets = existingAssets.filter((a) => a.asset_code && a.asset_code.startsWith(prefix));

  let maxSeq = 0;
  for (const a of yearAssets) {
    const seqStr = a.asset_code.replace(prefix, "");
    const seq = parseInt(seqStr, 10);
    if (!isNaN(seq) && seq > maxSeq) {
      maxSeq = seq;
    }
  }

  const nextSeq = String(maxSeq + 1).padStart(4, "0");
  return `${prefix}${nextSeq}`;
}

export interface AuditLog {
  id: string; actor_user_id: string; action_type: string; entity_type: string; entity_id: string;
  before_json: string | null; after_json: string | null;
  ip_address: string; user_agent: string; created_at: string;
}

export interface Session {
  token: string; user_id: string; created_at: string; expires_at: string;
}

export interface PasswordResetToken {
  token: string; user_id: string; expires_at: string; used: boolean; created_at: string;
}

export interface Notification {
  id: string; user_id: string; title: string; message: string;
  type: "request" | "maintenance" | "asset" | "system";
  link: string; read: boolean; created_at: string;
}

export interface AssetTransaction {
  id: string; asset_id: string;
  transaction_type: "assign" | "return" | "create" | "update" | "delete";
  from_user_id: string | null; to_user_id: string | null;
  from_department_id: string | null; to_department_id: string | null;
  from_location_id: string | null; to_location_id: string | null;
  condition_before: AssetCondition | null; condition_after: AssetCondition | null;
  notes: string; created_by: string; created_at: string;
}

export interface AssetRequest {
  id: string; request_code: string; requester_id: string; request_type: RequestType;
  asset_category_id: string | null; asset_id: string | null; title: string; description: string;
  priority: Priority; status: RequestStatus; reason: string; required_date: string | null;
  approved_by: string | null; approved_at: string | null; rejected_reason: string;
  department_asset: boolean;
  created_at: string; updated_at: string;
}

export interface MaintenanceLog {
  id: string; maintenance_code: string; asset_id: string;
  issue_description: string; severity: MaintenanceSeverity;
  vendor_name: string; technician_name: string;
  cost_estimate: number | null; actual_cost: number | null;
  status: MaintenanceStatus; started_at: string | null; completed_at: string | null;
  notes: string; created_by: string; created_at: string; updated_at: string;
}

export interface DB {
  users: User[]; departments: Department[]; locations: Location[]; categories: Category[];
  licenses: License[]; license_assignments: LicenseAssignment[]; assets: Asset[];
  asset_transactions: AssetTransaction[]; requests: AssetRequest[];
  maintenance_logs: MaintenanceLog[]; audit_logs: AuditLog[]; sessions: Session[];
  password_reset_tokens: PasswordResetToken[]; notifications: Notification[];
}

function parseJsonField<T>(val: unknown): T | null {
  if (!val) return null;
  if (typeof val === "object") return val as T;
  if (typeof val === "string") {
    try {
      return JSON.parse(val) as T;
    } catch {
      return null;
    }
  }
  return null;
}

function parseCategories(rows: (typeof schema.categories.$inferSelect)[]): Category[] {
  return rows.map((r) => ({
    ...r,
    status: r.status as "active" | "inactive",
    specifications: parseJsonField<Record<string, string>>(r.specifications),
  })) as Category[];
}

function stringifyCategories(data: Category[]): (typeof schema.categories.$inferInsert)[] {
  return data.map((c) => ({
    ...c,
    specifications: c.specifications ? (typeof c.specifications === "string" ? c.specifications : JSON.stringify(c.specifications)) : null,
  }));
}

function parseAssets(rows: (typeof schema.assets.$inferSelect)[]): Asset[] {
  return rows.map((r) => ({
    ...r,
    condition: r.condition as AssetCondition,
    status: r.status as AssetStatus,
    specifications: parseJsonField<Record<string, string>>(r.specifications),
  })) as Asset[];
}

function stringifyAssets(data: Asset[]): (typeof schema.assets.$inferInsert)[] {
  return data.map((a) => ({
    ...a,
    specifications: a.specifications ? (typeof a.specifications === "string" ? a.specifications : JSON.stringify(a.specifications)) : null,
  }));
}

export async function readTable<K extends keyof DB>(name: K): Promise<DB[K]> {
  let rows: unknown[];

  switch (name) {
    case "users": rows = db.select().from(schema.users).all(); break;
    case "departments": rows = db.select().from(schema.departments).all(); break;
    case "locations": rows = db.select().from(schema.locations).all(); break;
    case "categories": rows = parseCategories(db.select().from(schema.categories).all()); break;
    case "licenses": rows = db.select().from(schema.licenses).all(); break;
    case "license_assignments": rows = db.select().from(schema.license_assignments).all(); break;
    case "assets": rows = parseAssets(db.select().from(schema.assets).all()); break;
    case "asset_transactions": rows = db.select().from(schema.asset_transactions).all(); break;
    case "requests": rows = db.select().from(schema.requests).all(); break;
    case "maintenance_logs": rows = db.select().from(schema.maintenance_logs).all(); break;
    case "audit_logs": rows = db.select().from(schema.audit_logs).all(); break;
    case "sessions": rows = db.select().from(schema.sessions).all(); break;
    case "password_reset_tokens": rows = db.select().from(schema.password_reset_tokens).all(); break;
    case "notifications": rows = db.select().from(schema.notifications).all(); break;
    default: throw new Error(`Unknown table: ${name}`);
  }

  return rows as DB[K];
}

function hasRowChanged(oldRow: Record<string, unknown>, newRow: Record<string, unknown>): boolean {
  for (const key of Object.keys(newRow)) {
    const oldVal = oldRow[key];
    const newVal = newRow[key];

    if (oldVal === newVal) continue;
    if ((oldVal === null || oldVal === undefined) && (newVal === null || newVal === undefined)) {
      continue;
    }
    if (typeof oldVal === "object" && typeof newVal === "object" && oldVal !== null && newVal !== null) {
      if (JSON.stringify(oldVal) === JSON.stringify(newVal)) continue;
    }
    return true;
  }
  return false;
}

/**
 * Sync a table's rows to match `rows` exactly, without ever deleting the
 * whole table first.
 *
 * Instead of `DELETE * ; INSERT *` (which briefly empties the table and
 * rewrites every row on every save), this diffs against what's already on
 * disk by primary key and only touches what actually changed:
 *  - rows present in `rows` but not in the DB -> INSERT (batched)
 *  - rows present in both & data changed     -> UPDATE by PK
 *  - rows present in the DB but not in `rows` -> DELETE by PK (batched)
 *
 * Must be called from inside a `db.transaction()` so the whole sync is
 * atomic (all-or-nothing) per table.
 */
function syncTable(
  table: SQLiteTable,
  pkColumn: SQLiteColumn,
  pkField: string,
  rows: Record<string, unknown>[],
): void {
  const existingRows = db.select().from(table).all() as Record<string, unknown>[];
  const existingMap = new Map<string, Record<string, unknown>>(
    existingRows.map((r) => [String(r[pkField]), r])
  );
  const incomingPks = new Set(rows.map((r) => String(r[pkField])));

  const toDelete = [...existingMap.keys()].filter((pk) => !incomingPks.has(pk));
  if (toDelete.length > 0) {
    for (let i = 0; i < toDelete.length; i += 100) {
      db.delete(table).where(inArray(pkColumn, toDelete.slice(i, i + 100))).run();
    }
  }

  const toInsert = rows.filter((r) => !existingMap.has(String(r[pkField])));
  if (toInsert.length > 0) {
    for (let i = 0; i < toInsert.length; i += 50) {
      db.insert(table).values(toInsert.slice(i, i + 50) as never[]).run();
    }
  }

  const toUpdate = rows.filter((r) => existingMap.has(String(r[pkField])));
  for (const row of toUpdate) {
    const pk = String(row[pkField]);
    const oldRow = existingMap.get(pk);
    if (oldRow && hasRowChanged(oldRow, row)) {
      db.update(table).set(row as never).where(eq(pkColumn, row[pkField])).run();
    }
  }
}

export async function writeTable<K extends keyof DB>(name: K, data: DB[K]): Promise<void> {
  const rows = data as unknown as Record<string, unknown>[];

  db.transaction(() => {
    switch (name) {
      case "users":
        syncTable(schema.users, schema.users.id, "id", rows);
        break;
      case "departments":
        syncTable(schema.departments, schema.departments.id, "id", rows);
        break;
      case "locations":
        syncTable(schema.locations, schema.locations.id, "id", rows);
        break;
      case "categories": {
        const insertable = stringifyCategories(data as Category[]) as unknown as Record<string, unknown>[];
        syncTable(schema.categories, schema.categories.id, "id", insertable);
        break;
      }
      case "licenses":
        syncTable(schema.licenses, schema.licenses.id, "id", rows);
        break;
      case "license_assignments":
        syncTable(schema.license_assignments, schema.license_assignments.id, "id", rows);
        break;
      case "assets": {
        const insertable = stringifyAssets(data as Asset[]) as unknown as Record<string, unknown>[];
        syncTable(schema.assets, schema.assets.id, "id", insertable);
        break;
      }
      case "asset_transactions":
        syncTable(schema.asset_transactions, schema.asset_transactions.id, "id", rows);
        break;
      case "requests":
        syncTable(schema.requests, schema.requests.id, "id", rows);
        break;
      case "maintenance_logs":
        syncTable(schema.maintenance_logs, schema.maintenance_logs.id, "id", rows);
        break;
      case "audit_logs":
        syncTable(schema.audit_logs, schema.audit_logs.id, "id", rows);
        break;
      case "sessions":
        syncTable(schema.sessions, schema.sessions.token, "token", rows);
        break;
      case "password_reset_tokens":
        syncTable(schema.password_reset_tokens, schema.password_reset_tokens.token, "token", rows);
        break;
      case "notifications":
        syncTable(schema.notifications, schema.notifications.id, "id", rows);
        break;
      default: throw new Error(`Unknown table: ${name}`);
    }
  });
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function nowIso(): string { return new Date().toISOString(); }

export async function countAssetsByLink(field: keyof Asset, value: string): Promise<number> {
  const assets = await readTable("assets");
  return assets.filter((a) => !a.deleted_at && a[field] === value).length;
}

/**
 * Straight-line depreciation: annual depreciation = (price - salvage) / useful_life
 * Returns current book value at the given date (defaults to now).
 */
export function computeDepreciation(asset: Asset, asOf: Date = new Date()): {
  purchase_price: number | null;
  useful_life_years: number;
  salvage_value: number;
  annual_depreciation: number | null;
  accumulated: number | null;
  current_value: number | null;
  percent_depreciated: number | null;
} {
  const result = {
    purchase_price: asset.purchase_price,
    useful_life_years: asset.useful_life_years,
    salvage_value: asset.salvage_value,
    annual_depreciation: null as number | null,
    accumulated: null as number | null,
    current_value: null as number | null,
    percent_depreciated: null as number | null,
  };

  if (!asset.purchase_price || !asset.purchase_date || asset.useful_life_years <= 0) {
    return result;
  }

  const purchaseDate = new Date(asset.purchase_date);
  if (isNaN(purchaseDate.getTime()) || purchaseDate > asOf) {
    return result;
  }

  const ageMs = asOf.getTime() - purchaseDate.getTime();
  const ageYears = ageMs / (365.25 * 24 * 60 * 60 * 1000);
  const annual = (asset.purchase_price - asset.salvage_value) / asset.useful_life_years;
  const accumulated = Math.min(annual * ageYears, asset.purchase_price - asset.salvage_value);
  const current = Math.max(asset.purchase_price - accumulated, asset.salvage_value);

  result.annual_depreciation = Math.round(annual * 100) / 100;
  result.accumulated = Math.round(accumulated * 100) / 100;
  result.current_value = Math.round(current * 100) / 100;
  result.percent_depreciated = asset.purchase_price > 0
    ? Math.round((accumulated / (asset.purchase_price - asset.salvage_value)) * 100)
    : null;

  return result;
}

export async function getPaginatedAssets(params: {
  page?: number;
  limit?: number;
  status?: string;
  categoryId?: string;
  search?: string;
}): Promise<{ data: Asset[]; total: number; page: number; totalPages: number }> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, Math.min(100, params.limit ?? 20));
  const offset = (page - 1) * limit;

  const conditions = [isNull(schema.assets.deleted_at)];
  if (params.status) conditions.push(eq(schema.assets.status, params.status));
  if (params.categoryId) conditions.push(eq(schema.assets.category_id, params.categoryId));
  if (params.search) conditions.push(like(schema.assets.asset_name, `%${params.search}%`));

  const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

  const rawRows = db
    .select()
    .from(schema.assets)
    .where(whereClause)
    .orderBy(desc(schema.assets.created_at))
    .limit(limit)
    .offset(offset)
    .all();

  const totalCountRows = db
    .select()
    .from(schema.assets)
    .where(whereClause)
    .all();

  const data = parseAssets(rawRows);
  const total = totalCountRows.length;
  const totalPages = Math.ceil(total / limit) || 1;

  return { data, total, page, totalPages };
}

