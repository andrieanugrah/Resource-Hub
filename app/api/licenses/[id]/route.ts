import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readTable, writeTable, nowIso } from "@/lib/db";
import { requireApiUser, can, requireCsrf } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { licenseUpdate, validate } from "@/lib/validate";
import type { License } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  const licenses = await readTable("licenses");
  const license = licenses.find((l) => l.id === id);
  if (!license) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const assignments = await readTable("license_assignments");
  const canManage = can(user.role, "master.manage");

  return NextResponse.json({
    ...license,
    license_key: canManage ? license.license_key : (license.license_key ? "••••••••" : ""),
    assigned_seats: assignments.filter((a) => a.license_id === id).length,
    assignments: assignments.filter((a) => a.license_id === id),
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const csrfErr = await requireCsrf(req);
  if (csrfErr) return csrfErr;
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  if (!can(user.role, "master.manage"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const parsed = validate(licenseUpdate, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { data } = parsed;

  const licenses = await readTable("licenses");
  const idx = licenses.findIndex((l) => l.id === id);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const before = { ...licenses[idx] };
  const row = { ...licenses[idx] };
  const patchFields: (keyof License)[] = ["license_name", "license_key", "vendor", "license_type", "total_seats", "purchase_cost", "purchase_date", "expiry_date", "description", "status"];
  for (const f of patchFields) {
    const v = data[f as keyof typeof data];
    if (v !== undefined) (row as Record<string, unknown>)[f] = v;
  }
  row.updated_at = nowIso();

  licenses[idx] = row;
  await writeTable("licenses", licenses);
  await writeAudit({ actorUserId: user.id, actionType: "license.update", entityType: "license", entityId: id, before, after: row });

  revalidatePath("/licenses");
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const csrfErr = await requireCsrf(req);
  if (csrfErr) return csrfErr;
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  if (!can(user.role, "master.manage"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const licenses = await readTable("licenses");
  const filtered = licenses.filter((l) => l.id !== id);
  if (filtered.length === licenses.length)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const removed = licenses.find((l) => l.id === id);
  await writeTable("licenses", filtered);
  await writeAudit({ actorUserId: user.id, actionType: "license.delete", entityType: "license", entityId: id, before: removed });

  // Cascade delete assignments
  const assignments = await readTable("license_assignments");
  const remaining = assignments.filter((a) => a.license_id !== id);
  if (remaining.length !== assignments.length) {
    await writeTable("license_assignments", remaining);
  }

  revalidatePath("/licenses");
  return NextResponse.json({ ok: true });
}
