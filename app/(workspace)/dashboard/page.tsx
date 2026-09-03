import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard-view";
import { getSites, getTechs, getTickets } from "@/lib/ticket-data";

export const metadata: Metadata = { title: "Dashboard" };
export default async function DashboardPage() {
  const [sites, techs, tickets] = await Promise.all([getSites(), getTechs(), getTickets()]);
  const siteMetrics = sites.map((site) => ({ ...site, open: tickets.filter((ticket) => ticket.siteId === site.id && ticket.status !== "Resolved").length, atRisk: tickets.filter((ticket) => ticket.siteId === site.id && ticket.status !== "Resolved" && ticket.doomRisk >= 80).length, median: 0, trend: 0 }));
  return <DashboardView tickets={tickets} techs={techs} siteMetrics={siteMetrics} />;
}
