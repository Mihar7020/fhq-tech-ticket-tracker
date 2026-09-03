import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TicketDetailView } from "@/components/ticket-detail-view";
import { getSites, getTechs, getTicket, getTickets } from "@/lib/ticket-data";
import { requireSession } from "@/lib/auth";

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
  return <TicketDetailView initialTicket={result.ticket} initialTimeline={result.timeline} sites={sites} techs={techs} mergeCandidates={allTickets.filter((ticket) => ticket.id !== result.ticket.id && ticket.status !== "Resolved")} currentUserEmail={session.email} />;
}
