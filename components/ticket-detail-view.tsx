"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronDown, Clock3, Copy, Eye, EyeOff, KeyRound, Merge, MessageSquareText, Pencil, Plus, RefreshCw, Save, Send, StickyNote, Trash2, UserCheck, UserRoundPlus, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { SiteBadge } from "@/components/site-badge";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { useApp } from "@/components/app-providers";
import type { Person, Priority, Site, Tech, Ticket, TicketStatus, TimelineEvent } from "@/lib/types";

const statuses: TicketStatus[] = ["New", "Triage", "In progress", "Waiting on staff", "Waiting on IT", "Resolved", "Voided"];
const priorities: Priority[] = ["Critical", "High", "Normal", "Low"];

type RoutingSuggestion = { id: string; site: { id: string; code: string; name: string } };
type License = { id: string; name: string; consumed: number; available: number; status: string };
type AccountResult = { userPrincipalName: string; temporaryPassword: string };

export function TicketDetailView({ initialTicket, initialTimeline, sites, techs, people, mergeCandidates, currentUserEmail, currentUserRole, pendingRoutingSuggestion }: { initialTicket: Ticket; initialTimeline: TimelineEvent[]; sites: Site[]; techs: Tech[]; people: Person[]; mergeCandidates: Ticket[]; currentUserEmail: string; currentUserRole: string; pendingRoutingSuggestion: RoutingSuggestion | null }) {
  const [ticket, setTicket] = useState(initialTicket);
  const [timeline, setTimeline] = useState(initialTimeline);
  const [noteMode, setNoteMode] = useState<"Public comment" | "Internal note">("Public comment");
  const [message, setMessage] = useState("");
  const [mergeOpen, setMergeOpen] = useState(false);
  const [resolved, setResolved] = useState(ticket.status === "Resolved");
  const [mergeNumber, setMergeNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [voiding, setVoiding] = useState(false);
  const [routingSuggestion, setRoutingSuggestion] = useState(pendingRoutingSuggestion);
  const [routingAction, setRoutingAction] = useState<"assign" | "dismiss" | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [ccInput, setCcInput] = useState("");
  const [ccList, setCcList] = useState<string[]>([]);
  const [ccPickerOpen, setCcPickerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountAction, setAccountAction] = useState<"create" | "reset">("create");
  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [showAccountPassword, setShowAccountPassword] = useState(false);
  const [forcePasswordChange, setForcePasswordChange] = useState(true);
  const [licenseSkuId, setLicenseSkuId] = useState("");
  const [licenses, setLicenses] = useState<License[]>([]);
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [accountResult, setAccountResult] = useState<AccountResult | null>(null);
  const [draft, setDraft] = useState(() => ({
    subject: initialTicket.subject,
    category: initialTicket.category,
    service: initialTicket.service,
    affected: String(initialTicket.affected),
    requester: initialTicket.requester,
    requesterEmail: initialTicket.requesterEmail,
    siteId: initialTicket.siteId ?? "",
  }));
  const { toast } = useApp();
  const router = useRouter();
  const site = useMemo(() => sites.find((item) => item.id === ticket.siteId), [sites, ticket.siteId]);
  const internalNotes = useMemo(() => timeline.filter((event) => event.internal && event.kind === "note"), [timeline]);
  const ccSuggestions = useMemo(() => {
    const query = ccInput.trim().toLowerCase();
    if (query.length < 2) return [];
    return people
      .filter((person) => person.email && (person.name.toLowerCase().includes(query) || person.email.toLowerCase().includes(query)))
      .filter((person) => person.email.toLowerCase() !== ticket.requesterEmail.toLowerCase() && !ccList.includes(person.email.toLowerCase()))
      .slice(0, 6);
  }, [ccInput, ccList, people, ticket.requesterEmail]);
  const currentTechId = currentUserEmail.toLowerCase().startsWith("joseph") ? "joe" : currentUserEmail.toLowerCase().startsWith("rodello") ? "rodello" : currentUserEmail.toLowerCase().startsWith("mihar") ? "mihar" : techs[0]?.id;

  async function patchTicket(body: Record<string, unknown>) {
    return fetch(`/api/tickets/${ticket.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  }

  async function updateStatus(status: TicketStatus) {
    const previous = ticket.status;
    setTicket((current) => ({ ...current, status }));
    setResolved(status === "Resolved");
    const response = await patchTicket({ status });
    if (!response.ok) { setTicket((current) => ({ ...current, status: previous })); setResolved(previous === "Resolved"); toast("Could not change status"); return; }
    toast(`Status changed to ${status}`);
  }

  async function updatePriority(priority: Priority) {
    const previous = ticket.priority;
    setTicket((current) => ({ ...current, priority }));
    const response = await patchTicket({ priority });
    if (!response.ok) { setTicket((current) => ({ ...current, priority: previous })); toast("Could not change priority"); return; }
    toast(`Priority changed to ${priority}`);
  }

  async function updateSite(siteId: string) {
    if (!siteId) return false;
    const previous = ticket.siteId;
    setTicket((current) => ({ ...current, siteId }));
    const response = await patchTicket({ siteId });
    if (!response.ok) {
      setTicket((current) => ({ ...current, siteId: previous }));
      toast("Could not assign school");
      return false;
    }
    setDraft((current) => ({ ...current, siteId }));
    toast("School assigned");
    router.refresh();
    return true;
  }

  async function reviewRoutingSuggestion(accepted: boolean) {
    if (!routingSuggestion || routingAction) return;
    setRoutingAction(accepted ? "assign" : "dismiss");
    if (accepted && !(await updateSite(routingSuggestion.site.id))) {
      setRoutingAction(null);
      return;
    }
    const response = await fetch(`/api/routing-decisions/${routingSuggestion.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accepted }),
    });
    setRoutingAction(null);
    if (!response.ok) {
      toast("Could not save routing decision");
      return;
    }
    setRoutingSuggestion(null);
    if (!accepted) toast("Routing suggestion dismissed");
  }

  async function assign(id: string) {
    const tech = techs.find((item) => item.id === id);
    const previous = ticket;
    const nextStatus = ticket.status === "New" && id ? "In progress" : ticket.status;
    setTicket((current) => ({ ...current, assignee: tech?.name, status: nextStatus }));
    const response = await patchTicket({ assigneeId: id || null, ...(nextStatus !== ticket.status ? { status: nextStatus } : {}) });
    if (!response.ok) { setTicket(previous); toast("Could not change assignment"); return; }
    toast(id && id === currentTechId ? "Ticket assigned to you" : tech ? `Assigned to ${tech.name}` : "Ticket unassigned");
  }

  async function saveEdits() {
    setEditSaving(true);
    const affected = Number(draft.affected);
    const response = await patchTicket({ ...draft, siteId: draft.siteId || null, affected: Number.isFinite(affected) ? affected : 1 });
    setEditSaving(false);
    if (!response.ok) { toast("Could not save ticket edits"); return; }
    setTicket((current) => ({
      ...current,
      subject: draft.subject,
      category: draft.category,
      service: draft.service,
      affected: Number.isFinite(affected) ? affected : current.affected,
      requester: draft.requester,
      requesterEmail: draft.requesterEmail,
      siteId: draft.siteId || undefined,
    }));
    setEditing(false);
    toast("Ticket updated");
  }

  async function voidTicket() {
    if (!window.confirm(`Void ${ticket.number}? It will disappear from open work but remain in history.`)) return;
    setVoiding(true);
    const response = await fetch(`/api/tickets/${ticket.id}`, { method: "DELETE" });
    setVoiding(false);
    if (!response.ok) { toast("Could not void ticket"); return; }
    toast(`${ticket.number} voided`);
    router.push("/tickets");
    router.refresh();
  }

  async function addComment() {
    if (!message.trim() || saving) return; setSaving(true);
    const internal = noteMode === "Internal note";
    const response = await fetch(`/api/tickets/${ticket.id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: message, internal, cc: internal ? [] : ccList }) });
    setSaving(false); if (!response.ok) { toast("Could not save the comment"); return; }
    const result = await response.json() as { id?: string; emailStatus?: "not_attempted" | "sent" | "failed" };
    setTimeline((current) => [...current, { id: result.id ?? `local-${Date.now()}`, kind: internal ? "note" : "email", actor: "You", title: internal ? "Internal note" : "Public comment", body: message, at: "Just now", internal }]);
    toast(internal ? "Internal note saved" : result.emailStatus === "failed" ? "Comment saved, but email reply failed" : result.emailStatus === "sent" ? "Comment saved and emailed" : "Public comment added"); setMessage(""); setCcList([]); setCcInput("");
  }

  function addCc(value = ccInput) {
    const email = value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast("Enter a valid CC email address"); return; }
    if (email === ticket.requesterEmail.toLowerCase() || ccList.includes(email)) { setCcInput(""); return; }
    setCcList((current) => [...current, email]); setCcInput(""); setCcPickerOpen(false);
  }

  function switchAccountAction(action: "create" | "reset") {
    setAccountAction(action);
    setAccountName("");
    setAccountEmail("");
    setAccountPassword("");
    setShowAccountPassword(false);
    setForcePasswordChange(true);
    setLicenseSkuId("");
    setAccountResult(null);
    setAccountError("");
  }

  function generateAccountPassword() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    const bytes = new Uint8Array(14);
    crypto.getRandomValues(bytes);
    const random = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
    setAccountPassword(`Fhq!${random}9a`);
    setShowAccountPassword(true);
  }

  async function openMicrosoftAccount() {
    setAccountOpen((current) => !current); setAccountError(""); setAccountResult(null);
    if (!accountOpen && !licenses.length) {
      setLicenseLoading(true);
      const response = await fetch("/api/microsoft/licenses");
      const result = await response.json().catch(() => ({})) as { licenses?: License[] };
      setLicenseLoading(false);
      if (response.ok) setLicenses(result.licenses ?? []);
    }
  }

  async function runMicrosoftAction() {
    if (accountSaving || !accountEmail.trim() || !accountPassword || (accountAction === "create" && !accountName.trim())) return;
    if (accountAction === "reset" && !window.confirm(`Reset the Microsoft 365 password for ${accountEmail}?`)) return;
    setAccountSaving(true); setAccountError(""); setAccountResult(null);
    const response = await fetch(`/api/tickets/${ticket.id}/microsoft-account`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(accountAction === "create" ? { action: "create", displayName: accountName, userPrincipalName: accountEmail, password: accountPassword, forceChangePasswordNextSignIn: forcePasswordChange, licenseSkuId } : { action: "reset", userPrincipalName: accountEmail, password: accountPassword, forceChangePasswordNextSignIn: forcePasswordChange }) });
    const result = await response.json().catch(() => ({})) as AccountResult & { error?: string; detail?: string };
    setAccountSaving(false);
    if (!response.ok) { setAccountError(result.detail || "Microsoft 365 could not complete this action."); return; }
    setAccountResult(result); toast(accountAction === "create" ? "Microsoft 365 account created" : "Password reset complete");
  }

  async function deleteInternalNote(noteId: string) {
    if (!window.confirm("Delete this internal note?")) return;
    setDeletingNoteId(noteId);
    const response = await fetch(`/api/tickets/${ticket.id}/comments/${noteId}`, { method: "DELETE" });
    setDeletingNoteId(null);
    if (!response.ok) {
      toast("Could not delete internal note");
      return;
    }
    setTimeline((current) => current.filter((event) => event.id !== noteId));
    toast("Internal note deleted");
  }

  async function mergeTicket() {
    if (!mergeNumber.trim()) return;
    const response = await fetch(`/api/tickets/${ticket.id}/merge`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourcePublicId: mergeNumber.trim() }) });
    if (!response.ok) { const result = await response.json() as { error?: string }; toast(result.error === "ticket_not_found" ? "That ticket number was not found" : "Could not merge that ticket"); return; }
    toast(`${mergeNumber.toUpperCase()} merged into ${ticket.number}`); setMergeNumber(""); setMergeOpen(false);
  }

  return (
    <div className="page-wrap max-w-[1280px]">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/tickets" className="flex items-center gap-2 text-xs font-semibold muted hover:text-[var(--text)]"><ArrowLeft size={15} /> Tickets</Link>
        <div className="flex items-center gap-2">
          <button className="btn text-xs" onClick={() => setMergeOpen((value) => !value)}><Merge size={14} /> Merge</button>
          <button className="btn text-xs danger" disabled={voiding} onClick={voidTicket}><Trash2 size={14} /> {voiding ? "Voiding..." : "Void"}</button>
          {!ticket.assignee ? <button className="btn btn-primary text-xs" onClick={() => assign(currentTechId || "")}><UserCheck size={15} /> Take ticket</button> : null}
        </div>
      </div>

      <header className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs muted">{ticket.number}</span>
            {ticket.siteId ? <SiteBadge siteId={ticket.siteId} /> : (
              <label className="relative block">
                <span className="sr-only">Assign school</span>
                <select value={ticket.siteId ?? ""} onChange={(event) => void updateSite(event.target.value)} className="chip h-8 appearance-none bg-[var(--ink-2)] pl-3 pr-8 text-xs font-semibold">
                  <option value="" disabled>Assign school</option>
                  {sites.map((item) => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" size={13} aria-hidden="true" />
              </label>
            )}
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
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 lg:w-auto lg:justify-end">
          <label className="relative block w-full sm:w-48">
            <span className="sr-only">Assignee</span>
            <select value={techs.find((tech) => tech.name === ticket.assignee)?.id ?? ""} onChange={(event) => assign(event.target.value)} className="btn h-10 w-full appearance-none justify-start pl-3 pr-10 text-left text-xs">
              <option value="">Unassigned</option>
              {techs.map((tech) => <option key={tech.id} value={tech.id}>{tech.name}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" size={14} aria-hidden="true" />
          </label>
          <label className="relative block w-full sm:w-48">
            <span className="sr-only">Status</span>
            <select value={ticket.status} onChange={(event) => updateStatus(event.target.value as TicketStatus)} className="btn h-10 w-full appearance-none justify-start pl-3 pr-10 text-left text-xs">
              {statuses.map((status) => <option key={status}>{status}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" size={14} aria-hidden="true" />
          </label>
          <label className="relative block w-full sm:w-48">
            <span className="sr-only">Priority</span>
            <select value={ticket.priority} onChange={(event) => updatePriority(event.target.value as Priority)} className="btn h-10 w-full appearance-none justify-start pl-3 pr-10 text-left text-xs">
              {priorities.map((priority) => <option key={priority}>{priority}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" size={14} aria-hidden="true" />
          </label>
        </div>
      </header>

      {routingSuggestion && !ticket.siteId ? (
        <section className="card mb-5 flex flex-col gap-3 border-[color:rgba(37,107,115,.35)] bg-[color:rgba(37,107,115,.08)] p-4 sm:flex-row sm:items-center sm:justify-between" role="status">
          <p className="text-sm font-semibold">Looks like this is from {routingSuggestion.site.name} — assign?</p>
          <div className="flex gap-2">
            <button type="button" className="btn btn-primary text-xs" disabled={routingAction !== null} onClick={() => void reviewRoutingSuggestion(true)}>{routingAction === "assign" ? "Assigning..." : "Accept"}</button>
            <button type="button" className="btn text-xs" disabled={routingAction !== null} onClick={() => void reviewRoutingSuggestion(false)}>{routingAction === "dismiss" ? "Dismissing..." : "Dismiss"}</button>
          </div>
        </section>
      ) : null}

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
              <input list="merge-candidates" value={mergeNumber} onChange={(event) => setMergeNumber(event.target.value)} className="input" placeholder="Enter ticket number, example FHQ-0002" />
              <datalist id="merge-candidates">{mergeCandidates.map((candidate) => <option key={candidate.id} value={candidate.number}>{candidate.subject}</option>)}</datalist>
            </label>
            <button className="btn" onClick={mergeTicket}><Merge size={14} /> Merge ticket</button>
          </div>
        </section>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="label">Request</p>
                <h2 className="display mt-1 text-xl">Original request</h2>
              </div>
              <button className="btn text-xs" onClick={() => setEditing((value) => !value)}>{editing ? <X size={14} /> : <Pencil size={14} />}{editing ? "Cancel" : "Edit"}</button>
            </div>
            {editing ? (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <EditField label="Subject" value={draft.subject} onChange={(value) => setDraft((current) => ({ ...current, subject: value }))} />
                  <EditField label="Requester" value={draft.requester} onChange={(value) => setDraft((current) => ({ ...current, requester: value }))} />
                  <EditField label="Requester email" type="email" value={draft.requesterEmail} onChange={(value) => setDraft((current) => ({ ...current, requesterEmail: value }))} />
                  <label>
                    <span className="label mb-2 block">School</span>
                    <select className="input" value={draft.siteId} onChange={(event) => setDraft((current) => ({ ...current, siteId: event.target.value }))}>
                      <option value="">Unrouted</option>
                      {sites.map((item) => <option key={item.id} value={item.id}>{item.code} - {item.name}</option>)}
                    </select>
                  </label>
                  <EditField label="Category" value={draft.category} onChange={(value) => setDraft((current) => ({ ...current, category: value }))} />
                  <EditField label="Service" value={draft.service} onChange={(value) => setDraft((current) => ({ ...current, service: value }))} />
                  <EditField label="Affected" type="number" value={draft.affected} onChange={(value) => setDraft((current) => ({ ...current, affected: value }))} />
                </div>
                <div className="flex justify-end gap-2">
                  <button className="btn" onClick={() => setEditing(false)}>Cancel</button>
                  <button className="btn btn-primary" disabled={editSaving || !draft.subject.trim()} onClick={saveEdits}><Save size={14} /> {editSaving ? "Saving..." : "Save edits"}</button>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-lg border divider bg-[var(--ink-3)]/45 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-7">{ticket.originalEmail}</p>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoTile label="Category" value={ticket.category} />
                  <InfoTile label="Service" value={ticket.service} />
                  <InfoTile label="Affected" value={`${ticket.affected}`} />
                </div>
              </>
            )}
          </section>

          <section className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b divider px-5 py-4">
              <div className="flex rounded-lg border divider bg-[var(--ink-3)] p-1">
                {(["Public comment", "Internal note"] as const).map((mode) => (
                  <button key={mode} onClick={() => setNoteMode(mode)} className={`rounded-md px-3 py-1.5 text-xs font-bold ${noteMode === mode ? "accent-fill" : "muted"}`}>{mode}</button>
                ))}
              </div>
              <span className="muted text-xs">{noteMode === "Public comment" ? "Visible to requester and emailed for email-created tickets" : "IT team only"}</span>
            </div>
            <div className="p-5">
              <label htmlFor="message" className="sr-only">{noteMode}</label>
              <textarea id="message" value={message} onChange={(event) => setMessage(event.target.value)} className="input min-h-36 leading-6" placeholder={noteMode === "Public comment" ? "Write an update for the requester..." : "Add an internal troubleshooting note..."} />
              {noteMode === "Public comment" ? (
                <div className="mt-3 rounded-lg border divider bg-[var(--ink-3)]/45 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="relative min-w-0 flex-1">
                      <label htmlFor="ticket-cc-input" className="label mb-2 block">CC another person</label>
                      <input id="ticket-cc-input" className="input" type="email" role="combobox" aria-autocomplete="list" aria-expanded={ccPickerOpen && ccSuggestions.length > 0} aria-controls="ticket-cc-suggestions" value={ccInput} onFocus={() => setCcPickerOpen(true)} onBlur={() => setCcPickerOpen(false)} onChange={(event) => { setCcInput(event.target.value); setCcPickerOpen(true); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addCc(); } if (event.key === "Escape") setCcPickerOpen(false); }} placeholder="Search a name or type an email" autoComplete="off" />
                      {ccPickerOpen && ccSuggestions.length ? <div id="ticket-cc-suggestions" role="listbox" className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border divider bg-white p-1 shadow-xl">{ccSuggestions.map((person) => <button key={person.id} type="button" role="option" aria-selected="false" className="block w-full rounded-md px-3 py-2 text-left hover:bg-[var(--ink-3)] focus:bg-[var(--ink-3)] focus:outline-none" onMouseDown={(event) => event.preventDefault()} onClick={() => addCc(person.email)}><span className="block truncate text-xs font-bold">{person.name}</span><span className="muted block truncate text-[11px]">{person.email}</span></button>)}</div> : null}
                    </div>
                    <button type="button" className="btn" disabled={!ccInput.trim()} onClick={() => addCc()}><Plus size={14} /> Add CC</button>
                  </div>
                  {ccList.length ? <div className="mt-3 flex flex-wrap gap-2">{ccList.map((email) => <span key={email} className="chip gap-2">{email}<button type="button" aria-label={`Remove ${email}`} onClick={() => setCcList((current) => current.filter((item) => item !== email))}><X size={11} /></button></span>)}</div> : <p className="muted mt-2 text-[10px]">Optional. CC recipients receive this update with the requester.</p>}
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                <button disabled={!message.trim() || saving} onClick={addComment} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-40">
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
          <AnimatePresence initial={false}>
            {internalNotes.length ? (
              <motion.section
                className="overflow-hidden rounded-lg border border-[color:rgba(190,161,72,.45)] bg-[#fff4b8] p-5 shadow-[0_12px_24px_rgba(35,31,25,.12)]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="label text-[color:var(--teal)]">Internal notes</p>
                    <h2 className="display mt-1 text-xl">Team sticky note</h2>
                  </div>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white/45 text-[color:var(--teal)] shadow-sm"><StickyNote size={17} /></span>
                </div>
                <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                  {internalNotes.map((note) => (
                    <article key={note.id} className="rounded-sm border border-[color:rgba(190,161,72,.30)] bg-[#fff9d7] p-3 shadow-[0_4px_10px_rgba(35,31,25,.08)]">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="whitespace-pre-wrap text-xs leading-5">{note.body}</p>
                          <p className="mt-2 text-[10px] muted">{note.actor} - {note.at}</p>
                        </div>
                        <button
                          type="button"
                          className="btn icon-btn h-7 min-h-7 w-7 shrink-0 bg-white/55 text-[color:var(--red)]"
                          disabled={deletingNoteId === note.id}
                          onClick={() => void deleteInternalNote(note.id)}
                          aria-label="Delete internal note"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </motion.section>
            ) : null}
          </AnimatePresence>

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
            </dl>
            {ticket.requesterCc.length ? <div className="mt-4 border-t divider pt-4"><p className="label mb-2">CC on original email</p><div className="flex flex-wrap gap-2">{ticket.requesterCc.map((email) => <span key={email} className="chip">{email}</span>)}</div></div> : null}
          </section>

          {currentUserRole === "ADMIN" ? (
            <section className="card overflow-hidden">
              <button type="button" className="flex w-full items-center gap-3 p-5 text-left" onClick={() => void openMicrosoftAccount()} aria-expanded={accountOpen}>
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--gold-soft)] text-[var(--gold-bright)]"><UserRoundPlus size={18} /></span>
                <span className="min-w-0 flex-1"><span className="label block">Admin</span><strong className="mt-1 block">Microsoft 365 account</strong></span>
                <ChevronDown className={`transition-transform ${accountOpen ? "rotate-180" : ""}`} size={16} />
              </button>
              {accountOpen ? (
                <div className="border-t divider p-5">
                  <div className="mb-5 grid grid-cols-2 rounded-lg border divider bg-[var(--ink-3)] p-1">
                    <button type="button" className={`rounded-md px-3 py-2 text-xs font-bold ${accountAction === "create" ? "accent-fill" : "muted"}`} onClick={() => switchAccountAction("create")}>Create account</button>
                    <button type="button" className={`rounded-md px-3 py-2 text-xs font-bold ${accountAction === "reset" ? "accent-fill" : "muted"}`} onClick={() => switchAccountAction("reset")}>Reset password</button>
                  </div>
                  <div className="space-y-4">
                    {accountAction === "create" ? <EditField label="Display name" value={accountName} onChange={setAccountName} /> : null}
                    <EditField label="Microsoft email" type="email" value={accountEmail} onChange={setAccountEmail} />
                    {accountAction === "create" ? <label><span className="label mb-2 block">License</span><select className="input" value={licenseSkuId} onChange={(event) => setLicenseSkuId(event.target.value)} disabled={licenseLoading}><option value="">Create without a license</option>{licenses.map((license) => <option key={license.id} value={license.id} disabled={license.available < 1}>{license.name} · {license.available} available</option>)}</select>{licenseLoading ? <span className="muted mt-1 block text-[10px]">Loading tenant licenses...</span> : null}</label> : null}
                    <div>
                      <span className="label mb-2 block">Temporary password</span>
                      <div className="flex gap-2">
                        <div className="relative min-w-0 flex-1"><input className="input pr-10" type={showAccountPassword ? "text" : "password"} value={accountPassword} onChange={(event) => setAccountPassword(event.target.value)} autoComplete="new-password" placeholder="Enter a temporary password" /><button type="button" className="absolute inset-y-0 right-0 grid w-10 place-items-center muted hover:text-[var(--text)]" onClick={() => setShowAccountPassword((current) => !current)} aria-label={showAccountPassword ? "Hide password" : "Show password"}>{showAccountPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button></div>
                        <button type="button" className="btn shrink-0 px-3" onClick={generateAccountPassword} aria-label="Generate a strong password"><RefreshCw size={14} /><span className="hidden sm:inline">Generate</span></button>
                      </div>
                      <p className="muted mt-1.5 text-[10px]">Use a strong password with uppercase, lowercase, numbers, and symbols.</p>
                    </div>
                    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border divider bg-[var(--ink-3)]/45 p-3 text-xs leading-5"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--teal)]" checked={forcePasswordChange} onChange={(event) => setForcePasswordChange(event.target.checked)} /><span><strong className="block">Require password change at first sign-in</strong><span className="muted">This setting is applied directly to the Microsoft 365 account.</span></span></label>
                    <button type="button" className="btn btn-primary w-full" disabled={accountSaving || !accountEmail.trim() || !accountPassword || (accountAction === "create" && !accountName.trim())} onClick={() => void runMicrosoftAction()}>{accountAction === "create" ? <UserRoundPlus size={15} /> : <KeyRound size={15} />}{accountSaving ? "Working..." : accountAction === "create" ? "Create Microsoft account" : "Reset password"}</button>
                  </div>
                  {accountError ? <p className="mt-3 break-words text-xs text-[var(--red)]" role="alert">{accountError}</p> : null}
                  {accountResult ? <div className="mt-4 rounded-lg border border-[color:rgba(111,159,120,.35)] bg-[color:rgba(111,159,120,.10)] p-3" role="status"><p className="text-xs font-bold">Microsoft 365 updated successfully</p><p className="mt-2 break-all rounded-md bg-white px-3 py-2 font-mono text-xs">{accountResult.temporaryPassword}</p><button type="button" className="btn mt-2 w-full text-xs" onClick={() => { void navigator.clipboard.writeText(accountResult.temporaryPassword); toast("Temporary password copied"); }}><Copy size={13} /> Copy password</button><p className="muted mt-2 text-[10px]">{forcePasswordChange ? "The user must change this password at first sign-in." : "The user can continue using this password after signing in."} Share it securely.</p></div> : null}
                </div>
              ) : null}
            </section>
          ) : null}

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

function EditField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: "text" | "email" | "number" }) {
  return (
    <label>
      <span className="label mb-2 block">{label}</span>
      <input className="input" type={type} min={type === "number" ? 1 : undefined} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
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
