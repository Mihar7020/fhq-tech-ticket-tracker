import Link from "next/link";
import { ArrowLeft, Clock3, TrendingUp, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SchoolTicketPrintList } from "@/components/school-ticket-print-list";
import { isActiveTicket } from "@/lib/ticket-status";
import type { Site, Ticket } from "@/lib/types";

export function SiteDetailView({ site, tickets }: { site: Site; tickets: Ticket[] }) {
  const recordedTickets = tickets.filter((ticket) => ticket.status !== "Voided");
  const openTickets = tickets.filter(isActiveTicket);
  const siteTickets = openTickets;
  const metric = { open: openTickets.length, atRisk: openTickets.filter((ticket) => ticket.doomRisk >= 80).length, median: 0, trend: 0 };

  return (
    <div className="page-wrap">
      <Link href="/board" className="muted mb-5 inline-flex items-center gap-2 text-xs font-bold"><ArrowLeft size={14} /> School board</Link>
      <PageHeader
        eyebrow={`${site.code} - ${site.timezone}`}
        title={site.name}
        description={`${site.address}. Supported by the full FHQ Tech team.${site.bellSchedule ? ` Bell schedule: ${site.bellSchedule}.` : ""}`}
        actions={<Link href="/tickets/new" className="btn btn-primary">New request</Link>}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5" style={{ borderTop: `3px solid ${site.color}` }}><p className="label">Open now</p><p className="display mt-4 text-4xl">{metric.open}</p><p className="muted mt-1 text-[10px]">{metric.atRisk} at risk</p></div>
        <div className="card p-5"><p className="label">Median resolution</p><p className="display mt-4 text-4xl">{metric.median}m</p><p className="muted mt-1 text-[10px]">Across the last 30 days</p></div>
        <div className="card p-5"><p className="label">Weekly movement</p><p className={`display mt-4 text-4xl ${metric.trend > 10 ? "danger" : "text-[var(--green)]"}`}>{metric.trend > 0 ? "+" : ""}{metric.trend}%</p><p className="muted mt-1 text-[10px]">Compared with prior week</p></div>
        <div className="card p-5"><p className="label">Total requests</p><p className="display mt-4 text-4xl">{recordedTickets.length}</p><p className="muted mt-1 text-[10px]">Valid recorded tickets</p></div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <SchoolTicketPrintList site={site} tickets={siteTickets} />
        <section className="card p-5">
          <p className="label">Recurring at this school</p>
          <h2 className="display mt-1 text-2xl">Pattern watch</h2>
          <div className="mt-5 space-y-4">
            {Array.from(new Map(recordedTickets.filter((ticket) => ticket.category !== "Uncategorized").map((ticket) => [ticket.category, recordedTickets.filter((item) => item.category === ticket.category).length])).entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([issue, count], index) => {
              const icons = [TrendingUp, Clock3, Users]; const item = { issue, count, icon: icons[index] };
              const Icon = item.icon;
              return <div className="flex items-center gap-3" key={item.issue}><span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--ink-3)] gold"><Icon size={15} /></span><div className="flex-1"><strong className="text-xs">{item.issue}</strong><p className="muted text-[10px]">{item.count} times in 90 days</p></div><span className="display text-2xl">{item.count}</span></div>;
            })}
            {!recordedTickets.length && <p className="muted text-sm">Patterns will appear after tickets are recorded.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
