import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { sites } from "@/lib/demo-data";
import { SiteDetailView } from "@/components/site-detail-view";
type Props = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { id } = await params; const site = sites.find((item) => item.id === id); return { title: site?.name ?? "School not found" }; }
export default async function Page({ params }: Props) { const { id } = await params; const site = sites.find((item) => item.id === id); if (!site) notFound(); return <SiteDetailView site={site} />; }
