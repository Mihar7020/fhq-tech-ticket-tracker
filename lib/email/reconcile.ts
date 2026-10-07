import { getMessageMime, listInboxMessagesSince } from "@/lib/email/graph";
import { ingestMime, type IngestRepository } from "@/lib/email/ingest";
import { prismaIngestRepository } from "@/lib/email/prisma-repository";

export type MailReconciliationResult = {
  hours: number;
  checked: number;
  created: number;
  updated: number;
  duplicate: number;
  ignored: number;
  failed: number;
};

type ReconciliationDependencies = {
  listMessages: typeof listInboxMessagesSince;
  getMime: typeof getMessageMime;
  ingest: typeof ingestMime;
  repository: IngestRepository;
};

const defaultDependencies: ReconciliationDependencies = {
  listMessages: listInboxMessagesSince,
  getMime: getMessageMime,
  ingest: ingestMime,
  repository: prismaIngestRepository,
};

export async function reconcileInbox(
  hours = 48,
  dependencies: ReconciliationDependencies = defaultDependencies,
): Promise<MailReconciliationResult> {
  const safeHours = Math.min(Math.max(Math.trunc(hours), 1), 168);
  const since = new Date(Date.now() - safeHours * 60 * 60 * 1000);
  const messages = await dependencies.listMessages(since);
  const result: MailReconciliationResult = {
    hours: safeHours,
    checked: messages.length,
    created: 0,
    updated: 0,
    duplicate: 0,
    ignored: 0,
    failed: 0,
  };

  for (const message of messages) {
    try {
      const mime = await dependencies.getMime(message.id);
      const outcome = await dependencies.ingest(mime, dependencies.repository);
      result[outcome.kind] += 1;
      console.log("[mail-reconciliation] message processed", {
        graphMessageId: message.id,
        receivedDateTime: message.receivedDateTime,
        outcome: outcome.kind,
        ticketId: outcome.ticketId,
      });
    } catch (error) {
      result.failed += 1;
      console.error("[mail-reconciliation] message failed", {
        graphMessageId: message.id,
        receivedDateTime: message.receivedDateTime,
        error,
      });
    }
  }

  console.log("[mail-reconciliation] completed", result);
  return result;
}
