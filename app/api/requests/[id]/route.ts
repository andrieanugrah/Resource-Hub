import { NextRequest, NextResponse } from "next/server";
import { readTable } from "@/lib/db";
import { requireUser, can } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const reqs = await readTable("requests");
  const request = reqs.find((r) => r.id === id);
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (request.requester_id !== user.id && !can(user.role, "request.approve") && !can(user.role, "master.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(request);
}
