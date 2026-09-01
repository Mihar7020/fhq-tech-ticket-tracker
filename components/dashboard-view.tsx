"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight, ClipboardList, Inbox, Map, Plus, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { TicketRow } from "@/components/ticket-row";
import { siteMetrics, techs, tickets } from "@/lib/demo-data";

const openTickets = tickets.filter((ticket) => ticket.status !== "Resolved");
const unassignedTickets = openTickets.filter((ticket) => !ticket.assignee);
const highPriorityTickets = openTickets.filter((ticket) => ticket.priority === "Critical" || ticket.priority === "High");

const summary = [
  { label: "Open tickets", value: openTickets.length, detail: "Across 6 schools", icon: Inbox },
  { label: "Unassigned", value: unassignedTickets.length, detail: "Ready to pick up", icon: UserCheck },
  { label: "High priority", value: highPriorityTickets.length, detail: "Critical or high", icon: ClipboardList },
  { label: "Schools", value: siteMetrics.length, detail: "FHQTC support sites", icon: Map },
];

export function DashboardView() {
  const nextTickets = useMemo(() => openTickets.slice(0, 6), []);

  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="FHQTC IT Helpdesk"
        title="Dashboard"
        description="A simple working view for tickets, school load, and technician ownership."
        actions={
          <>
            <Link href="/tickets/new" className="btn btn-primary"><Plus size={16} /> New request</Link>
            <Link href="/tickets" className="btn">Open queue <ArrowUpRight size={14} /></Link>
          </>
        }
      />

      <section aria-label="Queue summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="card p-4">
              <div className="mb-5 flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--gold-soft)] text-[var(--gold-bright)]"><Icon size={18} /></span>
              </div>
              <p className="display text-3xl leading-none">{item.value}</p>
              <div className="mt-3">
                <p className="font-semibold">{item.label}</p>
                <p className="muted mt-1 text-xs">{item.detail}</p>
              </div>
            </article>
          );
        })}
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,.8fr)]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b divider px-5 py-4">
            <div>
              <p className="label">Next up</p>
              <h2 className="display mt-1 text-xl">Open tickets</h2>
            </div>
            <Link href="/tickets/new" className="btn text-xs"><Plus size={14} /> New request</Link>
          </div>
          {nextTickets.length ? <div>{nextTickets.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} compact />)}</div> : (
            <div className="p-8 text-center">
              <h3 className="display text-xl">No open tickets</h3>
              <p className="muted mt-2 text-sm">The queue is clear.</p>
            </div>
          )}
        </section>

        <div className="grid gap-5">
          <section className="card p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="label">Team load</p>
                <h2 className="display mt-1 text-xl">Technicians</h2>
              </div>
              <UserCheck size={20} className="gold" />
            </div>
            <div className="space-y-4">
              {techs.map((tech) => (
                <div key={tech.id}>
                  <div className="mb-2 flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--gold)] text-[10px] font-black text-white">{tech.initials}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-xs">{tech.name}</strong>
                        <span className="muted text-[10px]">{tech.open}/{tech.capacity}</span>
                      </div>
                      <span className="muted text-[10px]">{tech.status} - {tech.sites.join(", ")}</span>
                    </div>
                  </div>
                  <div className="ml-11 h-1.5 overflow-hidden rounded-full bg-[var(--ink-3)]">
                    <div className="h-full rounded-full bg-[var(--gold)]" style={{ width: `${(tech.open / tech.capacity) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="label">Schools</p>
                <h2 className="display mt-1 text-xl">Open by site</h2>
              </div>
              <Link href="/board" className="text-xs font-bold gold">View all</Link>
            </div>
            <div className="space-y-2">
              {siteMetrics.map((site) => (
                <Link href={`/sites/${site.id}`} key={site.id} className="flex items-center justify-between rounded-lg border divider bg-[var(--ink-3)]/50 px-3 py-2 transition hover:border-[color:var(--line-strong)]">
                  <span>
                    <strong className="block text-xs">{site.code}</strong>
                    <span className="muted text-[10px]">{site.name}</span>
                  </span>
                  <span className="font-semibold">{site.open}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
