import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { destroySession, clearSessionCookie } from "@/lib/auth";

export async function POST() {
  const jar = await cookies();
  const token = jar.get("rh_session")?.value;
  if (token) await destroySession(token);
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000"));
}
