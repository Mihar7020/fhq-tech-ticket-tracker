/**
 * Pure helpers for the ticket timeline and the "reopened / new reply" markers.
 * Display only: they read data that is already saved and never change it.
 */

const ZONE = "America/Regina";

const STATUS_LABEL: Record<string, string> = {
  NEW: "New", TRIAGE: "Triage", IN_PROGRESS: "In progress", WAITING_ON_STAFF: "Waiting on requester",
  WAITING_ON_IT: "Waiting on IT", RESOLVED: "Resolved", CLOSED: "Voided", MERGED: "Merged",
};
const PRIORITY_LABEL: Record<string, string> = { CRITICAL: "Critical", HIGH: "High", NORMAL: "Normal", LOW: "Low" };

const dayKey = (date: Date) => date.toLocaleDateString("en-CA", { timeZone: ZONE });

/** "Today", "Yesterday", "Oct 6" or "Oct 6, 2025": the heading a timeline entry is grouped under. */
export function dayLabel(date: Date, now = new Date()) {
  const key = dayKey(date);
  if (key === dayKey(now)) return "Today";
  if (key === dayKey(new Date(now.getTime() - 86_400_000))) return "Yesterday";
  const sameYear = date.toLocaleDateString("en-CA", { timeZone: ZONE, year: "numeric" }) === now.toLocaleDateString("en-CA", { timeZone: ZONE, year: "numeric" });
  return date.toLocaleDateString("en-CA", { timeZone: ZONE, month: "short", day: "numeric", year: sameYear ? undefined : "numeric" });
}

/** "Today, 2:14 p.m." / "Yesterday, 9:02 a.m." / "Oct 6, 12:00 p.m." in Regina time. */
export function formatWhen(date: Date, now = new Date()) {
  const time = date.toLocaleTimeString("en-CA", { timeZone: ZONE, hour: "numeric", minute: "2-digit" });
  return `${dayLabel(date, now)}, ${time}`;
}

type MessageLite = { id: string; direction: string; sentAt: Date; fromName?: string | null; fromAddress: string };
type AuditLite = { action: string; createdAt: Date };

/**
 * Whether the requester is waiting on the team, and whether their reply reopened the ticket.
 * Both clear as soon as a team member sends a public reply after it.
 */
export function replyState(messages: MessageLite[], audits: AuditLite[], status: string) {
  const ordered = [...messages].sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
  const lastOutbound = [...ordered].reverse().find((item) => item.direction === "OUTBOUND");
  const inboundReplies = ordered.slice(1).filter((item) => item.direction === "INBOUND");
  const lastInbound = inboundReplies[inboundReplies.length - 1];
  const finished = ["RESOLVED", "CLOSED", "MERGED"].includes(status);
  const unanswered = Boolean(lastInbound && (!lastOutbound || lastInbound.sentAt > lastOutbound.sentAt));
  const reopen = [...audits].reverse().find((item) => item.action === "REOPENED_BY_REQUESTER_REPLY");
  const reopenStillOpen = Boolean(reopen && !finished && (!lastOutbound || reopen.createdAt > lastOutbound.sentAt));
  return {
    awaitingReply: !finished && unanswered,
    reopenedBy: reopenStillOpen && reopen
      ? { name: lastInbound?.fromName || lastInbound?.fromAddress || "the requester", at: reopen.createdAt.toISOString(), replyId: lastInbound?.id }
      : undefined,
  };
}

const asRecord = (value: unknown) => (value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {});

/** A readable one-line title and detail for a system (audit) event. */
export function describeAudit(action: string, before: unknown, after: unknown): { title: string; body: string } {
  const b = asRecord(before); const a = asRecord(after);
  const note = typeof a.note === "string" ? a.note : "";
  switch (action) {
    case "REOPENED_BY_REQUESTER_REPLY": return { title: "Reopened by requester reply", body: note };
    case "REQUESTER_REPLIED": return { title: "Requester replied: back to In progress", body: "" };
    case "TICKET_MERGED": return { title: `Merged into ${a.mergedInto ?? "another ticket"}`, body: "" };
    case "TICKET_RECEIVED_MERGE": return { title: `${a.source ?? "A ticket"} was merged into this one`, body: "" };
    case "TICKET_VOIDED": return { title: "Ticket voided", body: "" };
    case "MANUAL_TICKET_CREATED": return { title: "Ticket created manually", body: "" };
    case "EMAIL_WELDED": return { title: "Email added to this ticket", body: "" };
    case "OUTBOUND_REPLY_SENT": return { title: "Reply emailed", body: "" };
    case "TICKET_UPDATED": {
      const parts: string[] = [];
      if (typeof a.status === "string" && a.status !== b.status) parts.push(`Status: ${STATUS_LABEL[String(b.status)] ?? b.status ?? "?"} → ${STATUS_LABEL[a.status] ?? a.status}`);
      if (typeof a.priority === "string" && a.priority !== b.priority) parts.push(`Priority: ${PRIORITY_LABEL[String(b.priority)] ?? b.priority ?? "?"} → ${PRIORITY_LABEL[a.priority] ?? a.priority}`);
      if ("assigneeId" in a && a.assigneeId !== b.assigneeId) parts.push(a.assigneeId ? "Technician assigned" : "Technician unassigned");
      if ("siteId" in a) parts.push("School changed");
      if ("subject" in a || "category" in a || "affectedService" in a) parts.push("Details edited");
      return { title: parts[0] ?? "Ticket updated", body: parts.slice(1).join(" · ") };
    }
    default: {
      const words = action.replaceAll("_", " ").toLowerCase();
      return { title: words.charAt(0).toUpperCase() + words.slice(1), body: note };
    }
  }
}

/**
 * Splits an email into the new text and the quoted history below it
 * (Outlook's "From: ... Sent: ..." block, "-----Original Message-----", "On ... wrote:", or a rule line).
 */
export function splitQuoted(text: string) {
  const marker = /^(?:\s*From:\s.+\r?\n(?:.*\r?\n){0,3}?\s*(?:Sent|Date):\s.+|\s*-{2,}\s*Original Message\s*-{2,}.*|\s*On .{6,200} wrote:\s*|\s*_{8,}\s*)$/im;
  const match = marker.exec(text);
  if (!match || match.index < 20) return { main: text, quoted: "" };
  return { main: text.slice(0, match.index).replace(/\s+$/, ""), quoted: text.slice(match.index).replace(/^\s+/, "") };
}
