import { z } from "zod";
import { recordIngestionEvent } from "@/lib/email/events";
import { ensureInboxSubscription, renewInboxSubscription } from "@/lib/email/subscriptions";
import { reconcileInbox } from "@/lib/email/sync";

export const maxDuration = 300;

const schema = z.object({ subscriptionId: z.string().min(1).optional(), hours: z.number().int().min(1).max(720).optional() });
const isAuthorized = (request: Request) => Boolean(process.env.CRON_SECRET) && request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;

// Runs from Vercel Cron (GET). Also safe to hit from an external scheduler every 5-15 minutes
// with the same Bearer header: both steps are idempotent.
async function run(hours?: number, subscriptionId?: string) {
  const report: { subscription?: unknown; sync?: unknown; errors: string[] } = { errors: [] };
  try {
    report.subscription = subscriptionId ? await renewInboxSubscription(subscriptionId) : await ensureInboxSubscription();
  } catch (error) {
    report.errors.push(`subscription: ${error instanceof Error ? error.message : String(error)}`);
    await recordIngestionEvent({ source: "cron", outcome: "subscription_failed", error });
  }
  try {
    const sync = await reconcileInbox({ hours: hours ?? 26, source: "sync" });
    report.sync = { since: sync.since, scanned: sync.scanned, alreadyStored: sync.alreadyStored, processed: sync.processed, tally: sync.tally };
  } catch (error) {
    report.errors.push(`sync: ${error instanceof Error ? error.message : String(error)}`);
    await recordIngestionEvent({ source: "cron", outcome: "sync_failed", error });
  }
  return Response.json(report, { status: report.errors.length ? 500 : 200 });
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const hours = Number(new URL(request.url).searchParams.get("hours") ?? "") || undefined;
  return run(hours && hours <= 720 ? hours : undefined);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });
  return run(parsed.data.hours, parsed.data.subscriptionId);
}
