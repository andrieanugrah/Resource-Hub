import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readTable, writeTable, nowIso } from "@/lib/db";
import { requireApiUser, can, requireCsrf } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { userUpdate, validate } from "@/lib/validate";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const csrfErr = await requireCsrf(req);
  if (csrfErr) return csrfErr;
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  if (!can(user.role, "user.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = validate(userUpdate, body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { name, email, role, department_id, job_title, status } = parsed.data;

  const users = await readTable("users");
  const idx = users.findIndex((u) => u.id === id);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Email uniqueness check (only if email is being changed)
  if (email !== undefined) {
    const normalized = email.toLowerCase();
    if (users.some((u) => u.id !== id && u.email.toLowerCase() === normalized)) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }
    users[idx].email = normalized;
  }

  const before = { ...users[idx] };

  if (name !== undefined) users[idx].name = name;
  if (role !== undefined) users[idx].role = role;
  if (department_id !== undefined) users[idx].department_id = department_id;
  if (job_title !== undefined) users[idx].job_title = job_title;
  if (status !== undefined) users[idx].status = status;
  users[idx].updated_at = nowIso();

  await writeTable("users", users);
  await writeAudit({ actorUserId: user.id, actionType: "user.update", entityType: "user", entityId: id, before, after: users[idx] });
  revalidatePath("/users");

  // If user deactivated, flag their assigned assets for IT admins
  if (status === "inactive") {
    const assets = await readTable("assets");
    const userAssets = assets.filter((a) => a.assigned_user_id === id && !a.deleted_at);
    if (userAssets.length > 0) {
      const target = users[idx];
      const admins = users.filter((u) =>
        u.status === "active" && (u.role === "super_admin" || u.role === "admin_it")
      );
      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          title: "User Deactivated With Assets",
          message: `${target.name} has been deactivated but still has ${userAssets.length} asset(s) assigned. Review and process returns.`,
          type: "system",
          link: `/users/${id}`,
        });
      }
    }
  }

  const { password_hash: _h, password_salt: _s, ...safe } = users[idx];
  return NextResponse.json(safe);
}
