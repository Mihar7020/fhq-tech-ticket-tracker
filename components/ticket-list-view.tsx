"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { TicketRow } from "@/components/ticket-row";
import { isActiveTicket } from "@/lib/ticket-status";
import { DEFAULT_FILTERS, LIST_CONTEXT_KEY, SAVED_FILTERS_KEY, describeFilters, filtersToSearch, isDefaultFilters, type TicketFilters } from "@/lib/ticket-filters";
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

export function TicketListView({ tickets, sites, techs, initialFilters = null }: { tickets: Ticket[]; sites: Site[]; techs: Tech[]; initialFilters?: TicketFilters | null }) {
  const start = initialFilters ?? DEFAULT_FILTERS;
  const [query, setQuery] = useState(start.query);
  const [site, setSite] = useState(start.site);
  const [status, setStatus] = useState(start.status);
  const [tech, setTech] = useState(start.tech);
  const restored = useRef(false);

  const router = useRouter();

  // Opened without filters in the address (sidebar link): jump to the last view used in this browser.
  useEffect(() => {
    if (!initialFilters) {
      try {
        const saved = JSON.parse(window.localStorage.getItem(SAVED_FILTERS_KEY) ?? "null") as TicketFilters | null;
        const validSite = saved && (saved.site === "all" || saved.site === "unrouted" || sites.some((item) => item.id === saved.site));
        if (saved && validSite && !isDefaultFilters(saved)) { router.replace(`/tickets${filtersToSearch(saved, sites)}`); return; }
      } catch { /* storage blocked or corrupt: keep defaults */ }
    }
    restored.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on open
  }, []);

  function resetFilters() { setQuery(""); setSite("all"); setStatus("open"); setTech("all"); }

  const filtered = useMemo(() => tickets.filter((ticket) => {
    const searchable = `${ticket.number} ${ticket.subject} ${ticket.requester} ${ticket.category} ${ticket.service}`.toLowerCase();
    const matchesQuery = searchable.includes(query.toLowerCase());
    const matchesSite = site === "all" || ticket.siteId === site || (site === "unrouted" && !ticket.siteId);
    const matchesStatus = status === "all" || (status === "open" ? isActiveTicket(ticket) : ticket.status === status);
    const matchesTech = tech === "all" || ticket.assignee === tech || (tech === "unassigned" && !ticket.assignee);
    return matchesQuery && matchesSite && matchesStatus && matchesTech;
  }), [tickets, query, site, status, tech]);

  // Keep the address, the remembered view and the Previous/Next list in step with the filters.
  useEffect(() => {
    if (!restored.current) return;
    const filters = { query, site, status, tech };
    const search = filtersToSearch(filters, sites);
    if (window.location.search !== search) window.history.replaceState(window.history.state, "", `${window.location.pathname}${search}`);
    try {
      if (isDefaultFilters(filters)) window.localStorage.removeItem(SAVED_FILTERS_KEY);
      else window.localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(filters));
      window.sessionStorage.setItem(LIST_CONTEXT_KEY, JSON.stringify({ ids: filtered.map((ticket) => ticket.id), href: `/tickets${search}`, label: describeFilters(filters, sites) }));
    } catch { /* storage unavailable: the address still works */ }
  }, [query, site, status, tech, filtered, sites]);

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
            {!isDefaultFilters({ query, site, status, tech }) ? <button type="button" className="btn text-xs" onClick={resetFilters}>Reset filters</button> : null}
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
              <option>Waiting on requester</option>
              <option>Waiting on IT</option>
              <option>Resolved</option>
              <option>Voided</option>
            </FilterSelect>
            <FilterSelect label="Technician" value={tech} onChange={setTech}>
              <option value="all">All techs</option>
              <option value="unassigned">Unassigned</option>
              {techs.map((item) => <option key={item.id}>{item.name}</option>)}
            </FilterSelect>
          </div>
        </div>

        <div className="hidden min-h-10 grid-cols-[minmax(0,1fr)_132px_104px_132px_24px] items-center gap-4 border-b divider px-5 text-[10px] uppercase tracking-[.08em] muted sm:grid">
          <span>Request</span>
          <span>Status</span>
          <span>Priority</span>
          <span>Technician</span>
          <span aria-hidden />
        </div>

        {filtered.length ? <div>{filtered.map((ticket) => <TicketRow key={ticket.id} ticket={ticket} preview />)}</div> : (
          <div className="grid min-h-80 place-items-center p-8 text-center">
            <div>
              <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-lg bg-[var(--ink-3)]"><Search className="gold" /></span>
              <h2 className="display text-xl">No tickets found</h2>
              <p className="muted mt-2">Clear a filter or create a new request.</p>
              <div className="mt-5 flex justify-center gap-2">
                <button className="btn" onClick={resetFilters}>Clear filters</button>
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
