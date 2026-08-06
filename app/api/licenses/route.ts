import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readTable, writeTable, newId, nowIso, type License } from "@/lib/db";
import { requireApiUser, can, requireCsrf } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { licenseCreate, validate } from "@/lib/validate";

export async function GET() {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;

  const licenses = await readTable("licenses");
  const assignments = await readTable("license_assignments");
  const canManage = can(user.role, "master.manage");

  const result = licenses.map((l) => ({
    ...l,
    license_key: canManage ? l.license_key : (l.license_key ? "••••••••" : ""),
    assigned_seats: assignments.filter((a) => a.license_id === l.id).length,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const csrfErr = await requireCsrf(req);
  if (csrfErr) return csrfErr;
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  if (!can(user.role, "master.manage"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = validate(licenseCreate, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { data } = parsed;

  const now = nowIso();
  const license: License = {
    id: newId("lic"),
    license_name: data.license_name,
    license_key: data.license_key ?? "",
    vendor: data.vendor ?? "",
    license_type: (data.license_type as License["license_type"]) ?? "subscription",
    total_seats: data.total_seats ?? 0,
    purchase_cost: data.purchase_cost ?? null,
    purchase_date: data.purchase_date ?? "",
    expiry_date: data.expiry_date ?? null,
    description: data.description ?? "",
    status: "active",
    created_at: now,
    updated_at: now,
  };

  const licenses = await readTable("licenses");
  licenses.push(license);
  await writeTable("licenses", licenses);
  await writeAudit({ actorUserId: user.id, actionType: "license.create", entityType: "license", entityId: license.id, after: license });
  revalidatePath("/licenses");
  return NextResponse.json(license, { status: 201 });
}
