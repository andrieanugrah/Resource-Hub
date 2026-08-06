import { NextRequest, NextResponse } from "next/server";
import { readTable, writeTable } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSession, setSessionCookie } from "@/lib/auth";
import { loginPayload, validate } from "@/lib/validate";
import { writeAudit } from "@/lib/audit";

const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000;

function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const parsed = validate(loginPayload, { email, password });
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const ip = getIp(req);
    const entry = attempts.get(ip);
    const now = Date.now();
    if (entry && now < entry.resetAt && entry.count >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
    }
    if (!entry || now >= entry.resetAt) {
      attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    } else {
      attempts.set(ip, { count: entry.count + 1, resetAt: entry.resetAt });
    }

    const users = await readTable("users");
    const user = users.find((u) => u.email === email && u.status === "active");
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const valid = verifyPassword(password, user.password_hash, user.password_salt);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    user.last_login_at = new Date().toISOString();
    const userIdx = users.findIndex((u) => u.id === user.id);
    if (userIdx >= 0) users[userIdx] = user;
    await writeTable("users", users);

    const sessions = await readTable("sessions");
    const active = sessions.filter((s) => s.user_id !== user.id);
    await writeTable("sessions", active);

    const token = await createSession(user.id);
    await setSessionCookie(token);
    await writeAudit({ actorUserId: user.id, actionType: "auth.login", entityType: "session", entityId: token });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
