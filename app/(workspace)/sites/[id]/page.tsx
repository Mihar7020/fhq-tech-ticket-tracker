import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteDetailView } from "@/components/site-detail-view";
import { getSites, getTickets } from "@/lib/ticket-data";
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { id } = await params; const sites = await getSites(); const site = sites.find((item) => item.id === id); return { title: site?.name ?? "School not found" }; }
export default async function Page({ params }: Props) { const { id } = await params; const [sites, tickets] = await Promise.all([getSites(), getTickets()]); const site = sites.find((item) => item.id === id); if (!site) notFound(); return <SiteDetailView site={site} tickets={tickets.filter((ticket) => ticket.siteId === id)} />; }
