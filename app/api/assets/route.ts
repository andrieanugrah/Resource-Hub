import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readTable, writeTable, newId, nowIso, generateAssetCode, type Asset, type AssetTransaction } from "@/lib/db";
import { requireApiUser, can, requireCsrf } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { assetCreate, validate } from "@/lib/validate";

const PAGE_SIZE = 25;

export async function GET(req: NextRequest) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  const assets = await readTable("assets");
  const live = assets.filter((a) => !a.deleted_at);

  const url = new URL(req.url);
  const all = url.searchParams.get("all");
  if (all === "true") return NextResponse.json({ data: live });
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search");
  const page = parseInt(url.searchParams.get("page") ?? "1", 10) || 1;

  let filtered = live;

  // Employee sees only their own assigned assets
  if (!can(user.role, "asset.view")) {
    filtered = filtered.filter((a) => a.assigned_user_id === user.id);
  }

  if (status) filtered = filtered.filter((a) => a.status === status);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter((a) =>
      a.asset_code.toLowerCase().includes(q) || a.asset_name.toLowerCase().includes(q) ||
      a.serial_number.toLowerCase().includes(q) || a.brand.toLowerCase().includes(q) ||
      a.model.toLowerCase().includes(q)
    );
  }

  filtered.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const total = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const paged = filtered.slice(start, start + PAGE_SIZE);

  return NextResponse.json({ data: paged, total, page, totalPages });
}

export async function POST(req: NextRequest) {
  const csrfErr = await requireCsrf(req);
  if (csrfErr) return csrfErr;
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  if (!can(user.role, "asset.create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = validate(assetCreate, body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { data } = parsed;

  const assets = await readTable("assets");

  const assetCode = data.asset_code?.trim() ? data.asset_code.trim() : generateAssetCode(assets);

  if (assets.some((a) => a.asset_code === assetCode && !a.deleted_at)) {
    return NextResponse.json({ error: "Asset code already exists." }, { status: 409 });
  }
  if (assets.some((a) => a.serial_number === data.serial_number && !a.deleted_at)) {
    return NextResponse.json({ error: "Serial number already exists." }, { status: 409 });
  }

  const now = nowIso();
  // ponytail: specifications default from category template if not explicitly provided
  let specifications: Record<string, string> | null =
    data.specifications && typeof data.specifications === "object"
      ? (data.specifications as Record<string, string>)
      : null;
  if (!specifications && data.category_id) {
    const cats = await readTable("categories");
    const cat = cats.find((c) => c.id === data.category_id);
    if (cat?.specifications) {
      specifications = { ...cat.specifications };
    }
  }
  const asset: Asset = {
    id: newId("ast"), asset_code: assetCode, asset_name: data.asset_name,
    category_id: data.category_id, brand: data.brand ?? "", model: data.model ?? "",
    serial_number: data.serial_number, condition: data.condition ?? "good",
    status: "available", purchase_date: data.purchase_date ?? now.split("T")[0],
    purchase_price: data.purchase_price ?? null,
    useful_life_years: data.useful_life_years ?? 5,
    salvage_value: data.salvage_value ?? 0,
    warranty_end_date: data.warranty_end_date ?? null, warranty_note: data.warranty_note ?? null,
    location_id: data.location_id, assigned_user_id: null, assigned_department_id: null,
    parent_asset_id: data.parent_asset_id ?? null,
    cost_center: data.cost_center ?? null, notes: data.notes ?? "",
    qr_code_value: newId("QR"), image_url: data.image_url ?? null, specifications,
    created_by: user.id, updated_by: user.id,
    created_at: now, updated_at: now, deleted_at: null,
  };

  const txn: AssetTransaction = {
    id: newId("txn"), asset_id: asset.id, transaction_type: "create",
    from_user_id: null, to_user_id: null, from_department_id: null, to_department_id: null,
    from_location_id: null, to_location_id: asset.location_id,
    condition_before: null, condition_after: asset.condition,
    notes: "Asset created", created_by: user.id, created_at: now,
  };

  assets.push(asset);
  const txs = await readTable("asset_transactions");
  txs.push(txn);
  await writeTable("assets", assets);
  await writeTable("asset_transactions", txs);
  await writeAudit({ actorUserId: user.id, actionType: "asset.create", entityType: "asset", entityId: asset.id, after: asset });
  revalidatePath("/assets");
  revalidatePath("/dashboard");

  return NextResponse.json({ id: asset.id }, { status: 201 });
}
