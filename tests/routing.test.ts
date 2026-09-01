import { describe, expect, it } from "vitest";
import { resolveRoute } from "@/lib/routing";
import { people, sites } from "@/lib/demo-data";

describe("routing resolution", () => {
  it("applies an exact email alias with stable person and site", () => { const result = resolveRoute({ senderEmail: " TWHITEHORSE@FHQTC.NET ", people, sites }); expect(result.outcome).toBe("exact"); expect(result.personId).toBe("p1"); expect(result.siteId).toBe("sb"); });
  it("uses a unique site domain as a strong site signal", () => { const result = resolveRoute({ senderEmail: "new.teacher@okanese.edu", people, sites }); expect(result.outcome).toBe("domain"); expect(result.siteId).toBe("olc"); });
  it("offers fuzzy name matching as a suggestion only", () => { const result = resolveRoute({ senderEmail: "unknown@gmail.com", displayName: "Tara Whitehorse", people, sites }); expect(result.outcome).toBe("suggested"); expect(result.personId).toBe("p1"); expect(result.confidence).toBeLessThan(.8); });
  it("flags conflicting directory and body site signals", () => { const result = resolveRoute({ senderEmail: "tara.whitehorse@standingbuffalo.edu", body: "I am at Okanese Learning Centre today.", people, sites }); expect(result.outcome).toBe("conflict"); expect(result.signals.length).toBeGreaterThan(1); });
  it("keeps unknown senders unrouted", () => { const result = resolveRoute({ senderEmail: "vendor@example.com", body: "The thing is broken", people, sites }); expect(result.outcome).toBe("unknown"); expect(result.siteId).toBeUndefined(); });
  it("rejects an address attached to two people", () => { const duplicate = { ...people[1], id: "dup", email: people[0].email }; const result = resolveRoute({ senderEmail: people[0].email, people: [...people, duplicate], sites }); expect(result.outcome).toBe("conflict"); });
});
