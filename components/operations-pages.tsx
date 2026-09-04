"use client";

import Link from "next/link";
import { BookOpen, Map, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/page-header";

function LaterCard({ icon: Icon, title, body }: { icon: typeof ShieldAlert; title: string; body: string }) {
  return <section className="card p-6"><span className="grid h-11 w-11 place-items-center rounded-lg bg-[var(--gold-soft)] gold"><Icon size={20} /></span><h2 className="display mt-5 text-2xl">{title}</h2><p className="muted mt-2 max-w-2xl leading-relaxed">{body}</p><Link href="/tickets" className="btn btn-primary mt-5">Open tickets</Link></section>;
}

export function IncidentsView() {
  return <div className="page-wrap"><PageHeader eyebrow="Incidents" title="No active incidents" description="Incident management is ready to be connected after the core ticket workflow is established." /><LaterCard icon={ShieldAlert} title="The board is clear" body="Real incidents will appear here when tickets are grouped together. No sample incidents or invented counts are shown." /></div>;
}

export function OperationsView() {
  return <div className="page-wrap"><PageHeader eyebrow="Parked for now" title="Travel planning is not active" description="The schools are far enough apart that a route planner is not useful for the first version." /><LaterCard icon={Map} title="Focus on the ticket workflow" body="For now, use the school board, ownership, comments, notes, and searchable ticket history." /></div>;
}

export function KnowledgeView() {
  return <div className="page-wrap"><PageHeader eyebrow="Later integration" title="Knowledge base" description="Resolved-ticket articles will be added after the core helpdesk workflow is proven." /><LaterCard icon={BookOpen} title="No sample articles" body="This area intentionally starts empty. Future articles will come from your team’s real resolutions." /></div>;
}
