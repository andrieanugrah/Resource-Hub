import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readTable, writeTable, newId, nowIso, type LicenseAssignment } from "@/lib/db";
import { requireApiUser, can, requireCsrf } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { licenseAssignmentCreate, validate } from "@/lib/validate";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  const assignments = await readTable("license_assignments");
  return NextResponse.json(assignments.filter((a) => a.license_id === id));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const csrfErr = await requireCsrf(req);
  if (csrfErr) return csrfErr;
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  if (!can(user.role, "master.manage"))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: licenseId } = await params;
  const body = await req.json();
  // Inject license_id from URL so validators don't reject it
  body.license_id = licenseId;
  const parsed = validate(licenseAssignmentCreate, body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { data } = parsed;

  // Verify license exists and has seats available
  const licenses = await readTable("licenses");
  const license = licenses.find((l) => l.id === licenseId);
  if (!license) return NextResponse.json({ error: "License not found" }, { status: 404 });

  const assignments = await readTable("license_assignments");
  const licenseAssignments = assignments.filter((a) => a.license_id === licenseId);
  const currentSeats = licenseAssignments.length;
  if (license.total_seats > 0 && currentSeats >= license.total_seats) {
    return NextResponse.json({ error: "No seats available for this license" }, { status: 409 });
  }

  // Prevent assigning duplicate seat to the same user
  if (data.assigned_user_id) {
    const isAlreadyAssigned = licenseAssignments.some(
      (a) => a.assigned_user_id === data.assigned_user_id
    );
    if (isAlreadyAssigned) {
      return NextResponse.json({ error: "User is already assigned to this license" }, { status: 409 });
    }
  }

  const assignment: LicenseAssignment = {
    id: newId("lsa"),
    license_id: licenseId,
    assigned_user_id: data.assigned_user_id ?? null,
    assigned_asset_id: data.assigned_asset_id ?? null,
    seat_number: data.seat_number ?? String(currentSeats + 1),
    allocated_at: nowIso(),
    notes: data.notes ?? "",
  };

  assignments.push(assignment);
  await writeTable("license_assignments", assignments);
  await writeAudit({ actorUserId: user.id, actionType: "license_assign.create", entityType: "license_assignment", entityId: assignment.id, after: assignment });
  revalidatePath("/licenses");
  revalidatePath(`/licenses/${licenseId}`);
  return NextResponse.json(assignment, { status: 201 });
}
