import { describe, expect, it } from "vitest";
import { createMemoryRepository, ingestMime } from "@/lib/email/ingest";
import { people, sites } from "@/lib/demo-data";

const mime = (overrides: { from?: string; id?: string; subject?: string; headers?: string; body?: string } = {}) => Buffer.from(`From: ${overrides.from ?? "Tara Whitehorse <tara.whitehorse@standingbuffalo.edu>"}\r\nTo: fhqtctech@example.org\r\nMessage-ID: ${overrides.id ?? "<msg-1@example.org>"}\r\nSubject: ${overrides.subject ?? "Projector no signal"}\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\n${overrides.headers ?? ""}\r\n${overrides.body ?? "The projector in room 204 says no signal. Please help before 10:40 AM."}`);

describe("ingest pipeline", () => {
  it("routes, digests, triages, and preserves a clean email", async () => { const repo = createMemoryRepository({ people, sites }); const result = await ingestMime(mime(), repo); expect(result.kind).toBe("created"); expect(repo.records[0].route.outcome).toBe("exact"); expect(repo.records[0].digest.room).toBe("204"); expect(repo.records[0].triage.category).toBe("AV & displays"); });
  it("detects duplicate Message-IDs", async () => { const repo = createMemoryRepository({ people, sites, messages: [{ messageId: "<msg-1@example.org>", threadId: "t1", subject: "Projector no signal" }] }); expect((await ingestMime(mime(), repo)).kind).toBe("duplicate"); });
  it("ignores out-of-office loops", async () => { const repo = createMemoryRepository({ people, sites }); const result = await ingestMime(mime({ id: "<auto>", headers: "Auto-Submitted: auto-replied\r\n", body: "I am away" }), repo); expect(result.kind).toBe("ignored"); });
  it("handles empty bodies without inventing a digest", async () => { const repo = createMemoryRepository({ people, sites }); await ingestMime(mime({ id: "<empty>", body: "" }), repo); expect(repo.records[0].digest.available).toBe(false); });
  it("keeps forwarded affected-person language visible", async () => { const repo = createMemoryRepository({ people, sites }); await ingestMime(mime({ id: "<fwd>", subject: "Fwd: student complaint", body: "Forwarded message: Jonas Buffalo at Muscowpetung School says the Wi-Fi is offline for 30 students." }), repo); expect(repo.records[0].route.outcome).toBe("conflict"); expect(repo.records[0].digest.affectedCount).toBe(30); });
});
