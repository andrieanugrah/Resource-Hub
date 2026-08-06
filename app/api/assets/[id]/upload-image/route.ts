import { NextRequest, NextResponse } from "next/server";
import { requireUser, can, requireCsrf } from "@/lib/auth";
import { readTable, writeTable } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import path from "node:path";
import fs from "node:fs/promises";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const csrfErr = await requireCsrf(req);
  if (csrfErr) return csrfErr;
  const user = await requireUser();
  if (!can(user.role, "asset.edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Only image files allowed" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "File size must be under 5MB" }, { status: 400 });

  const ext = path.extname(file.name) || ".png";
  const filename = `${id}-${Date.now()}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "assets");
  await fs.mkdir(dir, { recursive: true });
  const filepath = path.join(dir, filename);
  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filepath, bytes);

  const assets = await readTable("assets");
  const idx = assets.findIndex((a) => a.id === id && !a.deleted_at);
  if (idx < 0) return NextResponse.json({ error: "Asset not found" }, { status: 404 });

  const before = { ...assets[idx] };
  assets[idx].image_url = `/uploads/assets/${filename}`;
  await writeTable("assets", assets);
  await writeAudit({ actorUserId: user.id, actionType: "asset.upload_image", entityType: "asset", entityId: id, before, after: assets[idx] });

  return NextResponse.json({ url: `/uploads/assets/${filename}` });
}
