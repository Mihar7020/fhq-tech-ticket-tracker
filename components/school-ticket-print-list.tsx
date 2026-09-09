"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Printer } from "lucide-react";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import type { Site, Ticket } from "@/lib/types";

const PAGE_SIZE = 15;

export function SchoolTicketPrintList({ site, tickets }: { site: Site; tickets: Ticket[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedTickets = useMemo(() => tickets.filter((ticket) => selectedIdSet.has(ticket.id)), [selectedIdSet, tickets]);
  const allSelected = tickets.length > 0 && tickets.every((ticket) => selectedIdSet.has(ticket.id));
  const pageCount = Math.max(1, Math.ceil(tickets.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleTickets = useMemo(() => tickets.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [currentPage, tickets]);

  function toggleTicket(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleAll() {
    setSelectedIds(allSelected ? [] : tickets.map((ticket) => ticket.id));
  }

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b divider p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="label">Current work</p>
          <h2 className="display mt-1 text-2xl">Tickets at {site.code}</h2>
        </div>
        {tickets.length ? (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn text-xs" onClick={toggleAll}>{allSelected ? "Clear selection" : "Select all"}</button>
            <button type="button" className="btn btn-primary text-xs disabled:cursor-not-allowed disabled:opacity-45" disabled={!selectedTickets.length} onClick={() => window.print()}>
              <Printer size={14} /> Print selected ({selectedTickets.length})
            </button>
          </div>
        ) : null}
      </div>

      {tickets.length ? (
        <div>
          <div className="h-[380px] overflow-y-auto" tabIndex={0} aria-label={`Tickets at ${site.code}, page ${currentPage} of ${pageCount}`}>
          {visibleTickets.map((ticket) => (
            <div key={ticket.id} className="grid grid-cols-[44px_minmax(0,1fr)] items-stretch border-b divider last:border-0">
              <label className="grid cursor-pointer place-items-center border-r divider bg-[var(--ink-3)]/35">
                <input type="checkbox" className="h-4 w-4 accent-[var(--gold)]" aria-label={`Select ${ticket.number} for printing`} checked={selectedIdSet.has(ticket.id)} onChange={() => toggleTicket(ticket.id)} />
              </label>
              <Link href={`/tickets/${ticket.id}`} className="grid min-h-[76px] gap-2 px-4 py-3 transition-colors hover:bg-[var(--ink-3)]/70 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="muted font-mono text-[10px]">{ticket.number}</p>
                  <h3 className="mt-1 truncate font-semibold hover:text-[var(--gold-bright)]">{ticket.subject}</h3>
                  <p className="muted mt-1 text-[11px]">{ticket.requester} - {ticket.assignee ?? "Unassigned"}</p>
                </div>
                <div className="flex flex-wrap gap-2"><StatusBadge status={ticket.status} /><PriorityBadge priority={ticket.priority} /></div>
              </Link>
            </div>
          ))}
          </div>
          {pageCount > 1 ? (
            <nav className="flex items-center justify-between gap-3 border-t divider px-4 py-3" aria-label="Ticket list pages">
              <button type="button" className="btn text-xs" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
              <span className="muted text-xs" aria-live="polite">Page {currentPage} of {pageCount}</span>
              <button type="button" className="btn text-xs" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button>
            </nav>
          ) : null}
        </div>
      ) : (
        <div className="p-12 text-center"><p className="display text-2xl">This school is clear.</p><p className="muted mt-2 text-sm">There are no active tickets to print.</p></div>
      )}

      <div className="ticket-print-sheet print-only" aria-hidden="true">
        <header className="mb-7 border-b-2 border-black pb-4">
          <p className="text-xs font-bold uppercase tracking-widest">FHQ Tech - School tickets</p>
          <h1 className="mt-1 text-3xl font-bold">{site.code} - {site.name}</h1>
          <p className="mt-1 text-sm">{site.address}</p>
          <p className="mt-2 text-sm">Selected active tickets: {selectedTickets.length}</p>
        </header>
        <div className="space-y-5">
          {selectedTickets.map((ticket) => (
            <article key={ticket.id} className="ticket-print-item border border-black p-4">
              <div className="flex items-start justify-between gap-6">
                <div><p className="font-mono text-xs">{ticket.number}</p><h2 className="mt-1 text-xl font-bold">{ticket.subject}</h2></div>
                <p className="whitespace-nowrap text-sm font-bold">{ticket.priority} - {ticket.status}</p>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div><dt className="font-bold">Requester</dt><dd>{ticket.requester}</dd></div>
                <div><dt className="font-bold">Technician</dt><dd>{ticket.assignee ?? "Unassigned"}</dd></div>
                <div><dt className="font-bold">Category</dt><dd>{ticket.category}</dd></div>
                <div><dt className="font-bold">Service</dt><dd>{ticket.service}</dd></div>
                <div><dt className="font-bold">Affected</dt><dd>{ticket.affected}</dd></div>
                <div><dt className="font-bold">Requester email</dt><dd>{ticket.requesterEmail}</dd></div>
              </dl>
              <div className="mt-4"><h3 className="text-sm font-bold">Summary</h3><p className="mt-1 whitespace-pre-wrap text-sm leading-6">{ticket.digest}</p></div>
              <div className="mt-5 border-t border-black pt-3"><p className="text-sm font-bold">Visit notes</p><div className="mt-5 border-b border-black" /><div className="mt-7 border-b border-black" /></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
