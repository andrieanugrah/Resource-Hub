import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readTable, writeTable, nowIso } from "@/lib/db";
import { requireUser, can, requireCsrf } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { writeAudit } from "@/lib/audit";
import { adminResetPassword, validate } from "@/lib/validate";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const csrfErr = await requireCsrf(req);
  if (csrfErr) return csrfErr;
  const actor = await requireUser();
  if (!can(actor.role, "user.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = validate(adminResetPassword, body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const users = await readTable("users");
  const idx = users.findIndex((u) => u.id === id);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { hash, salt } = hashPassword(parsed.data.new_password);
  users[idx].password_hash = hash;
  users[idx].password_salt = salt;
  users[idx].updated_at = nowIso();

  await writeTable("users", users);
  await writeAudit({ actorUserId: actor.id, actionType: "user.reset_password", entityType: "user", entityId: id });

  // Invalidate all sessions for this user
  const sessions = await readTable("sessions");
  const remaining = sessions.filter((s) => s.user_id !== id);
  if (remaining.length < sessions.length) {
    await writeTable("sessions", remaining);
  }

  await createNotification({
    userId: id,
    title: "Password Reset",
    message: `Your password was reset by ${actor.name}.`,
    type: "system",
    link: "/profile",
  });

  revalidatePath("/users");
  return NextResponse.json({ ok: true });
}
