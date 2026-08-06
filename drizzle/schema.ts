import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  password_salt: text("password_salt").notNull(),
  role: text("role").notNull(),
  department_id: text("department_id"),
  job_title: text("job_title"),
  status: text("status").notNull().default("active"),
  last_login_at: text("last_login_at"),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
}, (table) => [
  index("users_role_idx").on(table.role),
  index("users_dept_idx").on(table.department_id),
]);

export const departments = sqliteTable("departments", {
  id: text("id").primaryKey(),
  department_code: text("department_code").notNull(),
  department_name: text("department_name").notNull(),
  description: text("description").notNull().default(""),
  status: text("status").notNull().default("active"),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
});

export const locations = sqliteTable("locations", {
  id: text("id").primaryKey(),
  location_name: text("location_name").notNull(),
  branch_name: text("branch_name").notNull().default(""),
  building: text("building").notNull().default(""),
  floor: text("floor").notNull().default(""),
  room: text("room").notNull().default(""),
  notes: text("notes").notNull().default(""),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  category_name: text("category_name").notNull(),
  description: text("description").notNull().default(""),
  specifications: text("specifications"),
  status: text("status").notNull().default("active"),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
});

export const licenses = sqliteTable("licenses", {
  id: text("id").primaryKey(),
  license_name: text("license_name").notNull(),
  license_key: text("license_key").notNull().default(""),
  vendor: text("vendor").notNull().default(""),
  license_type: text("license_type").notNull().default("subscription"), // subscription | perpetual | volume | oem
  total_seats: integer("total_seats").notNull().default(0),
  purchase_cost: real("purchase_cost"),
  purchase_date: text("purchase_date").notNull().default(""),
  expiry_date: text("expiry_date"),
  description: text("description").notNull().default(""),
  status: text("status").notNull().default("active"),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
});

export const license_assignments = sqliteTable("license_assignments", {
  id: text("id").primaryKey(),
  license_id: text("license_id").notNull(),
  assigned_user_id: text("assigned_user_id"),
  assigned_asset_id: text("assigned_asset_id"),
  seat_number: text("seat_number").notNull().default(""),
  allocated_at: text("allocated_at").notNull(),
  notes: text("notes").notNull().default(""),
}, (table) => [
  index("lic_assign_license_idx").on(table.license_id),
  index("lic_assign_user_idx").on(table.assigned_user_id),
  index("lic_assign_asset_idx").on(table.assigned_asset_id),
]);

export const assets = sqliteTable("assets", {
  id: text("id").primaryKey(),
  asset_code: text("asset_code").notNull(),
  asset_name: text("asset_name").notNull(),
  category_id: text("category_id").notNull(),
  brand: text("brand").notNull().default(""),
  model: text("model").notNull().default(""),
  serial_number: text("serial_number").notNull().default(""),
  condition: text("condition").notNull().default("good"),
  status: text("status").notNull().default("available"),
  purchase_date: text("purchase_date").notNull().default(""),
  purchase_price: real("purchase_price"),
  useful_life_years: integer("useful_life_years").notNull().default(5),
  salvage_value: real("salvage_value").notNull().default(0),
  warranty_end_date: text("warranty_end_date"),
  warranty_note: text("warranty_note"),
  location_id: text("location_id").notNull(),
  assigned_user_id: text("assigned_user_id"),
  assigned_department_id: text("assigned_department_id"),
  cost_center: text("cost_center"),
  parent_asset_id: text("parent_asset_id"),
  notes: text("notes").notNull().default(""),
  qr_code_value: text("qr_code_value").notNull().default(""),
  image_url: text("image_url"),
  specifications: text("specifications"),
  created_by: text("created_by").notNull(),
  updated_by: text("updated_by").notNull(),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
  deleted_at: text("deleted_at"),
}, (table) => [
  index("assets_assigned_user_idx").on(table.assigned_user_id),
  index("assets_category_idx").on(table.category_id),
  index("assets_location_idx").on(table.location_id),
  index("assets_status_idx").on(table.status),
]);

