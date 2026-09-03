"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { TicketRow } from "@/components/ticket-row";
import type { Site, Tech, Ticket } from "@/lib/types";

function FilterSelect({ value, onChange, label, children }: { value: string; onChange: (value: string) => void; label: string; children: React.ReactNode }) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select className="btn appearance-none pr-9 text-xs" value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
      <ChevronDown size={13} className="pointer-events-none absolute right-3 top-3" />
    </label>
  );
}

export function TicketListView({ tickets, sites, techs }: { tickets: Ticket[]; sites: Site[]; techs: Tech[] }) {
  const [query, setQuery] = useState("");
  const [site, setSite] = useState("all");
  const [status, setStatus] = useState("open");
  const [tech, setTech] = useState("all");

  const filtered = useMemo(() => tickets.filter((ticket) => {
    const searchable = `${ticket.number} ${ticket.subject} ${ticket.requester} ${ticket.category} ${ticket.service}`.toLowerCase();
    const matchesQuery = searchable.includes(query.toLowerCase());
    const matchesSite = site === "all" || ticket.siteId === site || (site === "unrouted" && !ticket.siteId);
    const matchesStatus = status === "all" || (status === "open" ? ticket.status !== "Resolved" : ticket.status === status);
    const matchesTech = tech === "all" || ticket.assignee === tech || (tech === "unassigned" && !ticket.assignee);
    return matchesQuery && matchesSite && matchesStatus && matchesTech;
  }), [tickets, query, site, status, tech]);

  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="Ticket queue"
        title="Tickets"
        description="Search, filter, assign, and open requests from one clean list."
        actions={<Link href="/tickets/new" className="btn btn-primary"><Plus size={16} /> New request</Link>}
      />

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b divider p-4 xl:flex-row xl:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search queue</span>
            <Search size={16} className="muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input className="input input-with-icon" placeholder="Search by ticket, requester, school, category..." value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <div className="flex flex-wrap gap-2">
            <FilterSelect label="School" value={site} onChange={setSite}>
              <option value="all">All schools</option>
              <option value="unrouted">Unrouted</option>
              {sites.map((item) => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>)}
            </FilterSelect>
            <FilterSelect label="Status" value={status} onChange={setStatus}>
              <option value="open">Open only</option>
              <option value="all">Any status</option>
              <option>New</option>
              <option>Triage</option>
              <option>In progress</option>
              <option>Waiting on staff</option>
              <option>Waiting on IT</option>
              <option>Resolved</option>
            </FilterSelect>
            <FilterSelect label="Technician" value={tech} onChange={setTech}>
              <option value="all">All techs</option>
              <option value="unassigned">Unassigned</option>
              {techs.map((item) => <option key={item.id}>{item.name}</option>)}
            </FilterSelect>
          </div>
        </div>

        <div className="hidden min-h-10 items-center gap-3 border-b divider px-5 text-[10px] uppercase tracking-[.08em] muted sm:flex">
          <span className="w-[calc(100%-430px)]">Request</span>
          <span className="w-28">Status</span>
          <span className="w-20">Priority</span>
          <span className="w-28">Technician</span>
        </div>

        {filtered.length ? <div>{filtered.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} />)}</div> : (
          <div className="grid min-h-80 place-items-center p-8 text-center">
            <div>
              <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-lg bg-[var(--ink-3)]"><Search className="gold" /></span>
              <h2 className="display text-xl">No tickets found</h2>
              <p className="muted mt-2">Clear a filter or create a new request.</p>
              <div className="mt-5 flex justify-center gap-2">
                <button className="btn" onClick={() => { setQuery(""); setSite("all"); setStatus("open"); setTech("all"); }}>Clear filters</button>
                <Link href="/tickets/new" className="btn btn-primary"><Plus size={14} /> New request</Link>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t divider px-5 py-3 text-[11px] muted">
          <span>{filtered.length} tickets</span>
          <span className="hide-mobile">Sorted newest first</span>
        </div>
      </section>
    </div>
  );
}
