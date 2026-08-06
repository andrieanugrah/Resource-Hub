import { NextRequest, NextResponse } from "next/server";
import { readTable, writeTable } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { requireCsrf } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const csrfErr = await requireCsrf(req);
  if (csrfErr) return csrfErr;

  const body = await req.json();
  if (!body.token || !body.password) {
    return NextResponse.json({ error: "Token and new password required." }, { status: 400 });
  }

  if (body.password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const tokens = await readTable("password_reset_tokens");
  const now = new Date();
  const tokenRecord = tokens.find(
    (t) => t.token === body.token && !t.used && new Date(t.expires_at) > now,
  );

  if (!tokenRecord) {
    return NextResponse.json({ error: "Invalid or expired reset token." }, { status: 400 });
  }

  const users = await readTable("users");
  const idx = users.findIndex((u) => u.id === tokenRecord.user_id);
  if (idx < 0) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const { hash, salt } = hashPassword(body.password);
  const beforeHash = users[idx].password_hash;
  users[idx].password_hash = hash;
  users[idx].password_salt = salt;
  await writeTable("users", users);

  // Invalidate all sessions for this user
  const sessions = await readTable("sessions");
  await writeTable("sessions", sessions.filter((s) => s.user_id !== tokenRecord.user_id));

  // Mark token as used
  tokenRecord.used = true;
  await writeTable("password_reset_tokens", tokens);

  await writeAudit({ actorUserId: tokenRecord.user_id, actionType: "user.password_reset", entityType: "user", entityId: tokenRecord.user_id, before: { password_hash: beforeHash }, after: { password_hash: hash } });

  return NextResponse.json({ ok: true, message: "Password reset successful." });
}
