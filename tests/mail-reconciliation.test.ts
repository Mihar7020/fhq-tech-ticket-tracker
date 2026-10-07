import { describe, expect, it, vi } from "vitest";
import { reconcileInbox } from "@/lib/email/reconcile";
import type { IngestRepository } from "@/lib/email/ingest";

const repository = {} as IngestRepository;

describe("mail reconciliation", () => {
  it("counts recovered, existing, ignored, and failed inbox messages", async () => {
    const ingest = vi.fn()
      .mockResolvedValueOnce({ kind: "created", ticketId: "ticket-1", publicId: "FHQ-0001" })
      .mockResolvedValueOnce({ kind: "duplicate", reason: "already ingested" })
      .mockResolvedValueOnce({ kind: "ignored", reason: "automated" });
    const result = await reconcileInbox(48, {
      listMessages: vi.fn().mockResolvedValue([
        { id: "graph-1" },
        { id: "graph-2" },
        { id: "graph-3" },
        { id: "graph-4" },
      ]),
      getMime: vi.fn(async (id: string) => {
        if (id === "graph-4") throw new Error("Graph unavailable");
        return Buffer.from(id);
      }),
      ingest,
      repository,
    });

    expect(result).toEqual({
      hours: 48,
      checked: 4,
      created: 1,
      updated: 0,
      duplicate: 1,
      ignored: 1,
      failed: 1,
    });
    expect(ingest).toHaveBeenCalledTimes(3);
  });

  it("uses a 48-hour lookback and reports an empty inbox", async () => {
    const listMessages = vi.fn().mockResolvedValue([]);
    const before = Date.now() - 48 * 60 * 60 * 1000;
    const result = await reconcileInbox(48, {
      listMessages,
      getMime: vi.fn(),
      ingest: vi.fn(),
      repository,
    });
    const since = listMessages.mock.calls[0][0] as Date;

    expect(since.getTime()).toBeGreaterThanOrEqual(before - 1_000);
    expect(result.checked).toBe(0);
    expect(result.failed).toBe(0);
  });
});
