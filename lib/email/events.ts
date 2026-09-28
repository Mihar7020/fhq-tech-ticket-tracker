import { db } from "@/lib/db";

export type IngestionSource = "webhook" | "sync" | "lifecycle" | "cron";

const truncate = (value: string | undefined, max: number) => value?.slice(0, max);

/** Writes an audit row for every mailbox event. Never throws: logging must not break intake. */
export async function recordIngestionEvent(event: { source: IngestionSource; outcome: string; graphMessageId?: string; internetMessageId?: string; reason?: string; error?: unknown; ticketId?: string; publicId?: string }) {
  try {
    await db.mailIngestionEvent.create({
      data: {
        source: event.source,
        outcome: truncate(event.outcome, 100)!,
        graphMessageId: truncate(event.graphMessageId, 1000),
        internetMessageId: truncate(event.internetMessageId, 1000),
        reason: truncate(event.reason, 1000),
        error: event.error === undefined ? undefined : (event.error instanceof Error ? event.error.message : String(event.error)).slice(0, 2000),
        ticketId: truncate(event.ticketId, 200),
        publicId: truncate(event.publicId, 100),
      },
    });
  } catch (error) {
    console.error("Could not record mail ingestion event", { event, error });
  }
}
