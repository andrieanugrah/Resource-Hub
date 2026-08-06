import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readTable, writeTable, newId, nowIso, type Asset } from "@/lib/db";
import { requireApiUser, can, requireCsrf } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

// ponytail: stdlib CSV parse, no dep. Add papaparse if quoted-newline edge cases appear.
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { row.push(field); field = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(field); rows.push(row); row = []; field = "";
      } else field += ch;
    }
  }
  if (row.length > 0 || field) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const VALID_CONDITIONS = ["new", "good", "fair", "damaged", "critical"];
const VALID_STATUSES = ["available", "assigned", "reserved", "in_repair", "retired", "lost", "disposed"];

export async function POST(req: NextRequest) {
  const csrfErr = await requireCsrf(req);
  if (csrfErr) return csrfErr;
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  if (!can(user.role, "asset.create"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File))
    return NextResponse.json({ error: "CSV file required" }, { status: 400 });

  const text = await file.text();
  const rows = parseCSV(text);
  if (rows.length < 2)
    return NextResponse.json({ error: "CSV must have header + at least 1 row" }, { status: 400 });

  // Header row -> map columns to fields by name
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const colIndex: Record<string, number> = {};
  header.forEach((h, i) => { colIndex[h] = i; });

  // Required columns check
  const requiredCols = ["asset_code", "asset_name", "category_id", "serial_number", "location_id"];
  const missing = requiredCols.filter((c) => !(c in colIndex));
  if (missing.length > 0)
    return NextResponse.json({ error: `Missing required columns: ${missing.join(", ")}` }, { status: 400 });

  const [categories, locations, assets] = await Promise.all([
    readTable("categories"), readTable("locations"), readTable("assets"),
  ]);
  const validCatIds = new Set(categories.map((c) => c.id));
  const validLocIds = new Set(locations.map((l) => l.id));
  const existingCodes = new Set(assets.filter((a) => !a.deleted_at).map((a) => a.asset_code));
  const existingSerials = new Set(assets.filter((a) => !a.deleted_at).map((a) => a.serial_number));

  const now = nowIso();
  const created: Asset[] = [];
  const errors: { row: number; error: string }[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const get = (field: string) => r[colIndex[field]]?.trim() ?? "";

    const asset_code = get("asset_code");
    const asset_name = get("asset_name");
    const category_id = get("category_id");
    const serial_number = get("serial_number");
    const location_id = get("location_id");

    if (!asset_code || !asset_name || !category_id || !serial_number || !location_id) {
      errors.push({ row: i + 1, error: "Missing required field" });
      continue;
    }
    if (!validCatIds.has(category_id)) {
      errors.push({ row: i + 1, error: `Unknown category_id: ${category_id}` });
      continue;
    }
    if (!validLocIds.has(location_id)) {
      errors.push({ row: i + 1, error: `Unknown location_id: ${location_id}` });
      continue;
    }
    if (existingCodes.has(asset_code)) {
      errors.push({ row: i + 1, error: `Duplicate asset_code: ${asset_code}` });
      continue;
    }
    if (existingSerials.has(serial_number)) {
      errors.push({ row: i + 1, error: `Duplicate serial_number: ${serial_number}` });
      continue;
    }

    const condition = get("condition") || "good";
    if (condition && !VALID_CONDITIONS.includes(condition)) {
      errors.push({ row: i + 1, error: `Invalid condition: ${condition}` });
      continue;
    }
    const status = get("status") || "available";
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push({ row: i + 1, error: `Invalid status: ${status}` });
      continue;
    }

    const priceStr = get("purchase_price");
    const price = priceStr ? Number(priceStr) : null;
    if (priceStr && (isNaN(price!) || price! < 0)) {
      errors.push({ row: i + 1, error: `Invalid purchase_price: ${priceStr}` });
      continue;
    }
    const ulife = get("useful_life_years") ? Number(get("useful_life_years")) : 5;
    const salvage = get("salvage_value") ? Number(get("salvage_value")) : 0;

    existingCodes.add(asset_code);
    existingSerials.add(serial_number);

    created.push({
      id: newId("ast"), asset_code, asset_name, category_id,
      brand: get("brand"), model: get("model"), serial_number,
      condition: condition as Asset["condition"], status: status as Asset["status"],
      purchase_date: get("purchase_date") || now.split("T")[0],
      purchase_price: price,
      useful_life_years: ulife, salvage_value: salvage,
      warranty_end_date: get("warranty_end_date") || null,
      warranty_note: null, location_id,
      assigned_user_id: null, assigned_department_id: null, cost_center: null,
      notes: get("notes"), qr_code_value: newId("QR"), image_url: null,
      specifications: null,
      created_by: user.id, updated_by: user.id,
      created_at: now, updated_at: now, deleted_at: null,
    });
  }

  if (created.length > 0) {
    assets.push(...created);
    await writeTable("assets", assets);
    await writeAudit({
      actorUserId: user.id, actionType: "asset.bulk_import",
      entityType: "asset", entityId: "bulk",
      after: { imported: created.length, errors: errors.length } as unknown as Asset,
    });
    revalidatePath("/assets");
    revalidatePath("/dashboard");
  }

  return NextResponse.json({
    imported: created.length,
    errors,
  }, { status: created.length > 0 ? 201 : 400 });
}