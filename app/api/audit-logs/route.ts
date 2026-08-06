import { NextResponse } from "next/server";
import { readTable } from "@/lib/db";
import { requireApiUser, can } from "@/lib/auth";

export async function GET() {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  if (!can(user.role, "audit.view")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const logs = await readTable("audit_logs");
  logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return NextResponse.json(logs.slice(0, 200));
}
