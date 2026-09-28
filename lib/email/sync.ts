import { db } from "@/lib/db";
import { listInboxMessagesSince } from "@/lib/email/graph";
import { processGraphMessage } from "@/lib/email/process";
import type { IngestionSource } from "@/lib/email/events";

/**
 * Safety net for anything the webhook missed (outage, expired subscription, dropped notification).
 * Lists recent Inbox mail and ingests every message whose Message-ID is not already stored.
 * Idempotent: running it repeatedly never duplicates tickets.
 */
export async function reconcileInbox(options: { hours?: number; source?: IngestionSource; limit?: number } = {}) {
  const hours = Math.min(Math.max(options.hours ?? 26, 1), 24 * 30);
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const inbox = await listInboxMessagesSince(since, options.limit ?? 500);
  const ids = inbox.map((message) => message.internetMessageId).filter((id): id is string => Boolean(id));
  const known = new Set((await db.message.findMany({ where: { internetMessageId: { in: ids } }, select: { internetMessageId: true } })).map((row) => row.internetMessageId));
  const missing = inbox.filter((message) => !message.internetMessageId || !known.has(message.internetMessageId)).reverse(); // oldest first keeps thread order

  const results: Array<{ graphMessageId: string; subject?: string; kind: string; publicId?: string; reason?: string }> = [];
  for (const message of missing) {
    const result = await processGraphMessage(message.id, options.source ?? "sync", { conversationId: message.conversationId, internetMessageId: message.internetMessageId });
    results.push({ graphMessageId: message.id, subject: message.subject, kind: result.kind, publicId: "publicId" in result ? result.publicId : undefined, reason: result.reason });
  }
  const tally = results.reduce<Record<string, number>>((acc, row) => ({ ...acc, [row.kind]: (acc[row.kind] ?? 0) + 1 }), {});
  return { since: since.toISOString(), scanned: inbox.length, alreadyStored: inbox.length - missing.length, processed: results.length, tally, results };
}
