import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { readTable, writeTable } from "@/lib/db";
import { requireCsrf } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { validate } from "@/lib/validate";
import { z as zod } from "zod";

const forgotPasswordSchema = zod.object({ email: zod.string().email("Invalid email") });

// Simple token-based password reset (no email server needed for MVP)
export async function POST(req: NextRequest) {
  const csrfErr = await requireCsrf(req);
  if (csrfErr) return csrfErr;

  const body = await req.json();
  const parsed = validate(forgotPasswordSchema, body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const users = await readTable("users");
  const user = users.find((u) => u.email.toLowerCase() === parsed.data.email.toLowerCase());
  if (!user) {
    // Don't reveal whether the email exists
    return NextResponse.json({ ok: true, message: "If the email exists, a reset link has been generated." });
  }

  const tokens = await readTable("password_reset_tokens");
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date();

  tokens.push({
    token,
    user_id: user.id,
    expires_at: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
    used: false,
    created_at: now.toISOString(),
  });

  // Clean old tokens
  const live = tokens.filter((t) => new Date(t.expires_at) > now);
  await writeTable("password_reset_tokens", live);

  await writeAudit({ actorUserId: user.id, actionType: "auth.password_reset_request", entityType: "user", entityId: user.id });

  if (process.env.NODE_ENV !== "production") {
    console.info(`[dev] password reset for ${user.email}: /reset-password?token=${token}`);
  }

  return NextResponse.json({
    ok: true,
    message: "If the email exists, a reset link has been generated.",
  });
}
