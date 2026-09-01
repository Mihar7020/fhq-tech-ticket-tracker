"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardPlus, Save, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useApp } from "@/components/app-providers";
import { sites, techs, tickets } from "@/lib/demo-data";
import type { Priority, TicketStatus } from "@/lib/types";

const priorities: Priority[] = ["Low", "Normal", "High", "Critical"];
const statuses: TicketStatus[] = ["New", "Triage", "In progress", "Waiting on staff", "Waiting on IT", "Resolved"];

export function NewTicketView() {
  const { toast } = useApp();
  const nextNumber = useMemo(() => {
    const last = Math.max(...tickets.map((ticket) => Number(ticket.id)));
    return `FHQ-${last + 1}`;
  }, []);
  const [subject, setSubject] = useState("");
  const [requester, setRequester] = useState("");
  const [site, setSite] = useState("sbec");
  const [priority, setPriority] = useState<Priority>("Normal");
  const [status, setStatus] = useState<TicketStatus>("New");
  const [assignee, setAssignee] = useState("Unassigned");
  const [details, setDetails] = useState("");
  const canSave = subject.trim().length > 3 && requester.trim().length > 1 && details.trim().length > 5;

  return (
    <div className="page-wrap max-w-5xl">
      <div className="mb-5">
        <Link href="/tickets" className="inline-flex items-center gap-2 text-xs font-semibold muted hover:text-[var(--text)]"><ArrowLeft size={15} /> Back to tickets</Link>
      </div>

      <PageHeader
        eyebrow="Manual entry"
        title="New request"
        description="Create a ticket from a phone call, walk-up, hallway conversation, or anything that did not arrive by email."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="card overflow-hidden">
          <div className="border-b divider px-5 py-4">
            <h2 className="display text-xl">Request details</h2>
            <p className="muted mt-1 text-xs">Ticket number preview: <span className="font-mono text-[var(--text)]">{nextNumber}</span></p>
          </div>
          <div className="grid gap-4 p-5">
            <label>
              <span className="label mb-2 block">Subject</span>
              <input className="input" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Projector not working in room 204" />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="label mb-2 block">Requester</span>
                <input className="input" value={requester} onChange={(event) => setRequester(event.target.value)} placeholder="Staff name" />
              </label>
              <label>
                <span className="label mb-2 block">School</span>
                <select className="input" value={site} onChange={(event) => setSite(event.target.value)}>
                  {sites.map((item) => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>)}
                </select>
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <label>
                <span className="label mb-2 block">Priority</span>
                <select className="input" value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
                  {priorities.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>
                <span className="label mb-2 block">Status</span>
                <select className="input" value={status} onChange={(event) => setStatus(event.target.value as TicketStatus)}>
                  {statuses.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>
                <span className="label mb-2 block">Technician</span>
                <select className="input" value={assignee} onChange={(event) => setAssignee(event.target.value)}>
                  <option>Unassigned</option>
                  {techs.map((item) => <option key={item.id}>{item.name}</option>)}
                </select>
              </label>
            </div>
            <label>
              <span className="label mb-2 block">What happened?</span>
              <textarea className="input min-h-44 leading-6" value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Write the request, symptoms, room number, device, and anything already tried." />
            </label>
            <div className="flex flex-wrap justify-end gap-2 border-t divider pt-4">
              <Link href="/tickets" className="btn">Cancel</Link>
              <button
                disabled={!canSave}
                className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => toast(`${nextNumber} drafted - database save comes next`)}
              >
                <Save size={15} /> Save request
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="card p-5">
            <ClipboardPlus size={22} className="gold mb-4" />
            <h2 className="display text-xl">Manual ticket</h2>
            <p className="muted mt-2 text-sm leading-relaxed">This is the place for calls, walk-ups, and notes from a school visit.</p>
          </section>
          <section className="card p-5">
            <UserCheck size={20} className="gold mb-4" />
            <p className="label mb-3">Assignment tip</p>
            <p className="text-sm leading-relaxed">Leave it unassigned when the team needs to triage it. Pick yourself when you are already taking the work.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
