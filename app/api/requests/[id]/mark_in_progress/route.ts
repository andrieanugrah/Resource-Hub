import { NextRequest } from "next/server";
import { handleRequestTransition } from "@/lib/request-transitions";
import { can } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRequestTransition(req, params, {
    fromStatus: "approved",
    toStatus: "in_progress",
    actionType: "request.in_progress",
    validate: (request, user) => {
      if (request.requester_id === user.id) return null;
      if (can(user.role, "asset.assign")) return null;
      return "Only the requester or an asset manager can mark this request in progress.";
    },
    notifyRequester: {
      title: "Request In Progress",
      message: "Your request is now being worked on.",
    },
  });
}
