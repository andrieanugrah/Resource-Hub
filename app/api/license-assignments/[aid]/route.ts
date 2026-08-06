import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readTable, writeTable } from "@/lib/db";
import { requireApiUser, can, requireCsrf } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ aid: string }> }) {
  const csrfErr = await requireCsrf(req);
  if (csrfErr) return csrfErr;
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  if (!can(user.role, "master.manage"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { aid } = await params;
  const assignments = await readTable("license_assignments");
  const idx = assignments.findIndex((a) => a.id === aid);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const removed = assignments[idx];
  assignments.splice(idx, 1);
  await writeTable("license_assignments", assignments);
  await writeAudit({ actorUserId: user.id, actionType: "license_assign.delete", entityType: "license_assignment", entityId: aid, before: removed });
  revalidatePath("/licenses");
  revalidatePath(`/licenses/${removed.license_id}`);
  return NextResponse.json({ ok: true });
}
