import { NextRequest, NextResponse } from "next/server";
import { readTable } from "@/lib/db";
import { requireUser, can } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!can(user.role, "asset.view") && !can(user.role, "asset.view_own") && !can(user.role, "master.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const txs = await readTable("asset_transactions");
  const filtered = txs.filter((t) => t.asset_id === id).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return NextResponse.json(filtered);
}
