import type { Ticket } from "@/lib/types";

/**
 * Everyone who should get a reply: this ticket's original To and CC, plus, for every ticket merged into it,
 * that ticket's requester, To and CC. The requester is always emailed already, so it's left out.
 */
export function replyRecipients(ticket: Pick<Ticket, "requesterEmail" | "requesterTo" | "requesterCc">, merged: Pick<Ticket, "requesterEmail" | "requesterTo" | "requesterCc">[] = []) {
  const requester = ticket.requesterEmail.trim().toLowerCase();
  const all = [...ticket.requesterTo, ...ticket.requesterCc, ...merged.flatMap((item) => [item.requesterEmail, ...item.requesterTo, ...item.requesterCc])];
  return [...new Set(all.map((email) => (email ?? "").trim().toLowerCase()))].filter((email) => email.includes("@") && email !== requester);
}
