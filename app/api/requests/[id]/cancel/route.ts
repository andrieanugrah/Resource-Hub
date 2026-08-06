import { NextRequest } from "next/server";
import { handleRequestTransition } from "@/lib/request-transitions";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRequestTransition(req, params, {
    fromStatus: ["draft", "pending_approval", "approved", "in_progress"],
    toStatus: "cancelled",
    actionType: "request.cancel",
    validate: (request, user) => {
      if (["completed", "rejected"].includes(request.status)) {
        return "Cannot cancel completed or rejected request.";
      }
      // Requester can always cancel; admin/super_admin can cancel any
      if (request.requester_id !== user.id && !["super_admin", "admin_it"].includes(user.role)) {
        return "Only the requester or an admin can cancel this request.";
      }
      return null;
    },
    notifyRequester: {
      title: "Request Cancelled",
      message: "Your request has been cancelled.",
    },
  });
}
