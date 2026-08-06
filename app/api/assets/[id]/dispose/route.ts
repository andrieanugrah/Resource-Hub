import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readTable, writeTable, newId, nowIso, type AssetTransaction } from "@/lib/db";
import { requireUser, can, requireCsrf } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const csrfErr = await requireCsrf(req);
  if (csrfErr) return csrfErr;
  const user = await requireUser();
  if (!can(user.role, "asset.delete")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const reason = body.reason as string | undefined;
  if (!reason) {
    return NextResponse.json({ error: "Reason required." }, { status: 400 });
  }

  const assets = await readTable("assets");
  const aIdx = assets.findIndex((a) => a.id === id && !a.deleted_at);
  if (aIdx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const asset = assets[aIdx];
  const allowed = ["retired", "lost"];
  if (!allowed.includes(asset.status)) {
    return NextResponse.json(
      { error: `Cannot dispose asset in "${asset.status}" status. Must be retired or lost first.` },
      { status: 409 },
    );
  }

  const before = { ...asset };
  asset.status = "disposed";
  asset.updated_by = user.id;
  asset.updated_at = nowIso();

  const txn: AssetTransaction = {
    id: newId("txn"),
    asset_id: asset.id,
    transaction_type: "update",
    from_user_id: asset.assigned_user_id,
    to_user_id: null,
    from_department_id: asset.assigned_department_id,
    to_department_id: null,
    from_location_id: asset.location_id,
    to_location_id: asset.location_id,
    condition_before: before.condition,
    condition_after: asset.condition,
    notes: `Asset disposed: ${reason}`,
    created_by: user.id,
    created_at: nowIso(),
  };

  assets[aIdx] = asset;
  const txs = await readTable("asset_transactions");
  txs.push(txn);

  await writeTable("assets", assets);
  await writeTable("asset_transactions", txs);
  await writeAudit({
    actorUserId: user.id, actionType: "asset.dispose",
    entityType: "asset", entityId: asset.id, before, after: asset,
  });
  revalidatePath("/assets");
  revalidatePath(`/assets/${asset.id}`);

  return NextResponse.json(asset);
}
