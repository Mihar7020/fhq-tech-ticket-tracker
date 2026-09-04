"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Printer, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import type { ReportData } from "@/lib/report-data";

const dateTime = (value: string) => new Intl.DateTimeFormat("en-CA", {
  dateStyle: "medium", timeStyle: "short", timeZone: "America/Regina",
}).format(new Date(value));

function Metric({ label, value, note }: { label: string; value: string | number; note: string }) {
  return <div className="card p-4"><p className="label">{label}</p><strong className="mt-3 block text-3xl">{value}</strong><p className="muted mt-1 text-xs">{note}</p></div>;
}

function TicketRows({ tickets, printable = false }: { tickets: ReportData["tickets"]; printable?: boolean }) {
  return tickets.map((ticket) => <tr key={ticket.id} className="ticket-print-item border-b divider last:border-0"><td className="p-3 font-mono">{printable ? ticket.number : <Link className="hover:underline" href={`/tickets/${ticket.id}`}>{ticket.number}</Link>}</td><td className="p-3 whitespace-nowrap">{dateTime(ticket.createdAt)}</td><td className="max-w-[280px] p-3"><strong className="block">{ticket.subject}</strong><span className="muted">{ticket.requester}</span></td><td className="p-3">{ticket.school}</td><td className="p-3">{ticket.technician}</td><td className="p-3">{ticket.status}</td><td className="p-3">{ticket.priority}</td><td className="p-3 whitespace-nowrap">{dateTime(ticket.updatedAt)}</td></tr>);
}

