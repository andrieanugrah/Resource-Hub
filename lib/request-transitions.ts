import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { readTable, writeTable, nowIso, type AssetTransaction } from "@/lib/db";
import { requireUser, can, requireCsrf } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import type { AssetRequest, User, RequestStatus } from "@/lib/db";

export interface RequestTransition {
  /** The status(es) the request must currently be in */
  fromStatus: RequestStatus | RequestStatus[];
  /** The status to transition to */
  toStatus: RequestStatus;
  /** Optional permission required to perform this transition */
  permission?: string;
  /** Optional extra validation. Return an error string to block the transition. */
  validate?: (request: AssetRequest, user: User, body: Record<string, unknown>) => string | null;
  /** Optional mutation to run on the request before saving (e.g. set approved_by) */
  mutate?: (request: AssetRequest, user: User, body: Record<string, unknown>) => void;
  /** Audit action type (e.g. "request.approve") */
  actionType: string;
  /** Optional notification to send to the requester */
  notifyRequester?: { title: string; message: string };
}

/**
 * Generic handler for request status transitions.
 *
 * Each request action route (approve, reject, submit, cancel, etc.)
 * can call this with the appropriate transition definition.
 *
 * Usage in a route file:
 * ```ts
 * export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
 *   return handleRequestTransition(req, params, {
 *     fromStatus: "pending_approval",
 *     toStatus: "approved",
 *     permission: "request.approve",
 *     actionType: "request.approve",
 *     validate: (r, u) => r.requester_id === u.id ? "Cannot approve own request." : null,
 *     mutate: (r, u) => { r.approved_by = u.id; r.approved_at = nowIso(); },
 *   });
 * }
 * ```
 */
