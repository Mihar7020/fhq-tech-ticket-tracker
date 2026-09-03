import type { Metadata } from "next";
import { TicketListView } from "@/components/ticket-list-view";
import { getSites, getTechs, getTickets } from "@/lib/ticket-data";

export const metadata: Metadata = { title: "Live queue" };
export default async function TicketsPage() {
  const [tickets, sites, techs] = await Promise.all([getTickets(), getSites(), getTechs()]);
  return <TicketListView tickets={tickets} sites={sites} techs={techs} />;
}
