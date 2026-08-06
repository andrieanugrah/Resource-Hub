import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readTable, writeTable, newId, nowIso, type User } from "@/lib/db";
import { requireApiUser, can, requireCsrf } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { writeAudit } from "@/lib/audit";
import { userCreate, validate } from "@/lib/validate";

export async function GET() {
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  if (!can(user.role, "user.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await readTable("users");
  const safeUsers = users.map(({ password_hash: _h, password_salt: _s, ...rest }) => rest);
  return NextResponse.json(safeUsers);
}

export async function POST(req: NextRequest) {
  const csrfErr = await requireCsrf(req);
  if (csrfErr) return csrfErr;
  const user = await requireApiUser();
  if (user instanceof NextResponse) return user;
  if (!can(user.role, "user.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = validate(userCreate, body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const users = await readTable("users");
  if (users.some((u) => u.email.toLowerCase() === (body.email as string).toLowerCase())) {
    return NextResponse.json({ error: "Email already registered." }, { status: 409 });
  }

  const { hash, salt } = hashPassword(parsed.data.password);
  const now = nowIso();
  const newUser: User = {
    id: newId("usr"),
    name: parsed.data.name,
    email: parsed.data.email.toLowerCase(),
    password_hash: hash,
    password_salt: salt,
    role: parsed.data.role,
    department_id: parsed.data.department_id ?? null,
    job_title: parsed.data.job_title ?? null,
    status: "active",
    last_login_at: null,
    created_at: now,
    updated_at: now,
  };

  users.push(newUser);
  await writeTable("users", users);
  await writeAudit({ actorUserId: user.id, actionType: "user.create", entityType: "user", entityId: newUser.id, after: newUser });
  revalidatePath("/users");

  return NextResponse.json({ id: newUser.id }, { status: 201 });
}
