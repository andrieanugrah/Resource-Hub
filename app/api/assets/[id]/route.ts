import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readTable, writeTable, nowIso } from "@/lib/db";
import { requireApiUser, can, requireCsrf } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { assetUpdate, validate } from "@/lib/validate";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  const { id } = await params;
  const assets = await readTable("assets");
  const asset = assets.find((a) => a.id === id && !a.deleted_at);
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(asset);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const csrfErr = await requireCsrf(req);
  if (csrfErr) return csrfErr;
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  if (!can(user.role, "asset.edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const assets = await readTable("assets");
  const idx = assets.findIndex((a) => a.id === id && !a.deleted_at);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = validate(assetUpdate, body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const before = { ...assets[idx] };
  const asset = assets[idx];

  if (body.asset_code && body.asset_code !== asset.asset_code) {
    const dup = assets.find((a) => a.asset_code === body.asset_code && a.id !== id && !a.deleted_at);
    if (dup) return NextResponse.json({ error: "Asset code already exists." }, { status: 409 });
  }
  if (body.serial_number && body.serial_number !== asset.serial_number) {
    const serDup = assets.find((a) => a.serial_number === body.serial_number && a.id !== id && !a.deleted_at);
    if (serDup) return NextResponse.json({ error: "Serial number already exists." }, { status: 409 });
  }

  const fields = ["asset_code","asset_name","category_id","brand","model","serial_number","condition","purchase_date","purchase_price","warranty_end_date","warranty_note","location_id","parent_asset_id","notes","image_url","specifications","cost_center","useful_life_years","salvage_value"];
  for (const f of fields) {
    if (body[f] !== undefined) (asset as unknown as Record<string, unknown>)[f] = body[f];
  }
  if (body.purchase_price !== undefined) asset.purchase_price = body.purchase_price ? Number(body.purchase_price) : null;
  if (body.specifications && typeof body.specifications === "object") asset.specifications = body.specifications;
  asset.updated_by = user.id;
  asset.updated_at = nowIso();

  assets[idx] = asset;
  await writeTable("assets", assets);
  await writeAudit({ actorUserId: user.id, actionType: "asset.update", entityType: "asset", entityId: asset.id, before, after: asset });
  revalidatePath("/assets");

  return NextResponse.json(asset);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const csrfErr = await requireCsrf(_req);
  if (csrfErr) return csrfErr;
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  if (!can(user.role, "asset.delete")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const assets = await readTable("assets");
  const idx = assets.findIndex((a) => a.id === id && !a.deleted_at);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const targetAsset = assets[idx];
  // State Machine protection: Cannot delete assigned asset without returning it first
  if (targetAsset.status === "assigned") {
    return NextResponse.json(
      { error: "Cannot delete asset while it is currently assigned. Process a return request first." },
      { status: 409 }
    );
  }

  const before = { ...targetAsset };
  assets[idx].deleted_at = nowIso();
  assets[idx].updated_at = nowIso();
  assets[idx].updated_by = user.id;
  await writeTable("assets", assets);
  await writeAudit({ actorUserId: user.id, actionType: "asset.delete", entityType: "asset", entityId: id, before, after: assets[idx] });
  revalidatePath("/assets");

  return NextResponse.json({ ok: true });
}
