import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readTable, writeTable, newId, nowIso, type AssetTransaction, type AssetCondition, type AssetStatus } from "@/lib/db";
import { requireUser, can, requireCsrf } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const csrfErr = await requireCsrf(req);
  if (csrfErr) return csrfErr;
  const user = await requireUser();
  if (!can(user.role, "asset.return")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const newStatus = (body.status as string) ?? "available";
  const newCondition = (body.condition as AssetCondition) ?? undefined;

  const allowedStatus = ["available", "in_repair", "retired"];
  if (!allowedStatus.includes(newStatus)) return NextResponse.json({ error: "Invalid target status: " + newStatus }, { status: 400 });

  const assets = await readTable("assets");
  const asset = assets.find((a) => a.id === id && !a.deleted_at);
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (asset.status !== "assigned") return NextResponse.json({ error: "Asset is not assigned." }, { status: 409 });

  const before = { ...asset };
  const oldUser = asset.assigned_user_id;
  const oldDept = asset.assigned_department_id;

  asset.assigned_user_id = null;
  asset.assigned_department_id = null;
  asset.status = newStatus as AssetStatus;
  if (newCondition) asset.condition = newCondition;
  asset.updated_by = user.id;
  asset.updated_at = nowIso();

  const txn: AssetTransaction = {
    id: newId("txn"),
    asset_id: asset.id,
    transaction_type: "return",
    from_user_id: oldUser,
    to_user_id: null,
    from_department_id: oldDept,
    to_department_id: null,
    from_location_id: asset.location_id,
    to_location_id: asset.location_id,
    condition_before: before.condition,
    condition_after: asset.condition,
    notes: body.notes ?? "",
    created_by: user.id,
    created_at: nowIso(),
  };

  const aIdx = assets.findIndex((a) => a.id === id);
  assets[aIdx] = asset;
  const txs = await readTable("asset_transactions");
  txs.push(txn);

  await writeTable("assets", assets);
  await writeTable("asset_transactions", txs);
  await writeAudit({ actorUserId: user.id, actionType: "asset.return", entityType: "asset", entityId: asset.id, before, after: asset });
  revalidatePath("/assets");
  revalidatePath(`/assets/${asset.id}`);

  return NextResponse.json(asset);
}