export const asset_transactions = sqliteTable("asset_transactions", {
  id: text("id").primaryKey(),
  asset_id: text("asset_id").notNull(),
  transaction_type: text("transaction_type").notNull(),
  from_user_id: text("from_user_id"),
  to_user_id: text("to_user_id"),
  from_department_id: text("from_department_id"),
  to_department_id: text("to_department_id"),
  from_location_id: text("from_location_id"),
  to_location_id: text("to_location_id"),
  condition_before: text("condition_before"),
  condition_after: text("condition_after"),
  notes: text("notes").notNull().default(""),
  created_by: text("created_by").notNull(),
  created_at: text("created_at").notNull(),
}, (table) => [
  index("asset_tx_asset_id_idx").on(table.asset_id),
]);

export const requests = sqliteTable("requests", {
  id: text("id").primaryKey(),
  request_code: text("request_code").notNull(),
  requester_id: text("requester_id").notNull(),
  request_type: text("request_type").notNull(),
  asset_category_id: text("asset_category_id"),
  asset_id: text("asset_id"),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  priority: text("priority").notNull(),
  status: text("status").notNull().default("draft"),
  reason: text("reason").notNull().default(""),
  required_date: text("required_date"),
  approved_by: text("approved_by"),
  approved_at: text("approved_at"),
  rejected_reason: text("rejected_reason").notNull().default(""),
  department_asset: integer("department_asset", { mode: "boolean" }).notNull().default(false),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
}, (table) => [
  index("requests_requester_idx").on(table.requester_id),
  index("requests_status_idx").on(table.status),
]);

export const maintenance_logs = sqliteTable("maintenance_logs", {
  id: text("id").primaryKey(),
  maintenance_code: text("maintenance_code").notNull(),
  asset_id: text("asset_id").notNull(),
  issue_description: text("issue_description").notNull(),
  severity: text("severity").notNull(),
  vendor_name: text("vendor_name").notNull().default(""),
  technician_name: text("technician_name").notNull().default(""),
  cost_estimate: real("cost_estimate"),
  actual_cost: real("actual_cost"),
  status: text("status").notNull().default("open"),
  started_at: text("started_at"),
  completed_at: text("completed_at"),
  notes: text("notes").notNull().default(""),
  created_by: text("created_by").notNull(),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
}, (table) => [
  index("maint_asset_id_idx").on(table.asset_id),
  index("maint_status_idx").on(table.status),
]);

export const audit_logs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  actor_user_id: text("actor_user_id").notNull(),
  action_type: text("action_type").notNull(),
  entity_type: text("entity_type").notNull(),
  entity_id: text("entity_id").notNull(),
  before_json: text("before_json"),
  after_json: text("after_json"),
  ip_address: text("ip_address").notNull().default(""),
  user_agent: text("user_agent").notNull().default(""),
  created_at: text("created_at").notNull(),
}, (table) => [
  index("audit_actor_idx").on(table.actor_user_id),
  index("audit_entity_idx").on(table.entity_type, table.entity_id),
]);

export const sessions = sqliteTable("sessions", {
  token: text("token").primaryKey(),
  user_id: text("user_id").notNull(),
  created_at: text("created_at").notNull(),
  expires_at: text("expires_at").notNull(),
}, (table) => [
  index("sessions_user_id_idx").on(table.user_id),
]);

export const password_reset_tokens = sqliteTable("password_reset_tokens", {
  token: text("token").primaryKey(),
  user_id: text("user_id").notNull(),
  expires_at: text("expires_at").notNull(),
  used: integer("used", { mode: "boolean" }).notNull().default(false),
  created_at: text("created_at").notNull(),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  user_id: text("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  link: text("link").notNull(),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  created_at: text("created_at").notNull(),
}, (table) => [
  index("notif_user_id_idx").on(table.user_id),
]);
