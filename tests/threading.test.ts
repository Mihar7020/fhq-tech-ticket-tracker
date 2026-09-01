import { describe, expect, it } from "vitest";
import { isAutomatedMessage, matchThread, normalizeSubject } from "@/lib/threading";
import { stripQuotedReply } from "@/lib/security";

describe("email threading and loop protection", () => {
  it("matches In-Reply-To before subject", () => { const result = matchThread({ messageId: "<new>", inReplyTo: "<old>", subject: "Different" }, [{ messageId: "<old>", threadId: "t1", subject: "Projector" }]); expect(result.kind).toBe("match"); });
  it("deduplicates Message-ID", () => { expect(matchThread({ messageId: "<old>", subject: "anything" }, [{ messageId: "<old>", threadId: "t1", subject: "x" }]).kind).toBe("duplicate"); });
  it("only marks a subject match as a candidate", () => { expect(matchThread({ messageId: "<new>", subject: "Re: [FHQ-1048] Projector" }, [{ messageId: "<old>", threadId: "t1", subject: "Projector" }]).kind).toBe("candidate"); expect(normalizeSubject("Fwd: Re: [FHQ-1048] Projector")).toBe("projector"); });
  it("blocks out-of-office and daemon loops", () => { expect(isAutomatedMessage({ "auto-submitted": "auto-replied" }, "teacher@example.org")).toBe(true); expect(isAutomatedMessage({}, "mailer-daemon@example.org")).toBe(true); });
  it("strips forty quoting levels without recursion", () => { const quoted = `New answer\n${Array.from({ length: 40 }, (_, index) => `${">".repeat(index + 1)} old`).join("\n")}`; expect(stripQuotedReply(quoted)).toBe("New answer"); });
});
