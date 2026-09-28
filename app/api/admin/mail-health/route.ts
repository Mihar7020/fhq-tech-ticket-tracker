import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureInboxSubscription, listInboxSubscriptions } from "@/lib/email/subscriptions";
import { reconcileInbox } from "@/lib/email/sync";

export const maxDuration = 300;

const requireStaff = async () => {
  const session = await getSession();
  return session && session.role !== "READ_ONLY" ? session : null;
};

/** Mail pipeline health: subscription state, config gaps, and the last 50 ingestion events. */
export async function GET() {
  if (!(await requireStaff())) return Response.json({ error: "forbidden" }, { status: 403 });
  const config = {
    GRAPH_MAILBOX: Boolean(process.env.GRAPH_MAILBOX),
    GRAPH_WEBHOOK_SECRET: Boolean(process.env.GRAPH_WEBHOOK_SECRET),
    CRON_SECRET: Boolean(process.env.CRON_SECRET),
    APP_URL: process.env.APP_URL ?? null,
    graphCredentials: Boolean((process.env.GRAPH_TENANT_ID || process.env.MICROSOFT_TENANT_ID) && (process.env.GRAPH_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID) && (process.env.GRAPH_CLIENT_SECRET || process.env.MICROSOFT_CLIENT_SECRET)),
  };
  let subscriptions: unknown = null; let subscriptionError: string | null = null;
  try {
    const list = await listInboxSubscriptions();
    subscriptions = list.map((s) => ({ id: s.id, notificationUrl: s.notificationUrl, expirationDateTime: s.expirationDateTime, hoursLeft: Math.round((new Date(s.expirationDateTime).getTime() - Date.now()) / 36e5) }));
  } catch (error) { subscriptionError = error instanceof Error ? error.message : String(error); }
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [recent, counts, lastCreated] = await Promise.all([
    db.mailIngestionEvent.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    db.mailIngestionEvent.groupBy({ by: ["outcome"], where: { createdAt: { gte: since24h } }, _count: { _all: true } }),
    db.mailIngestionEvent.findFirst({ where: { outcome: "created" }, orderBy: { createdAt: "desc" }, select: { createdAt: true, publicId: true } }),
  ]);
  return Response.json({ config, subscriptions, subscriptionError, last24h: Object.fromEntries(counts.map((row) => [row.outcome, row._count._all])), lastTicketCreated: lastCreated, recent });
}

const actionSchema = z.object({ action: z.enum(["resubscribe", "sync"]), hours: z.number().int().min(1).max(720).optional() });

/** { "action": "sync", "hours": 336 } backfills the last 14 days; { "action": "resubscribe" } repairs the subscription. */
export async function POST(request: Request) {
  if (!(await requireStaff())) return Response.json({ error: "forbidden" }, { status: 403 });
  const parsed = actionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });
  if (parsed.data.action === "resubscribe") return Response.json(await ensureInboxSubscription());
  return Response.json(await reconcileInbox({ hours: parsed.data.hours ?? 72, source: "sync" }));
}
