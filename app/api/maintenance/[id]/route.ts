import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readTable, writeTable, nowIso, type MaintenanceStatus } from "@/lib/db";
import { requireUser, can, requireCsrf } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { maintenanceUpdate, validate } from "@/lib/validate";

const STATUS_FLOW: Record<string, string[]> = {
  open: ["in_progress"],
  in_progress: ["waiting_vendor", "resolved"],
  waiting_vendor: ["resolved"],
  resolved: ["closed"],
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const logs = await readTable("maintenance_logs");
  const log = logs.find((l) => l.id === id);
  if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(log);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const csrfErr = await requireCsrf(req);
  if (csrfErr) return csrfErr;
  const user = await requireUser();
  if (!can(user.role, "maintenance.edit"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = validate(maintenanceUpdate, body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { data } = parsed;

  const logs = await readTable("maintenance_logs");
  const idx = logs.findIndex((l) => l.id === id);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const before = { ...logs[idx] };
  const log = logs[idx];

  // Status transition
  if (data.status && data.status !== log.status) {
    const allowed = STATUS_FLOW[log.status] ?? [];
    if (!allowed.includes(data.status)) {
      return NextResponse.json(
        { error: `Cannot transition from "${log.status}" to "${data.status}".` },
        { status: 409 },
      );
    }
    log.status = data.status as MaintenanceStatus;
    if (data.status === "resolved" || data.status === "closed") {
      log.completed_at = nowIso();
    }
  }

  // Update editable fields
  const updatable = ["issue_description", "severity", "vendor_name", "technician_name",
    "cost_estimate", "actual_cost", "notes", "started_at"];
  for (const f of updatable) {
    if (data[f as keyof typeof data] !== undefined) (log as unknown as Record<string, unknown>)[f] = data[f as keyof typeof data];
  }

  log.updated_at = nowIso();
  logs[idx] = log;
  await writeTable("maintenance_logs", logs);

  // If maintenance is resolved or closed, determine correct return status
  if ((data.status === "resolved" || data.status === "closed") && log.asset_id) {
    const assets = await readTable("assets");
    const aIdx = assets.findIndex((a) => a.id === log.asset_id);
    if (aIdx >= 0 && assets[aIdx].status === "in_repair") {
      // Return to "reserved" if active request exists for this asset, otherwise "available"
      const requests = await readTable("requests");
      const activeRequest = requests.find((r) =>
        r.asset_id === log.asset_id &&
        !["completed", "cancelled", "rejected"].includes(r.status)
      );
      assets[aIdx].status = activeRequest ? "reserved" : "available";
      assets[aIdx].updated_by = user.id;
      assets[aIdx].updated_at = nowIso();
      await writeTable("assets", assets);
      revalidatePath("/assets");
      revalidatePath(`/assets/${log.asset_id}`);
    }
  }

  await writeAudit({
    actorUserId: user.id, actionType: "maintenance.update",
    entityType: "maintenance", entityId: id, before, after: log,
  });
  revalidatePath("/maintenance");
  revalidatePath(`/maintenance/${id}`);

  return NextResponse.json(log);
}