export function ReportsView({ report }: { report: ReportData }) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [query, setQuery] = useState("");
  const [school, setSchool] = useState("all");
  const [status, setStatus] = useState("all");
  const [technician, setTechnician] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setInterval(() => startRefresh(() => router.refresh()), 60_000);
    return () => window.clearInterval(timer);
  }, [router]);

  function refresh() {
    startRefresh(() => router.refresh());
  }

  const generated = dateTime(report.generatedAt);
  const schools = useMemo(() => Array.from(new Set(report.tickets.map((ticket) => ticket.school))).sort(), [report.tickets]);
  const statuses = useMemo(() => Array.from(new Set(report.tickets.map((ticket) => ticket.status))).sort(), [report.tickets]);
  const technicians = useMemo(() => Array.from(new Set(report.tickets.map((ticket) => ticket.technician))).sort(), [report.tickets]);
  const filteredTickets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return report.tickets.filter((ticket) => {
      const matchesQuery = !normalizedQuery || [ticket.number, ticket.subject, ticket.requester].some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesQuery && (school === "all" || ticket.school === school) && (status === "all" || ticket.status === status) && (technician === "all" || ticket.technician === technician);
    });
  }, [query, report.tickets, school, status, technician]);
  const pageCount = Math.max(1, Math.ceil(filteredTickets.length / 10));
  const currentPage = Math.min(page, pageCount);
  const visibleTickets = filteredTickets.slice((currentPage - 1) * 10, currentPage * 10);
  const filterDescription = [school !== "all" ? `School: ${school}` : null, status !== "all" ? `Status: ${status}` : null, technician !== "all" ? `Technician: ${technician}` : null, query.trim() ? `Search: ${query.trim()}` : null].filter(Boolean).join(" • ") || "All tickets";

  return (
    <div className="page-wrap report-print-sheet max-w-none">
      <PageHeader
        eyebrow="Live operations"
        title="Reports"
        description={`Current ticket data from the helpdesk database. Snapshot generated ${generated}.`}
        actions={<div className="no-print flex gap-2"><button className="btn" onClick={refresh} disabled={refreshing}><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh</button><button className="btn btn-primary" onClick={() => window.print()}><Printer size={15} /> Print audit report</button></div>}
      />

      {!report.connected ? <section className="card border-l-4 border-l-[var(--red)] p-5"><h2 className="font-bold">Database unavailable</h2><p className="muted mt-1">Reports need the live ticket database connection. No numbers have been invented.</p></section> : null}

      <section aria-label="Ticket summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric label="All tickets" value={report.totals.tickets} note="Permanent register" />
        <Metric label="Open" value={report.totals.open} note="Active work" />
        <Metric label="New" value={report.totals.new} note="Needs review" />
        <Metric label="Resolved" value={report.totals.resolved} note="Completed" />
        <Metric label="Voided" value={report.totals.voided} note="Audit history" />
        <Metric label="Avg. resolution" value={report.totals.averageResolutionHours === null ? "—" : `${report.totals.averageResolutionHours}h`} note="Resolved tickets" />
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.8fr_.8fr]">
        <section className="card overflow-hidden">
          <div className="border-b divider p-4"><p className="label">School load</p><h2 className="mt-1 text-xl font-bold">Tickets by school</h2></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead><tr className="border-b divider label"><th className="p-3">School</th><th className="p-3 text-right">Open</th><th className="p-3 text-right">Resolved</th><th className="p-3 text-right">Voided</th><th className="p-3 text-right">Total</th></tr></thead><tbody>{report.bySchool.map((row) => <tr key={row.code} className="border-b divider last:border-0"><td className="p-3"><strong>{row.code}</strong><span className="muted ml-2 text-xs">{row.name}</span></td><td className="p-3 text-right font-semibold">{row.open}</td><td className="p-3 text-right">{row.resolved}</td><td className="p-3 text-right">{row.voided}</td><td className="p-3 text-right">{row.total}</td></tr>)}</tbody></table></div>
        </section>

        <section className="card overflow-hidden">
          <div className="border-b divider p-4"><p className="label">Ownership</p><h2 className="mt-1 text-xl font-bold">Technicians</h2></div>
          <div>{report.byTechnician.map((row) => <div key={row.name} className="border-b divider p-4 last:border-0"><strong>{row.name}</strong><div className="muted mt-2 flex justify-between text-xs"><span>{row.open} open</span><span>{row.resolved} resolved</span><span>{row.total} total</span></div></div>)}</div>
        </section>

        <section className="card overflow-hidden">
          <div className="border-b divider p-4"><p className="label">Workflow</p><h2 className="mt-1 text-xl font-bold">Status totals</h2></div>
          <div>{report.byStatus.length ? report.byStatus.map((row) => <div key={row.label} className="flex items-center justify-between border-b divider p-4 last:border-0"><span>{row.label}</span><strong>{row.count}</strong></div>) : <p className="muted p-4">No tickets yet.</p>}</div>
        </section>
      </div>

      <section className="card mt-5 overflow-hidden">
        <div className="border-b divider p-4"><p className="label">Audit register</p><h2 className="mt-1 text-xl font-bold">Tickets</h2><p className="muted mt-1 text-xs">Ten tickets per page. Filters also control the printed ticket register.</p></div>
        <div className="no-print grid gap-2 border-b divider p-4 md:grid-cols-[minmax(220px,1.5fr)_repeat(3,minmax(140px,1fr))]">
          <label><span className="sr-only">Search audit tickets</span><input className="input" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search ticket, request, requester…" /></label>
          <label><span className="sr-only">Filter by school</span><select className="input" value={school} onChange={(event) => { setSchool(event.target.value); setPage(1); }}><option value="all">All schools</option>{schools.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span className="sr-only">Filter by status</span><select className="input" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="all">All statuses</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span className="sr-only">Filter by technician</span><select className="input" value={technician} onChange={(event) => { setTechnician(event.target.value); setPage(1); }}><option value="all">All technicians</option>{technicians.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
        <div className="hidden border-b divider p-3 text-xs print:block"><strong>Printed ticket filter:</strong> {filterDescription} • {filteredTickets.length} ticket{filteredTickets.length === 1 ? "" : "s"}</div>
        <div className="overflow-x-auto"><table className="w-full min-w-[940px] text-left text-xs"><thead><tr className="border-b divider label"><th className="p-3">Ticket</th><th className="p-3">Created</th><th className="p-3">Request</th><th className="p-3">School</th><th className="p-3">Technician</th><th className="p-3">Status</th><th className="p-3">Priority</th><th className="p-3">Updated</th></tr></thead><tbody className="print:hidden">{visibleTickets.length ? <TicketRows tickets={visibleTickets} /> : <tr><td colSpan={8} className="muted p-8 text-center">No tickets match these filters.</td></tr>}</tbody><tbody className="hidden print:table-row-group">{filteredTickets.length ? <TicketRows tickets={filteredTickets} printable /> : <tr><td colSpan={8} className="p-8 text-center">No tickets match these filters.</td></tr>}</tbody></table></div>
        <div className="no-print flex items-center justify-between gap-3 border-t divider p-4"><p className="muted text-xs">{filteredTickets.length} ticket{filteredTickets.length === 1 ? "" : "s"}</p><nav aria-label="Audit register pages" className="flex items-center gap-2"><button className="btn min-h-8 px-3 text-xs" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button><span className="min-w-20 text-center text-xs">Page {currentPage} of {pageCount}</span><button className="btn min-h-8 px-3 text-xs" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button></nav></div>
      </section>

      <footer className="mt-5 border-t divider pt-4 text-xs muted"><p>FHQ Tech Helpdesk audit snapshot • Generated {generated} • Data refreshes automatically every 60 seconds while this page is open.</p></footer>
    </div>
  );
}
