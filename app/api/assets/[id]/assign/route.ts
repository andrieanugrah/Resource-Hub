import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readTable, writeTable, newId, nowIso, type AssetTransaction } from "@/lib/db";
import { requireUser, can, requireCsrf } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const csrfErr = await requireCsrf(req);
  if (csrfErr) return csrfErr;
  const user = await requireUser();
  if (!can(user.role, "asset.assign")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const targetUserId = body.user_id as string | null;
  const targetDeptId = body.department_id as string | null;

  // Validate target user exists and is active
  if (targetUserId) {
    const users = await readTable("users");
    const targetUser = users.find((u) => u.id === targetUserId && u.status === "active");
    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found or inactive." }, { status: 400 });
    }
  }

  const assets = await readTable("assets");
  const asset = assets.find((a) => a.id === id && !a.deleted_at);
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (asset.status === "assigned") return NextResponse.json({ error: "Asset already assigned." }, { status: 409 });
  if (asset.status === "in_repair") return NextResponse.json({ error: "Asset in repair. Return it first." }, { status: 409 });

  const before = { ...asset };
  const oldUser = asset.assigned_user_id;
  const oldDept = asset.assigned_department_id;
  const oldLoc = asset.location_id;

  asset.assigned_user_id = targetUserId ?? null;
  asset.assigned_department_id = targetDeptId ?? null;
  if (targetDeptId && !targetUserId) {
    // assign to department only
    asset.location_id = asset.location_id; // keep
  }
  asset.status = "assigned";
  asset.updated_by = user.id;
  asset.updated_at = nowIso();

  const txn: AssetTransaction = {
    id: newId("txn"),
    asset_id: asset.id,
    transaction_type: "assign",
    from_user_id: oldUser,
    to_user_id: targetUserId ?? null,
    from_department_id: oldDept,
    to_department_id: targetDeptId ?? null,
    from_location_id: oldLoc,
    to_location_id: asset.location_id,
    condition_before: asset.condition,
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
  await writeAudit({ actorUserId: user.id, actionType: "asset.assign", entityType: "asset", entityId: asset.id, before, after: asset });
  revalidatePath("/assets");
  revalidatePath(`/assets/${asset.id}`);

  // Notify assigned user
  if (targetUserId) {
    await createNotification({
      userId: targetUserId,
      title: "Asset Assigned",
      message: `${asset.asset_name} (${asset.asset_code}) has been assigned to you.`,
      type: "asset",
      link: `/assets/${asset.id}`,
    });
  }

  return NextResponse.json(asset);
}
