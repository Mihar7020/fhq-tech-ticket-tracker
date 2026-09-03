"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardPlus, Save, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useApp } from "@/components/app-providers";
import type { Priority, Site, Tech, TicketStatus } from "@/lib/types";

const priorities: Priority[] = ["Low", "Normal", "High", "Critical"];
const statuses: TicketStatus[] = ["New", "Triage", "In progress", "Waiting on staff", "Waiting on IT", "Resolved"];

export function NewTicketView({ sites, techs }: { sites: Site[]; techs: Tech[] }) {
  const { toast } = useApp();
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [requester, setRequester] = useState("");
  const [site, setSite] = useState(sites[0]?.id ?? "");
  const [priority, setPriority] = useState<Priority>("Normal");
  const [status, setStatus] = useState<TicketStatus>("New");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [assignee, setAssignee] = useState("");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);
  const canSave = subject.trim().length > 3 && requester.trim().length > 1 && details.trim().length > 5;

  async function saveTicket() {
    if (!canSave || saving) return;
    setSaving(true);
    const response = await fetch("/api/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, requester, requesterEmail, siteId: site, priority, status, assigneeId: assignee, details }) });
    const result = await response.json() as { id?: string; publicId?: string; error?: string };
    if (!response.ok || !result.id) { toast("Could not save the request. Check the fields and try again."); setSaving(false); return; }
    toast(`${result.publicId} created`);
    router.push(`/tickets/${result.id}`);
    router.refresh();
  }

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
            <p className="muted mt-1 text-xs">The next ticket number will be assigned automatically when you save.</p>
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
                <span className="label mb-2 block">Requester email <span className="muted normal-case">(optional)</span></span>
                <input className="input" type="email" value={requesterEmail} onChange={(event) => setRequesterEmail(event.target.value)} placeholder="name@fhqtc.net" />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
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
                  <option value="">Unassigned</option>
                  {techs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
            </div>
            <label>
              <span className="label mb-2 block">What happened?</span>
              <textarea className="input min-h-44 leading-6" value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Write the request, symptoms, device, and anything already tried." />
            </label>
            <div className="flex flex-wrap justify-end gap-2 border-t divider pt-4">
              <Link href="/tickets" className="btn">Cancel</Link>
              <button
                disabled={!canSave}
                className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-40"
                onClick={saveTicket}
              >
                <Save size={15} /> {saving ? "Saving..." : "Save request"}
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
