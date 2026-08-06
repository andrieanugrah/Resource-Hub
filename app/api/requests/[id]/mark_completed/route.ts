import { NextRequest } from "next/server";
import { handleRequestTransition } from "@/lib/request-transitions";
import { can } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRequestTransition(req, params, {
    fromStatus: "in_progress",
    toStatus: "completed",
    actionType: "request.completed",
    validate: (request, user) => {
      if (request.requester_id === user.id) return null;
      if (can(user.role, "asset.assign")) return null;
      return "Only the requester or an asset manager can mark this request completed.";
    },
    notifyRequester: {
      title: "Request Completed",
      message: "Your request has been completed.",
    },
  });
}
