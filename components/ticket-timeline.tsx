"use client";

import { useMemo, useState } from "react";
import { ChevronDown, CornerDownLeft, Lock, Mail, Settings2 } from "lucide-react";
import { EmailBody } from "@/components/email-body";
import { dayLabel, splitQuoted } from "@/lib/ticket-activity";
import type { TimelineEvent } from "@/lib/types";

const ROLE_STYLE: Record<NonNullable<TimelineEvent["role"]>, { card: string; tag: string; label: string }> = {
  requester: { card: "border-l-[3px] border-l-[#c2410c] bg-[#fdf3ea]", tag: "bg-[#fbe2cc] text-[#7c2d12]", label: "Requester" },
  team: { card: "border-l-[3px] border-l-[var(--gold)] bg-[var(--ink-3)]", tag: "bg-[var(--gold-soft)] text-[var(--gold-bright)]", label: "IT team" },
  note: { card: "border-l-[3px] border-l-[#d4a514] bg-[#fdf6d8]", tag: "bg-[#f6e7a6] text-[#5c4708]", label: "Internal" },
  system: { card: "", tag: "", label: "" },
};

const LONG_CHARS = 700;
const LONG_LINES = 10;

function Message({ event, latest }: { event: TimelineEvent; latest: boolean }) {
  const role = event.role ?? (event.internal ? "note" : "team");
  const style = ROLE_STYLE[role];
  const { main, quoted } = useMemo(() => (event.kind === "email" ? splitQuoted(event.body) : { main: event.body, quoted: "" }), [event.body, event.kind]);
  const isLong = main.length > LONG_CHARS || main.split("\n").length > LONG_LINES;
  const [expanded, setExpanded] = useState(false);
  const [showQuoted, setShowQuoted] = useState(false);
  const visible = isLong && !expanded ? `${main.split("\n").slice(0, LONG_LINES).join("\n").slice(0, LONG_CHARS).trimEnd()}…` : main;
  const Icon = role === "note" ? Lock : role === "requester" ? CornerDownLeft : Mail;

  return (
    <article id={`event-${event.id}`} className={`scroll-mt-24 rounded-lg p-4 ${style.card}`}>
      <header className="flex flex-wrap items-center gap-2">
        <Icon size={13} aria-hidden="true" className="shrink-0 opacity-70" />
        <strong className="text-sm">{event.title}</strong>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.tag}`}>{style.label}</span>
        {latest ? <span className="rounded-full bg-[#c2410c] px-2 py-0.5 text-[10px] font-semibold text-white">Latest reply</span> : null}
        <time className="ml-auto text-[11px] muted" dateTime={event.sentAt}>{event.at}</time>
      </header>
      <div className="mt-2">
        {event.kind === "email"
          ? <EmailBody text={visible} attachments={event.attachments} />
          : <p className="whitespace-pre-wrap text-sm leading-7">{visible}</p>}
      </div>
      {isLong || quoted ? (
        <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
          {isLong ? <button type="button" className="text-[var(--gold-bright)] underline-offset-2 hover:underline" onClick={() => setExpanded((value) => !value)}>{expanded ? "Show less" : "Show more"}</button> : null}
          {quoted ? <button type="button" aria-expanded={showQuoted} className="inline-flex items-center gap-1 text-[var(--gold-bright)] underline-offset-2 hover:underline" onClick={() => setShowQuoted((value) => !value)}>{showQuoted ? "Hide quoted text" : "Show quoted text"}<ChevronDown size={12} className={showQuoted ? "rotate-180" : ""} aria-hidden="true" /></button> : null}
        </div>
      ) : null}
      {quoted && showQuoted ? <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded-md border divider bg-[var(--ink)] p-3 font-sans text-xs leading-6 muted">{quoted}</pre> : null}
    </article>
  );
}

/** Ticket history: newest first, grouped by day, with system events as thin one-line rows. */
export function TicketTimeline({ events }: { events: TimelineEvent[] }) {
  const [showSystem, setShowSystem] = useState(true);
  const sorted = useMemo(() => [...events].sort((a, b) => (b.sentAt ?? "").localeCompare(a.sentAt ?? "")), [events]);
  const latestRequesterId = sorted.find((event) => event.role === "requester" && event.title !== "Original request")?.id;
  const shown = showSystem ? sorted : sorted.filter((event) => event.role !== "system");
  const groups = useMemo(() => {
    const out: { label: string; items: TimelineEvent[] }[] = [];
    for (const event of shown) {
      const label = event.sentAt ? dayLabel(new Date(event.sentAt)) : "Earlier";
      if (out[out.length - 1]?.label !== label) out.push({ label, items: [] });
      out[out.length - 1].items.push(event);
    }
    return out;
  }, [shown]);
  const systemCount = sorted.length - sorted.filter((event) => event.role !== "system").length;

  return (
    <section className="card overflow-hidden" aria-labelledby="timeline-heading">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b divider px-5 py-4">
        <div>
          <p className="label">History</p>
          <h2 id="timeline-heading" className="display mt-1 text-xl">Timeline</h2>
        </div>
        {systemCount ? (
          <label className="flex min-h-[36px] cursor-pointer items-center gap-2 text-xs muted">
            <input type="checkbox" checked={showSystem} onChange={(event) => setShowSystem(event.target.checked)} />
            Show system events ({systemCount})
          </label>
        ) : null}
      </div>
      <div className="space-y-6 p-5">
        {groups.length ? groups.map((group) => (
          <div key={group.label}>
            <h3 className="mb-3 flex items-center gap-3 text-xs font-bold muted"><span>{group.label}</span><span className="h-px flex-1 bg-[var(--line)]" aria-hidden="true" /></h3>
            <div className="space-y-3">
              {group.items.map((event) => event.role === "system" ? (
                <div key={event.id} className="flex flex-wrap items-center gap-2 px-1 text-xs muted">
                  <Settings2 size={12} aria-hidden="true" className="shrink-0" />
                  <span className="font-semibold text-[var(--text)]">{event.title}</span>
                  {event.body ? <span>{event.body}</span> : null}
                  <span>by {event.actor.replace("Time to Doom", "System")}</span>
                  <time className="ml-auto text-[11px]" dateTime={event.sentAt}>{event.at}</time>
                </div>
              ) : <Message key={event.id} event={event} latest={event.id === latestRequesterId} />)}
            </div>
          </div>
        )) : <p className="text-sm muted">Nothing here yet.</p>}
      </div>
    </section>
  );
}
