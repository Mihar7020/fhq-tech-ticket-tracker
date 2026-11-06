import type { Ticket } from "@/lib/types";

/** True when the requester is waiting on the IT team (a new reply, or a reply that reopened the ticket). */
export const needsReply = (ticket: Pick<Ticket, "awaitingReply" | "reopenedBy">) => Boolean(ticket.awaitingReply || ticket.reopenedBy);

/** Tickets waiting on a reply first, everything else after, each group keeping its existing order. */
export function repliesFirst<T extends Pick<Ticket, "awaitingReply" | "reopenedBy">>(tickets: T[]) {
  return [...tickets.filter(needsReply), ...tickets.filter((ticket) => !needsReply(ticket))];
}
