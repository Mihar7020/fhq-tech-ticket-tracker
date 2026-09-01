import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TicketDetailView } from "@/components/ticket-detail-view";
import { tickets } from "@/lib/demo-data";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const ticket = tickets.find((item) => item.id === id);
  return { title: ticket ? `${ticket.number} - ${ticket.subject}` : "Ticket not found" };
}

export default async function TicketPage({ params }: Props) {
  const { id } = await params;
  const ticket = tickets.find((item) => item.id === id);
  if (!ticket) notFound();
  return <TicketDetailView initialTicket={ticket} />;
}