export async function handleRequestTransition(
  req: NextRequest,
  params: Promise<{ id: string }>,
  transition: RequestTransition,
): Promise<NextResponse> {
  const csrfErr = await requireCsrf(req);
  if (csrfErr) return csrfErr;
  const user = await requireUser();

  if (transition.permission && !can(user.role, transition.permission)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const reqs = await readTable("requests");
  const idx = reqs.findIndex((r) => r.id === id);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const request = reqs[idx];
  const allowedStatuses = Array.isArray(transition.fromStatus)
    ? transition.fromStatus
    : [transition.fromStatus];

  if (!allowedStatuses.includes(request.status)) {
    const expected = allowedStatuses.join(" or ");
    return NextResponse.json(
      { error: `Cannot transition from "${request.status}". Must be ${expected}.` },
      { status: 409 },
    );
  }

  // Custom validation
  if (transition.validate) {
    const err = transition.validate(request, user, body);
    if (err) return NextResponse.json({ error: err }, { status: 403 });
  }

  const before = { ...request };
  request.status = transition.toStatus;
  request.updated_at = nowIso();

  // Custom mutation
  if (transition.mutate) {
    transition.mutate(request, user, body);
  }

  reqs[idx] = request;
  await writeTable("requests", reqs);
  await writeAudit({
    actorUserId: user.id,
    actionType: transition.actionType,
    entityType: "request",
    entityId: id,
    before,
    after: request,
  });

  // Reserve asset on approve
  if (transition.toStatus === "approved" && request.asset_id) {
    const assets = await readTable("assets");
    const aIdx = assets.findIndex((a) => a.id === request.asset_id && !a.deleted_at);
    if (aIdx >= 0 && assets[aIdx].status === "available") {
      const abefore = { ...assets[aIdx] };
      assets[aIdx].status = "reserved";
      assets[aIdx].updated_by = user.id;
      assets[aIdx].updated_at = nowIso();
      await writeTable("assets", assets);
      await writeAudit({
        actorUserId: user.id, actionType: "asset.reserve", entityType: "asset", entityId: request.asset_id,
        before: abefore, after: assets[aIdx],
      });
      revalidatePath("/assets");
      revalidatePath(`/assets/${request.asset_id}`);
    }
  }

  // Revert reserved asset on cancel (except repair)
  if (transition.toStatus === "cancelled" && request.asset_id && request.request_type !== "repair") {
    const assets = await readTable("assets");
    const aIdx = assets.findIndex((a) => a.id === request.asset_id && !a.deleted_at);
    if (aIdx >= 0 && assets[aIdx].status === "reserved") {
      const abefore = { ...assets[aIdx] };
      assets[aIdx].status = "available";
      assets[aIdx].updated_by = user.id;
      assets[aIdx].updated_at = nowIso();
      await writeTable("assets", assets);
      await writeAudit({
        actorUserId: user.id, actionType: "asset.unreserve", entityType: "asset", entityId: request.asset_id,
        before: abefore, after: assets[aIdx],
      });
      revalidatePath("/assets");
      revalidatePath(`/assets/${request.asset_id}`);
    }
  }

  // Automated Asset State Synchronization on Request Completion
  if (transition.toStatus === "completed" && request.asset_id) {
    const assets = await readTable("assets");
    const aIdx = assets.findIndex((a) => a.id === request.asset_id);
    if (aIdx >= 0) {
      const asset = { ...assets[aIdx] };
      const oldUser = asset.assigned_user_id;
      const oldDept = asset.assigned_department_id;
      const now = nowIso();
      let transactionType: "assign" | "return" | "update" | null = null;

      if (request.request_type === "return") {
        asset.assigned_user_id = null;
        asset.assigned_department_id = null;
        asset.status = "available";
        asset.updated_by = user.id;
        asset.updated_at = now;
        transactionType = "return";
      } else if (
        request.request_type === "new_asset" ||
        request.request_type === "replacement" ||
        request.request_type === "temporary_loan"
      ) {
        // Guard: asset must be reserved, available, or already assigned
        if (!["reserved", "available", "assigned"].includes(asset.status)) {
          return NextResponse.json(
            { error: `Cannot complete: asset ${asset.asset_code} is "${asset.status}".` },
            { status: 409 },
          );
        }
        asset.assigned_department_id = null;
        if (request.department_asset) {
          const users = await readTable("users");
          const requester = users.find((u) => u.id === request.requester_id);
          asset.assigned_department_id = requester?.department_id ?? null;
          asset.assigned_user_id = null;
        } else {
          asset.assigned_user_id = request.requester_id;
        }
        asset.status = "assigned";
        asset.updated_by = user.id;
        asset.updated_at = now;
        transactionType = "assign";
      } else if (request.request_type === "repair") {
        asset.status = "in_repair";
        asset.updated_by = user.id;
        asset.updated_at = now;
        transactionType = "update";
      }

      if (transactionType) {
        assets[aIdx] = asset;
        const txs = await readTable("asset_transactions");
        txs.push({
          id: `txn_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
          asset_id: asset.id,
          transaction_type: transactionType,
          from_user_id: oldUser,
          to_user_id: asset.assigned_user_id,
          from_department_id: oldDept,
          to_department_id: asset.assigned_department_id,
          from_location_id: asset.location_id,
          to_location_id: asset.location_id,
          condition_before: asset.condition,
          condition_after: asset.condition,
          notes: `Request completed (${request.request_code}): ${request.title}`,
          created_by: user.id,
          created_at: now,
        });

        await writeTable("assets", assets);
        await writeTable("asset_transactions", txs);
        revalidatePath("/assets");
        revalidatePath(`/assets/${asset.id}`);
      }
    }
  }

  revalidatePath("/requests");
  revalidatePath(`/requests/${id}`);

  // Notify requester on status changes (approve/reject/in-progress/completed)
  if (transition.notifyRequester) {
    await createNotification({
      userId: request.requester_id,
      title: transition.notifyRequester.title,
      message: transition.notifyRequester.message,
      type: "request",
      link: `/requests/${id}`,
    });
  }

  // Notify managers on submission
  if (transition.toStatus === "pending_approval") {
    const users = await readTable("users");
    const managers = users.filter((u) => u.role === "manager" || u.role === "super_admin");
    for (const m of managers) {
      await createNotification({
        userId: m.id,
        title: "Request Submitted",
        message: `${user.name} submitted "${request.title}" — needs approval.`,
        type: "request",
        link: `/requests/${id}`,
      });
    }
  }

  return NextResponse.json(request);
}


