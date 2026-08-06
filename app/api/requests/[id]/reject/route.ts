import { NextRequest } from "next/server";
import { handleRequestTransition } from "@/lib/request-transitions";
import { nowIso } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRequestTransition(req, params, {
    fromStatus: "pending_approval",
    toStatus: "rejected",
    permission: "request.approve",
    actionType: "request.reject",
    validate: (_request, user, body) => {
      if (!body.reason) return "Rejection reason required.";
      return null;
    },
    mutate: (request, user, body) => {
      request.rejected_reason = body.reason as string;
      request.approved_by = user.id;
      request.approved_at = nowIso();
    },
    notifyRequester: {
      title: "Request Rejected",
      message: "Your request was rejected. Check details for more information.",
    },
  });
}
