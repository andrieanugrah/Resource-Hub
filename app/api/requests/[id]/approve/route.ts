import { NextRequest } from "next/server";
import { handleRequestTransition } from "@/lib/request-transitions";
import { nowIso } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRequestTransition(req, params, {
    fromStatus: "pending_approval",
    toStatus: "approved",
    permission: "request.approve",
    actionType: "request.approve",
    validate: (request, user) =>
      request.requester_id === user.id ? "Cannot approve own request." : null,
    mutate: (request, user) => {
      request.approved_by = user.id;
      request.approved_at = nowIso();
    },
    notifyRequester: {
      title: "Request Approved",
      message: "Your request has been approved and will be processed.",
    },
  });
}
