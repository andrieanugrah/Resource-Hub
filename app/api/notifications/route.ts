import { NextRequest, NextResponse } from "next/server";
import { readTable, writeTable } from "@/lib/db";
import { requireApiUser, requireCsrf } from "@/lib/auth";

export async function GET() {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  const notifications = await readTable("notifications");
  const mine = notifications
    .filter((n) => n.user_id === user.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20);

  return NextResponse.json(mine);
}

// POST to mark as read — body: { ids?: string[], all?: true }
export async function POST(req: NextRequest) {
  const csrfErr = await requireCsrf(req);
  if (csrfErr) return csrfErr;
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  const body = await req.json().catch(() => ({}));

  const notifications = await readTable("notifications");
  const toMark = new Set(body.ids as string[] | undefined);

  for (const n of notifications) {
    if (n.user_id !== user.id) continue;
    if (body.all || toMark.has(n.id)) {
      n.read = true;
    }
  }

  await writeTable("notifications", notifications);
  return NextResponse.json({ ok: true });
}
