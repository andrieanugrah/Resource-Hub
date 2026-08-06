import { NextResponse } from "next/server";
import { readTable } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const user = await requireUser();
  const [categories, locations, departments, users] = await Promise.all([
    readTable("categories"),
    readTable("locations"),
    readTable("departments"),
    readTable("users"),
  ]);
  const safeUsers = users
    .filter((u) => u.status === "active")
    .map(({ password_hash: _h, password_salt: _s, ...rest }) => rest);

  return NextResponse.json({
    current_user: { id: user.id, role: user.role, name: user.name, email: user.email },
    categories: categories.filter((c) => c.status === "active"),
    locations,
    departments: departments.filter((d) => d.status === "active"),
    users: safeUsers,
  });
}
