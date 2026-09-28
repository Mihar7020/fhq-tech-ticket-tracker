import { getMessageMetadata, getMessageMime } from "@/lib/email/graph";
import { ingestMime } from "@/lib/email/ingest";
import { prismaIngestRepository } from "@/lib/email/prisma-repository";
import { recordIngestionEvent, type IngestionSource } from "@/lib/email/events";

const isUniqueViolation = (error: unknown) => typeof error === "object" && error !== null && (error as { code?: unknown }).code === "P2002";

/**
 * Fetches one Graph message, ingests it, and records the outcome.
 * Metadata (conversationId) is best-effort: a failure there no longer drops the whole email.
 */
export async function processGraphMessage(messageId: string, source: IngestionSource, known?: { conversationId?: string; internetMessageId?: string }) {
  try {
    const [mime, fetchedMetadata] = await Promise.all([
      getMessageMime(messageId),
      getMessageMetadata(messageId).catch((error) => {
        console.warn("Graph metadata lookup failed; continuing without conversation ID", { messageId, error });
        return {} as { conversationId?: string; internetMessageId?: string };
      }),
    ]);
    const metadata = {
      conversationId: fetchedMetadata.conversationId ?? known?.conversationId,
      internetMessageId: fetchedMetadata.internetMessageId ?? known?.internetMessageId,
    };
    const result = await ingestMime(mime, prismaIngestRepository, { externalThreadId: metadata.conversationId });
    await recordIngestionEvent({ source, graphMessageId: messageId, internetMessageId: metadata.internetMessageId ?? known?.internetMessageId, outcome: result.kind, reason: result.reason, ticketId: result.ticketId, publicId: result.publicId });
    console.log("Graph message ingestion completed", { source, messageId, result });
    return result;
  } catch (error) {
    if (isUniqueViolation(error)) {
      // Graph delivered the same message twice concurrently; the other run already saved it.
      await recordIngestionEvent({ source, graphMessageId: messageId, outcome: "duplicate", reason: "Concurrent delivery of an already-saved message." });
      return { kind: "duplicate" as const, reason: "Concurrent duplicate delivery." };
    }
    await recordIngestionEvent({ source, graphMessageId: messageId, internetMessageId: known?.internetMessageId, outcome: "failed", error });
    console.error("Graph message ingestion failed", { source, messageId, error });
    return { kind: "failed" as const, reason: error instanceof Error ? error.message : String(error) };
  }
}
