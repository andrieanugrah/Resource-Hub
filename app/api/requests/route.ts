import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readTable, writeTable, newId, nowIso, generateRequestCode, type AssetRequest } from "@/lib/db";
import { requireUser, can, requireCsrf } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { requestCreate, validate } from "@/lib/validate";

export async function GET() {
  const user = await requireUser();
  const reqs = await readTable("requests");
  const canViewAll = can(user.role, "request.approve") || can(user.role, "master.manage");
  const filtered = canViewAll ? reqs : reqs.filter((r) => r.requester_id === user.id);
  return NextResponse.json(filtered);
}

export async function POST(req: NextRequest) {
  const csrfErr = await requireCsrf(req);
  if (csrfErr) return csrfErr;
  const user = await requireUser();
  if (!can(user.role, "request.submit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = validate(requestCreate, body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { data } = parsed;

  // Validate asset_id for request types that reference an existing asset
  if (data.asset_id) {
    if (data.request_type === "new_asset") {
      return NextResponse.json(
        { error: "new_asset requests cannot reference an existing asset." },
        { status: 400 },
      );
    }
    const assets = await readTable("assets");
    const asset = assets.find((a) => a.id === data.asset_id && !a.deleted_at);
    if (!asset) return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }

  if (!data.asset_id && data.request_type !== "new_asset") {
    return NextResponse.json(
      { error: `${data.request_type} requests must reference an existing asset.` },
      { status: 400 },
    );
  }

  const reqs = await readTable("requests");
  const request: AssetRequest = {
    id: newId("req"),
    request_code: generateRequestCode(reqs),
    requester_id: user.id,
    request_type: data.request_type,
    asset_category_id: data.asset_category_id ?? null,
    asset_id: data.asset_id ?? null,
    title: data.title,
    description: data.description,
    priority: data.priority,
    status: "draft",
    reason: data.reason ?? "",
    required_date: data.required_date ?? null,
    department_asset: data.department_asset ?? false,
    approved_by: null,
    approved_at: null,
    rejected_reason: "",
    created_at: nowIso(),
    updated_at: nowIso(),
  };

  reqs.push(request);
  await writeTable("requests", reqs);
  await writeAudit({ actorUserId: user.id, actionType: "request.create", entityType: "request", entityId: request.id, after: request });
  revalidatePath("/requests");

  return NextResponse.json({ id: request.id }, { status: 201 });
}
