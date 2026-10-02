import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/db", () => ({ db: {} }));

describe("visibleRecipients", () => {
  it("hides helpdesk addresses, lowercases and dedupes", async () => {
    vi.stubEnv("GRAPH_MAILBOX", "fhq.helpdesk@fhqtc.net");
    const { visibleRecipients } = await import("@/lib/ticket-data");
    expect(visibleRecipients(["FHQTCTech@fhqtc.net", "John.Doe@fhqtc.net", "fhq.helpdesk@fhqtc.net", "john.doe@fhqtc.net"])).toEqual(["john.doe@fhqtc.net"]);
    expect(visibleRecipients(null)).toEqual([]);
  });
});
