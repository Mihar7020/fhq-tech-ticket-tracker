"use client";

import { useEffect, useTransition } from "react";
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

export function ReportsView({ report }: { report: ReportData }) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();

  useEffect(() => {
    const timer = window.setInterval(() => startRefresh(() => router.refresh()), 60_000);
    return () => window.clearInterval(timer);
  }, [router]);

  function refresh() {
    startRefresh(() => router.refresh());
  }

  const generated = dateTime(report.generatedAt);

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
        <div className="border-b divider p-4"><p className="label">Audit register</p><h2 className="mt-1 text-xl font-bold">Tickets</h2><p className="muted mt-1 text-xs">Up to the 250 most recent tickets, including resolved and voided records.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[940px] text-left text-xs"><thead><tr className="border-b divider label"><th className="p-3">Ticket</th><th className="p-3">Created</th><th className="p-3">Request</th><th className="p-3">School</th><th className="p-3">Technician</th><th className="p-3">Status</th><th className="p-3">Priority</th><th className="p-3">Updated</th></tr></thead><tbody>{report.tickets.length ? report.tickets.map((ticket) => <tr key={ticket.id} className="ticket-print-item border-b divider last:border-0"><td className="p-3 font-mono"><Link className="no-print hover:underline" href={`/tickets/${ticket.id}`}>{ticket.number}</Link><span className="print-only">{ticket.number}</span></td><td className="p-3 whitespace-nowrap">{dateTime(ticket.createdAt)}</td><td className="max-w-[280px] p-3"><strong className="block">{ticket.subject}</strong><span className="muted">{ticket.requester}</span></td><td className="p-3">{ticket.school}</td><td className="p-3">{ticket.technician}</td><td className="p-3">{ticket.status}</td><td className="p-3">{ticket.priority}</td><td className="p-3 whitespace-nowrap">{dateTime(ticket.updatedAt)}</td></tr>) : <tr><td colSpan={8} className="muted p-8 text-center">No tickets to report yet.</td></tr>}</tbody></table></div>
      </section>

      <section className="card mt-5 overflow-hidden">
        <div className="border-b divider p-4"><p className="label">Change history</p><h2 className="mt-1 text-xl font-bold">Recent audit activity</h2><p className="muted mt-1 text-xs">The 100 most recent recorded ticket actions.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-xs"><thead><tr className="border-b divider label"><th className="p-3">Time</th><th className="p-3">Ticket</th><th className="p-3">Action</th><th className="p-3">Actor</th></tr></thead><tbody>{report.audit.length ? report.audit.map((event) => <tr key={event.id} className="ticket-print-item border-b divider last:border-0"><td className="p-3 whitespace-nowrap">{dateTime(event.createdAt)}</td><td className="p-3 font-mono">{event.ticketNumber}</td><td className="p-3">{event.action}</td><td className="p-3">{event.actor}</td></tr>) : <tr><td colSpan={4} className="muted p-8 text-center">No audit activity has been recorded yet.</td></tr>}</tbody></table></div>
      </section>

      <footer className="mt-5 border-t divider pt-4 text-xs muted"><p>FHQ Tech Helpdesk audit snapshot • Generated {generated} • Data refreshes automatically every 60 seconds while this page is open.</p></footer>
    </div>
  );
}
