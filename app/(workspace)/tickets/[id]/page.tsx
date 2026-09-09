import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TicketDetailView } from "@/components/ticket-detail-view";
import { getPendingRoutingSuggestion, getSites, getTechs, getTicket, getTickets } from "@/lib/ticket-data";
import { requireSession } from "@/lib/auth";
import { isActiveTicket } from "@/lib/ticket-status";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const result = await getTicket(id);
  return { title: result ? `${result.ticket.number} - ${result.ticket.subject}` : "Ticket not found" };
}

export default async function TicketPage({ params }: Props) {
  const { id } = await params;
  const [result, sites, techs, allTickets, session] = await Promise.all([getTicket(id), getSites(), getTechs(), getTickets(), requireSession()]);
  if (!result) notFound();
  const pendingRoutingSuggestion = await getPendingRoutingSuggestion(result.ticket.id);
  return <TicketDetailView initialTicket={result.ticket} initialTimeline={result.timeline} sites={sites} techs={techs} mergeCandidates={allTickets.filter((ticket) => ticket.id !== result.ticket.id && isActiveTicket(ticket))} currentUserEmail={session.email} pendingRoutingSuggestion={pendingRoutingSuggestion?.site ? { id: pendingRoutingSuggestion.id, site: pendingRoutingSuggestion.site } : null} />;
}
