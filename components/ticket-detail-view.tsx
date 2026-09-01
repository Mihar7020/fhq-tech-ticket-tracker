"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronDown, Clock3, Merge, MessageSquareText, Pencil, Save, Send, UserCheck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { SiteBadge } from "@/components/site-badge";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { useApp } from "@/components/app-providers";
import { sites, techs, timeline } from "@/lib/demo-data";
import type { Ticket, TicketStatus } from "@/lib/types";

const statuses: TicketStatus[] = ["New", "Triage", "In progress", "Waiting on staff", "Waiting on IT", "Resolved"];

export function TicketDetailView({ initialTicket }: { initialTicket: Ticket }) {
  const [ticket, setTicket] = useState(initialTicket);
  const [noteMode, setNoteMode] = useState<"Public comment" | "Internal note">("Public comment");
  const [message, setMessage] = useState("");
  const [mergeOpen, setMergeOpen] = useState(false);
  const [resolved, setResolved] = useState(ticket.status === "Resolved");
  const { toast } = useApp();
  const site = useMemo(() => sites.find((item) => item.id === ticket.siteId), [ticket.siteId]);

  function updateStatus(status: TicketStatus) {
    setTicket((current) => ({ ...current, status }));
    setResolved(status === "Resolved");
    toast(`Status changed to ${status}`);
  }

  function assign(name: string) {
    setTicket((current) => ({ ...current, assignee: name === "Unassigned" ? undefined : name, status: current.status === "New" && name !== "Unassigned" ? "In progress" : current.status }));
    toast(name === "Mihar Kathiriya" ? "Ticket assigned to you" : `Assigned to ${name}`);
  }

  return (
    <div className="page-wrap max-w-[1280px]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/tickets" className="flex items-center gap-2 text-xs font-semibold muted hover:text-[var(--text)]"><ArrowLeft size={15} /> Tickets</Link>
        <div className="flex items-center gap-2">
          <button className="btn text-xs" onClick={() => setMergeOpen((value) => !value)}><Merge size={14} /> Merge</button>
          {!ticket.assignee ? <button className="btn btn-primary text-xs" onClick={() => assign("Mihar Kathiriya")}><UserCheck size={15} /> Take ticket</button> : null}
        </div>
      </div>

      <header className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs muted">{ticket.number}</span>
            <SiteBadge siteId={ticket.siteId} />
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
          <h1 className="display max-w-4xl text-[clamp(1.8rem,3.8vw,3.1rem)] leading-tight">{ticket.subject}</h1>
          <p className="muted mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span>{ticket.requester}</span>
            <span>-</span>
            <span>{ticket.requesterRole}</span>
            <span>-</span>
            <span>{ticket.createdAt}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <label className="relative">
            <span className="sr-only">Assignee</span>
            <select value={ticket.assignee ?? "Unassigned"} onChange={(event) => assign(event.target.value)} className="btn h-full appearance-none pr-9">
              <option>Unassigned</option>
              {techs.map((tech) => <option key={tech.id}>{tech.name}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-3" size={14} />
          </label>
          <label className="relative">
            <span className="sr-only">Status</span>
            <select value={ticket.status} onChange={(event) => updateStatus(event.target.value as TicketStatus)} className="btn h-full appearance-none pr-9">
              {statuses.map((status) => <option key={status}>{status}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-3" size={14} />
          </label>
        </div>
      </header>

      <AnimatePresence>
        {resolved && (
          <motion.div className="mb-5 flex items-center gap-3 overflow-hidden rounded-lg border border-[color:rgba(111,159,120,.35)] bg-[color:rgba(111,159,120,.10)] px-5 py-4" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--green)] text-white"><Check size={18} strokeWidth={3} /></span>
            <div className="flex-1">
              <strong>Marked resolved</strong>
              <p className="muted text-xs">The ticket remains searchable in history.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {mergeOpen ? (
        <section className="card mb-5 p-5">
          <p className="label mb-2">Merge tickets</p>
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <label>
              <span className="muted mb-2 block text-xs">Merge another ticket into {ticket.number}</span>
              <input className="input" placeholder="Enter ticket number, example FHQ-1041" />
            </label>
            <button className="btn" onClick={() => toast("Merge preview opened - no tickets changed")}><Merge size={14} /> Preview merge</button>
          </div>
        </section>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="label">Request</p>
                <h2 className="display mt-1 text-xl">Summary</h2>
              </div>
              <button className="btn text-xs"><Pencil size={14} /> Edit</button>
            </div>
            <p className="text-base leading-7">{ticket.digest}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <InfoTile label="Category" value={ticket.category} />
              <InfoTile label="Service" value={ticket.service} />
              <InfoTile label="Room" value={ticket.room ?? "Not set"} />
              <InfoTile label="Affected" value={`${ticket.affected}`} />
            </div>
            <div className="mt-5 rounded-lg border divider bg-[var(--ink-3)]/45 p-4">
              <p className="label mb-2">Original request</p>
              <p className="whitespace-pre-wrap text-sm leading-7">{ticket.originalEmail}</p>
            </div>
          </section>

          <section className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b divider px-5 py-4">
              <div className="flex rounded-lg border divider bg-[var(--ink-3)] p-1">
                {(["Public comment", "Internal note"] as const).map((mode) => (
                  <button key={mode} onClick={() => setNoteMode(mode)} className={`rounded-md px-3 py-1.5 text-xs font-bold ${noteMode === mode ? "accent-fill" : "muted"}`}>{mode}</button>
                ))}
              </div>
              <span className="muted text-xs">{noteMode === "Public comment" ? "Visible to requester later" : "IT team only"}</span>
            </div>
            <div className="p-5">
              <label htmlFor="message" className="sr-only">{noteMode}</label>
              <textarea id="message" value={message} onChange={(event) => setMessage(event.target.value)} className="input min-h-36 leading-6" placeholder={noteMode === "Public comment" ? "Write an update for the requester..." : "Add an internal troubleshooting note..."} />
              <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                <button disabled={!message.trim()} onClick={() => { toast(noteMode === "Public comment" ? "Public comment added" : "Internal note added"); setMessage(""); }} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-40">
                  {noteMode === "Public comment" ? <Send size={15} /> : <Save size={15} />}
                  {noteMode === "Public comment" ? "Add comment" : "Save note"}
                </button>
              </div>
            </div>
          </section>

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b divider px-5 py-4">
              <div>
                <p className="label">History</p>
                <h2 className="display mt-1 text-xl">Timeline</h2>
              </div>
              <Clock3 size={18} className="muted" />
            </div>
            <div className="p-5">
              {timeline.map((event, index) => (
                <div key={event.id} className="relative grid grid-cols-[24px_1fr] gap-3 pb-6 last:pb-0">
                  <div className="relative">
                    <span className="relative z-10 grid h-6 w-6 place-items-center rounded-full border divider bg-[var(--ink-3)] text-[var(--gold-bright)]"><MessageSquareText size={11} /></span>
                    {index < timeline.length - 1 && <span className="absolute left-3 top-6 h-[calc(100%-10px)] w-px bg-[var(--line)]" />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-xs">{event.title}</strong>
                      {event.internal && <span className="chip text-[9px]">Internal</span>}
                      <span className="ml-auto text-[10px] muted">{event.at}</span>
                    </div>
                    <p className="muted mt-1 text-xs leading-relaxed">{event.body}</p>
                    <p className="mt-1 text-[10px] muted">by {event.actor.replace("Time to Doom", "System")}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="card p-5">
            <p className="label mb-4">Ticket admin</p>
            <dl className="space-y-3 text-xs">
              <InfoLine label="Number" value={ticket.number} mono />
              <InfoLine label="School" value={site?.code ?? "Unrouted"} />
              <InfoLine label="Technician" value={ticket.assignee ?? "Unassigned"} />
              <InfoLine label="Priority" value={ticket.priority} />
              <InfoLine label="Status" value={ticket.status} />
            </dl>
          </section>

          <section className="card p-5">
            <p className="label mb-4">Requester</p>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--gold)] text-sm font-black text-white">{ticket.requester.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
              <div>
                <p className="font-bold">{ticket.requester}</p>
                <p className="muted text-[11px]">{ticket.requesterEmail}</p>
              </div>
            </div>
            <dl className="mt-5 space-y-3 text-xs">
              <InfoLine label="Role" value={ticket.requesterRole} />
              <InfoLine label="Room" value={ticket.room ?? "Not set"} />
              <InfoLine label="Open tickets" value="2" />
            </dl>
          </section>

          <section className="card p-5">
            <p className="label mb-3">Next action</p>
            <p className="text-sm leading-6">{ticket.suggestedAction}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border divider bg-[var(--ink-3)]/45 p-3">
      <p className="label mb-2">{label}</p>
      <p className="truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function InfoLine({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="muted">{label}</dt>
      <dd className={mono ? "font-mono" : "text-right"}>{value}</dd>
    </div>
  );
}
