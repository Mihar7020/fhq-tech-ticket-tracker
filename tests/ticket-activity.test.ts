import { describe, expect, it } from "vitest";
import { dayLabel, describeAudit, formatWhen, replyState, splitQuoted } from "@/lib/ticket-activity";

const at = (iso: string) => new Date(iso);
const now = at("2026-10-08T20:00:00Z"); // Oct 8, 2:00 p.m. Regina

describe("dates in Regina time", () => {
  it("labels today, yesterday and older days", () => {
    expect(dayLabel(at("2026-10-08T15:00:00Z"), now)).toBe("Today");
    expect(dayLabel(at("2026-10-07T18:00:00Z"), now)).toBe("Yesterday");
    expect(dayLabel(at("2026-10-06T18:00:00Z"), now)).toBe("Oct 6");
    expect(formatWhen(at("2026-10-06T18:00:00Z"), now)).toMatch(/^Oct 6, 12:00/);
  });
});

describe("replyState", () => {
  const original = { id: "m1", direction: "INBOUND", sentAt: at("2026-10-06T18:00:00Z"), fromName: "Gord", fromAddress: "gord.lr@fhqtc.net" };
  const teamReply = { id: "m2", direction: "OUTBOUND", sentAt: at("2026-10-07T15:00:00Z"), fromName: "Joe", fromAddress: "x" };
  const gordReply = { id: "m3", direction: "INBOUND", sentAt: at("2026-10-08T16:00:00Z"), fromName: "Gord", fromAddress: "gord.lr@fhqtc.net" };
  const reopened = { action: "REOPENED_BY_REQUESTER_REPLY", createdAt: at("2026-10-08T16:00:01Z") };

  it("a brand-new ticket is not a 'new reply'", () => {
    expect(replyState([original], [], "NEW")).toEqual({ awaitingReply: false, reopenedBy: undefined });
  });
  it("flags a requester reply after the team's last reply", () => {
    expect(replyState([original, teamReply, gordReply], [], "IN_PROGRESS").awaitingReply).toBe(true);
  });
  it("shows who reopened it and links to their reply", () => {
    expect(replyState([original, teamReply, gordReply], [reopened], "NEW").reopenedBy).toMatchObject({ name: "Gord", replyId: "m3" });
  });
  it("clears both once the team replies again", () => {
    const answer = { ...teamReply, id: "m4", sentAt: at("2026-10-08T17:00:00Z") };
    expect(replyState([original, teamReply, gordReply, answer], [reopened], "NEW")).toEqual({ awaitingReply: false, reopenedBy: undefined });
  });
  it("never flags resolved or voided tickets", () => {
    expect(replyState([original, teamReply, gordReply], [reopened], "RESOLVED")).toEqual({ awaitingReply: false, reopenedBy: undefined });
  });
});

describe("describeAudit", () => {
  it("explains status, priority and assignment changes", () => {
    expect(describeAudit("TICKET_UPDATED", { status: "WAITING_ON_STAFF", priority: "NORMAL", assigneeId: null }, { status: "IN_PROGRESS", priority: "HIGH", assigneeId: "u1" }))
      .toEqual({ title: "Status: Waiting on requester → In progress", body: "Priority: Normal → High · Technician assigned" });
  });
  it("names merges and reopens", () => {
    expect(describeAudit("TICKET_MERGED", {}, { mergedInto: "FHQ-0045" }).title).toBe("Merged into FHQ-0045");
    expect(describeAudit("REOPENED_BY_REQUESTER_REPLY", {}, {}).title).toBe("Reopened by requester reply");
  });
});

describe("splitQuoted", () => {
  it("separates the new text from Outlook's quoted chain", () => {
    const text = "Thanks, that worked!\n\nGord\n\nFrom: Joe Gallenger <joe@fhqtc.net>\nSent: Tuesday, October 6, 2026 2:00 PM\nTo: Gord\nSubject: RE: MSS";
    expect(splitQuoted(text)).toEqual({ main: "Thanks, that worked!\n\nGord", quoted: "From: Joe Gallenger <joe@fhqtc.net>\nSent: Tuesday, October 6, 2026 2:00 PM\nTo: Gord\nSubject: RE: MSS" });
  });
  it("leaves emails without quotes alone", () => {
    expect(splitQuoted("Printer is jammed again.")).toEqual({ main: "Printer is jammed again.", quoted: "" });
  });
});
