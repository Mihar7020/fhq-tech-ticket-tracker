import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard-view";
import { getSites, getTechs, getTickets } from "@/lib/ticket-data";
import { isActiveTicket } from "@/lib/ticket-status";

export const metadata: Metadata = { title: "Dashboard" };
export default async function DashboardPage() {
  const [sites, techs, tickets] = await Promise.all([getSites(), getTechs(), getTickets()]);
  const siteMetrics = sites.map((site) => {
    const activeSiteTickets = tickets.filter((ticket) => ticket.siteId === site.id && isActiveTicket(ticket));
    return { ...site, open: activeSiteTickets.length, atRisk: activeSiteTickets.filter((ticket) => ticket.doomRisk >= 80).length, median: 0, trend: 0 };
  });
  return <DashboardView tickets={tickets} techs={techs} siteMetrics={siteMetrics} />;
}
