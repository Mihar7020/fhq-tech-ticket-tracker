import Link from "next/link";
import { ArrowLeft, Clock3, TrendingUp, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { TicketRow } from "@/components/ticket-row";
import { siteMetrics, tickets } from "@/lib/demo-data";
import type { Site } from "@/lib/types";

export function SiteDetailView({ site }: { site: Site }) {
  const metric = siteMetrics.find((item) => item.id === site.id)!;
  const siteTickets = tickets.filter((ticket) => ticket.siteId === site.id);

  return (
    <div className="page-wrap">
      <Link href="/board" className="muted mb-5 inline-flex items-center gap-2 text-xs font-bold"><ArrowLeft size={14} /> School board</Link>
      <PageHeader
        eyebrow={`${site.code} - ${site.timezone}`}
        title={site.name}
        description={`${site.address}. Primary coverage: ${site.primaryTech}. Bell schedule: ${site.bellSchedule}.`}
        actions={<Link href="/tickets/new" className="btn btn-primary">New request</Link>}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5" style={{ borderTop: `3px solid ${site.color}` }}><p className="label">Open now</p><p className="display mt-4 text-4xl">{metric.open}</p><p className="muted mt-1 text-[10px]">{metric.atRisk} at risk</p></div>
        <div className="card p-5"><p className="label">Median resolution</p><p className="display mt-4 text-4xl">{metric.median}m</p><p className="muted mt-1 text-[10px]">Across the last 30 days</p></div>
        <div className="card p-5"><p className="label">Weekly movement</p><p className={`display mt-4 text-4xl ${metric.trend > 10 ? "danger" : "text-[var(--green)]"}`}>{metric.trend > 0 ? "+" : ""}{metric.trend}%</p><p className="muted mt-1 text-[10px]">Compared with prior week</p></div>
        <div className="card p-5"><p className="label">Frequent requester</p><p className="mt-4 text-lg font-bold">Tara Whitehorse</p><p className="muted mt-1 text-[10px]">4 requests - Room 204</p></div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <section className="card overflow-hidden">
          <div className="border-b divider p-5"><p className="label">Current work</p><h2 className="display mt-1 text-2xl">Tickets at {site.code}</h2></div>
          {siteTickets.length ? siteTickets.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} compact />) : <div className="p-12 text-center"><p className="display text-2xl">This school is clear.</p></div>}
        </section>
        <section className="card p-5">
          <p className="label">Recurring at this school</p>
          <h2 className="display mt-1 text-2xl">Pattern watch</h2>
          <div className="mt-5 space-y-4">
            {[
              { issue: "Projector signal path", count: 7, icon: TrendingUp },
              { issue: "Chromebook charging", count: 5, icon: Clock3 },
              { issue: "Account lockout", count: 3, icon: Users },
            ].map((item) => {
              const Icon = item.icon;
              return <div className="flex items-center gap-3" key={item.issue}><span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--ink-3)] gold"><Icon size={15} /></span><div className="flex-1"><strong className="text-xs">{item.issue}</strong><p className="muted text-[10px]">{item.count} times in 90 days</p></div><span className="display text-2xl">{item.count}</span></div>;
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
