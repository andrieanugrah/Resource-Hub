import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readTable, writeTable, newId, nowIso, generateMaintenanceCode, type MaintenanceLog } from "@/lib/db";
import { requireUser, can, requireCsrf } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { maintenanceCreate, validate } from "@/lib/validate";

export async function GET() {
  const user = await requireUser();
  const logs = await readTable("maintenance_logs");
  const canViewAll = can(user.role, "maintenance.view") || can(user.role, "master.manage");
  const filtered = canViewAll ? logs : logs.filter((l) => l.created_by === user.id);
  const sorted = [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return NextResponse.json(sorted);
}

export async function POST(req: NextRequest) {
  const csrfErr = await requireCsrf(req);
  if (csrfErr) return csrfErr;
  const user = await requireUser();
  if (!can(user.role, "maintenance.create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = validate(maintenanceCreate, body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { data } = parsed;

  const assets = await readTable("assets");
  const asset = assets.find((a) => a.id === data.asset_id && !a.deleted_at);
  if (!asset) return NextResponse.json({ error: "Asset not found." }, { status: 404 });

  const maintenanceLogs = await readTable("maintenance_logs");
  const now = nowIso();

  const log: MaintenanceLog = {
    id: newId("mnt"),
    maintenance_code: generateMaintenanceCode(maintenanceLogs),
    asset_id: data.asset_id,
    issue_description: data.issue_description,
    severity: data.severity,
    vendor_name: data.vendor_name ?? "",
    technician_name: data.technician_name ?? "",
    cost_estimate: data.cost_estimate ?? null,
    actual_cost: null,
    status: "open",
    started_at: data.started_at ?? now.split("T")[0],
    completed_at: null,
    notes: body.notes ?? "",
    created_by: user.id,
    created_at: now,
    updated_at: now,
  };

  maintenanceLogs.push(log);
  await writeTable("maintenance_logs", maintenanceLogs);
  await writeAudit({
    actorUserId: user.id, actionType: "maintenance.create",
    entityType: "maintenance", entityId: log.id, after: log,
  });
  revalidatePath("/maintenance");

  // Notify asset assigned user
  if (asset.assigned_user_id) {
    await createNotification({
      userId: asset.assigned_user_id,
      title: "Maintenance Created",
      message: `Maintenance ticket ${log.maintenance_code} created for ${asset.asset_name}.`,
      type: "maintenance",
      link: `/maintenance/${log.id}`,
    });
  }

  // ponytail: Set asset to in_repair so it's not assignable while under maintenance
  if (["available", "assigned", "reserved"].includes(asset.status)) {
    const assetBefore = { ...asset };
    const aIdx = assets.findIndex((a) => a.id === data.asset_id);
    if (aIdx >= 0) {
      assets[aIdx].status = "in_repair";
      assets[aIdx].updated_by = user.id;
      assets[aIdx].updated_at = now;
      await writeTable("assets", assets);
      await writeAudit({
        actorUserId: user.id, actionType: "asset.repair",
        entityType: "asset", entityId: asset.id,
        before: assetBefore, after: assets[aIdx],
      });
      revalidatePath("/assets");
      revalidatePath(`/assets/${asset.id}`);
    }
  }

  return NextResponse.json(log, { status: 201 });
}
