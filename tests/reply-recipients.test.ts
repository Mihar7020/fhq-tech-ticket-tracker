import { describe, expect, it } from "vitest";
import { replyRecipients } from "@/lib/reply-recipients";

const ticket = { requesterEmail: "Gord.LR@fhqtc.net", requesterTo: ["lee-anne.kehler@fhqtc.net"], requesterCc: ["joy.sapp@fhqtc.net", "GORD.LR@fhqtc.net"] };

describe("replyRecipients", () => {
  it("uses the original To and CC, without the requester", () => {
    expect(replyRecipients(ticket)).toEqual(["lee-anne.kehler@fhqtc.net", "joy.sapp@fhqtc.net"]);
  });
  it("adds each merged ticket's requester, To and CC, once each", () => {
    const merged = { requesterEmail: "Sierra.Poitras@fhqtc.net", requesterTo: [], requesterCc: ["Joy.Sapp@fhqtc.net", "kim.sadowsky@fhqtc.net"] };
    expect(replyRecipients(ticket, [merged])).toEqual(["lee-anne.kehler@fhqtc.net", "joy.sapp@fhqtc.net", "sierra.poitras@fhqtc.net", "kim.sadowsky@fhqtc.net"]);
  });
  it("never adds the requester even if a merged ticket was theirs", () => {
    const merged = { requesterEmail: "gord.lr@fhqtc.net", requesterTo: [], requesterCc: [] };
    expect(replyRecipients(ticket, [merged])).not.toContain("gord.lr@fhqtc.net");
  });
  it("skips blanks and non-addresses such as manual tickets without email", () => {
    expect(replyRecipients({ requesterEmail: "a@fhqtc.net", requesterTo: [""], requesterCc: [] }, [{ requesterEmail: "Unknown", requesterTo: [], requesterCc: [] }])).toEqual([]);
  });
});
