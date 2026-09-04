import type { Ticket, TicketStatus } from "@/lib/types";

export function isActiveTicketStatus(status: TicketStatus) {
  return status !== "Resolved" && status !== "Voided";
}

export function isActiveTicket(ticket: Pick<Ticket, "status">) {
  return isActiveTicketStatus(ticket.status);
}
