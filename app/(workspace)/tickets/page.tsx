import type { Metadata } from "next";
import { TicketListView } from "@/components/ticket-list-view";
import { getSites, getTechs, getTickets } from "@/lib/ticket-data";
import { filtersFromParams } from "@/lib/ticket-filters";

export const metadata: Metadata = { title: "Live queue" };
export default async function TicketsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [tickets, sites, techs, params] = await Promise.all([getTickets(), getSites(), getTechs(), searchParams]);
  const initialFilters = filtersFromParams(params, sites);
  // Keyed by the filters so the list starts fresh when the address changes.
  return <TicketListView key={JSON.stringify(initialFilters)} tickets={tickets} sites={sites} techs={techs} initialFilters={initialFilters} />;
}
