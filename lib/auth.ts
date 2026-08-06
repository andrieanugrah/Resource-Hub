import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";
import { readTable, writeTable, type User, type Session } from "./db";
import { ROLE_LABELS, can } from "./permissions";

const SESSION_COOKIE = "rh_session";
const CSRF_COOKIE = "rh_csrf";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

export { ROLE_LABELS, can };

export async function createCsrfToken(): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const jar = await cookies();
  jar.set(CSRF_COOKIE, token, {
    httpOnly: false, secure: process.env.NODE_ENV === "production", sameSite: "strict",
    path: "/", maxAge: SESSION_TTL_MS / 1000,
  });
  return token;
}

export async function validateCsrfToken(req: NextRequest): Promise<boolean> {
  const cookieToken = (await cookies()).get(CSRF_COOKIE)?.value;
  const headerToken = req.headers.get("x-csrf-token");
  if (!cookieToken || !headerToken) return false;
  return crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken));
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  const session: Session = {
    token, user_id: userId, created_at: now.toISOString(),
    expires_at: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
  };
  const sessions = await readTable("sessions");
  const live = sessions.filter((s) => new Date(s.expires_at) > now);
  live.push(session);
  await writeTable("sessions", live);
  return token;
}

export async function destroySession(token: string): Promise<void> {
  const sessions = await readTable("sessions");
  await writeTable("sessions", sessions.filter((s) => s.token !== token));
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict",
    path: "/", maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const sessions = await readTable("sessions");
  const now = new Date();
  const session = sessions.find((s) => s.token === token && new Date(s.expires_at) > now);
  if (!session) return null;
  const users = await readTable("users");
  return users.find((u) => u.id === session.user_id) ?? null;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user || user.status !== "active") redirect("/login");
  return user;
}

/** API routes: 401 JSON instead of HTML redirect. */
export async function requireApiUser(): Promise<User | NextResponse> {
  const user = await getCurrentUser();
  if (!user || user.status !== "active") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}

export async function requireCsrf(req: NextRequest): Promise<NextResponse | null> {
  const ok = await validateCsrfToken(req);
  if (!ok) return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  return null;
}
