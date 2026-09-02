import { z } from "zod";
import { ensureInboxSubscription, renewInboxSubscription } from "@/lib/email/subscriptions";

const schema = z.object({ subscriptionId: z.string().min(1).optional() });
const isAuthorized = (request: Request) =>
  Boolean(process.env.CRON_SECRET) &&
  request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;

export async function GET(request: Request) {
  if (!isAuthorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  return Response.json(await ensureInboxSubscription());
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });
  const subscription = parsed.data.subscriptionId ? await renewInboxSubscription(parsed.data.subscriptionId) : await ensureInboxSubscription();
  return Response.json(subscription);
}
