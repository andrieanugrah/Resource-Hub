import { NextRequest } from "next/server";
import { handleRequestTransition } from "@/lib/request-transitions";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRequestTransition(req, params, {
    fromStatus: "draft",
    toStatus: "pending_approval",
    actionType: "request.submit",
    validate: (request, user) =>
      request.requester_id !== user.id ? "Only the requester can submit their own request." : null,
  });
}
