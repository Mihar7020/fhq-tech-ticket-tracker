import { z } from "zod";
import { after } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { processGraphMessage } from "@/lib/email/process";
import { recordIngestionEvent } from "@/lib/email/events";
import { ensureInboxSubscription, reauthorizeSubscription } from "@/lib/email/subscriptions";
import { reconcileInbox } from "@/lib/email/sync";
import { rateLimit } from "@/lib/rate-limit";

export const maxDuration = 300;

// Graph sends two shapes to this URL: change notifications (new mail) and lifecycle
// notifications (reauthorizationRequired / subscriptionRemoved / missed). The old schema only
// accepted the first shape, so every lifecycle event got a 400 and was silently dropped, which
// is how a subscription can quietly die.
const changeNotification = z.object({ subscriptionId: z.string().optional(), clientState: z.string().optional(), resourceData: z.object({ id: z.string().min(1) }).passthrough() }).passthrough();
const lifecycleNotification = z.object({ subscriptionId: z.string().min(1), clientState: z.string().optional(), lifecycleEvent: z.enum(["reauthorizationRequired", "subscriptionRemoved", "missed"]) }).passthrough();
const payloadSchema = z.object({ value: z.array(z.union([lifecycleNotification, changeNotification])).max(1000) });

const safeEqual = (a: string | undefined, b: string) => {
  if (!a) return false;
  const left = Buffer.from(a); const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

export async function POST(request: Request) {
  const validationToken = new URL(request.url).searchParams.get("validationToken");
  if (validationToken) return new Response(validationToken, { status: 200, headers: { "Content-Type": "text/plain" } });

  const limiter = rateLimit("graph-webhook", 600, 60_000);
  if (!limiter.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(Math.ceil((limiter.retryAfterMs ?? 1000) / 1000)) } });

  const secret = process.env.GRAPH_WEBHOOK_SECRET;
  if (!secret) {
    console.error("GRAPH_WEBHOOK_SECRET is not set; rejecting Graph notification.");
    return Response.json({ error: "not_configured" }, { status: 503 });
  }
  const parsed = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    console.error("Unrecognised Graph notification payload", { issues: parsed.error.issues.slice(0, 5) });
    return Response.json({ error: "invalid_notification" }, { status: 400 });
  }

  const trusted = parsed.data.value.filter((item) => safeEqual(item.clientState, secret));
  if (trusted.length === 0) return Response.json({ error: "invalid_client_state" }, { status: 401 });

  const lifecycle = trusted.filter((item): item is z.infer<typeof lifecycleNotification> => "lifecycleEvent" in item);
  const messageIds = [...new Set(trusted.filter((item): item is z.infer<typeof changeNotification> => "resourceData" in item).map((item) => item.resourceData.id))];

  // Graph needs a 2xx within ~3 seconds, so all real work happens after the response.
  after(async () => {
    for (const event of lifecycle) {
      try {
        if (event.lifecycleEvent === "reauthorizationRequired") await reauthorizeSubscription(event.subscriptionId);
        if (event.lifecycleEvent === "subscriptionRemoved") await ensureInboxSubscription();
        if (event.lifecycleEvent === "missed") await reconcileInbox({ hours: 6, source: "lifecycle" });
        await recordIngestionEvent({ source: "lifecycle", outcome: event.lifecycleEvent, reason: `Handled for subscription ${event.subscriptionId}` });
      } catch (error) {
        await recordIngestionEvent({ source: "lifecycle", outcome: "failed", reason: event.lifecycleEvent, error });
      }
    }
    // Sequential on purpose: two replies in the same conversation must not race to create two tickets.
    for (const messageId of messageIds) await processGraphMessage(messageId, "webhook");
  });

  return Response.json({ accepted: messageIds.length, lifecycle: lifecycle.length }, { status: 202 });
}

export function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("validationToken");
  return token ? new Response(token, { headers: { "Content-Type": "text/plain" } }) : Response.json({ service: "fhq-graph-webhook", status: "ready" });
}
