import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroySession, requireCsrf, getCurrentUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const csrfErr = await requireCsrf(req);
  if (csrfErr) return csrfErr;
  const jar = await cookies();
  const token = jar.get("rh_session")?.value;
  if (token) {
    const user = await getCurrentUser();
    await destroySession(token);
    if (user) await writeAudit({ actorUserId: user.id, actionType: "auth.logout", entityType: "session", entityId: token });
  }
  jar.delete("rh_session");
  return NextResponse.json({ ok: true });
}
