"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, BookmarkPlus, GripVertical, LayoutDashboard, Printer, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/page-header";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { SiteBadge } from "@/components/site-badge";
import { useApp } from "@/components/app-providers";
import { isActiveTicket } from "@/lib/ticket-status";
import type { Site, Ticket } from "@/lib/types";

type GroupMode = "site" | "status" | "priority" | "assignee" | "category" | "risk";

const getGroup = (ticket: Ticket, mode: GroupMode) => {
  if (mode === "site") return ticket.siteId ?? "unrouted";
  if (mode === "assignee") return ticket.assignee ?? "Unassigned";
  if (mode === "risk") return ticket.doomRisk >= 80 ? "At risk" : ticket.doomRisk >= 50 ? "Watch" : "Healthy";
  return ticket[mode];
};

export function BoardView({ sites, initialTickets }: { sites: Site[]; initialTickets: Ticket[] }) {
  const [mode, setMode] = useState<GroupMode>("site");
  const [boardTickets, setBoardTickets] = useState(initialTickets.filter(isActiveTicket));
  const [dragId, setDragId] = useState<string>();
  const [savingId, setSavingId] = useState<string>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useApp();
  const router = useRouter();

  const groups = useMemo(() => {
    if (mode === "site") {
      return [{ key: "unrouted", label: "Unrouted", color: "#d94a3a" }, ...sites.map((site) => ({ key: site.id, label: site.code, long: site.name, color: site.color }))];
    }

    const keys = Array.from(new Set(boardTickets.map((ticket) => String(getGroup(ticket, mode)))));
    return keys.map((key, index) => ({ key, label: key, color: index === 0 ? "#256b73" : "#8d867a" }));
  }, [mode, boardTickets, sites]);

  async function moveTo(group: string) {
    if (!dragId || mode !== "site" || savingId) return;
    const ticket = boardTickets.find((item) => item.id === dragId);
    if (!ticket) return;
    const nextSiteId = group === "unrouted" ? undefined : group;
    const previousSiteId = ticket.siteId;
    setDragId(undefined);
    if (previousSiteId === nextSiteId) return;

    setSavingId(ticket.id);
    setBoardTickets((current) => current.map((item) => item.id === ticket.id ? { ...item, siteId: nextSiteId } : item));
    const response = await fetch(`/api/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId: nextSiteId ?? null }),
    });
    setSavingId(undefined);
    if (!response.ok) {
      setBoardTickets((current) => current.map((item) => item.id === ticket.id ? { ...item, siteId: previousSiteId } : item));
      toast("Could not update the ticket school. It was moved back.");
      return;
    }
    const destination = groups.find((item) => item.key === group)?.label ?? "Unrouted";
    toast(`${ticket.number} assigned to ${destination}`);
    router.refresh();
  }

  function scrollBoard(event: React.WheelEvent<HTMLDivElement>) {
    const element = scrollRef.current;
    if (!element || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    const target = event.target as HTMLElement;
    const verticalScroller = target.closest("[data-board-column-scroll]");
    if (verticalScroller) return;
    event.preventDefault();
    element.scrollLeft += event.deltaY;
  }

  return (
    <div className="page-wrap max-w-none">
      <PageHeader
        eyebrow="Schools"
        title="School board"
        description="A side-by-side view of tickets by school. Scroll over the board to move left and right."
        actions={
          <>
            <button className="btn"><BookmarkPlus size={15} /> Save view</button>
            <button className="btn btn-primary"><LayoutDashboard size={15} /> Share view</button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="label mr-1">Group by</span>
        {(["site", "status", "priority", "assignee", "category", "risk"] as GroupMode[]).map((item) => (
          <button key={item} className={`btn min-h-8 px-3 text-xs capitalize ${mode === item ? "btn-primary" : ""}`} onClick={() => setMode(item)}>
            {item === "risk" ? "SLA risk" : item}
          </button>
        ))}
        <button className="btn icon-btn ml-auto min-h-8" aria-label="Board filters"><SlidersHorizontal size={14} /></button>
      </div>

      <div ref={scrollRef} onWheel={scrollBoard} className="overflow-x-auto pb-5">
        <div className="grid min-w-max grid-flow-col auto-cols-[300px] gap-3">
          {groups.map((group) => {
            const groupTickets = boardTickets.filter((ticket) => String(getGroup(ticket, mode)) === group.key);
            const atRisk = groupTickets.filter((ticket) => ticket.doomRisk >= 80).length;
            return (
              <section key={group.key} className="card-quiet min-h-[560px] overflow-hidden" onDragOver={(event) => { if (mode === "site") event.preventDefault(); }} onDrop={() => void moveTo(group.key)}>
                <header className="sticky top-0 z-10 border-b divider bg-[var(--ink-2)] p-4" style={{ boxShadow: `inset 0 3px 0 ${group.color}` }}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="grid min-w-7 place-items-center rounded-lg px-1.5 py-1 text-[10px] font-black text-white" style={{ background: group.color }}>{group.label}</span>
                        <strong className="truncate">{"long" in group ? group.long : group.label}</strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="chip">{groupTickets.length}</span>
                      {mode === "site" && group.key !== "unrouted" ? <Link href={`/sites/${group.key}`} className="btn icon-btn h-7 min-h-7 w-7" aria-label={`Select and print tickets for ${"long" in group ? group.long : group.label}`}><Printer size={12} /></Link> : null}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[10px] muted">
                    <span>{atRisk ? <span className="danger flex items-center gap-1"><AlertTriangle size={10} /> {atRisk} at risk</span> : "No immediate risk"}</span>
                    <span>{Math.round(groupTickets.reduce((sum, item) => sum + item.doomRisk, 0) / Math.max(groupTickets.length, 1))}% avg</span>
                  </div>
                </header>
                <div data-board-column-scroll className="max-h-[520px] space-y-2 overflow-y-auto overscroll-contain p-2 pr-1">
                  {groupTickets.length ? groupTickets.map((ticket, index) => (
                    <motion.article
                      layout
                      draggable={mode === "site" && !savingId}
                      onDragStart={() => setDragId(ticket.id)}
                      key={ticket.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * .035, .25) }}
                      className={`group rounded-lg border divider bg-[var(--ink-3)] p-3 shadow-sm ${mode === "site" ? "cursor-grab active:cursor-grabbing" : ""} ${savingId === ticket.id ? "opacity-60" : ""}`}
                    >
                      <div className="mb-3 flex items-start gap-2">
                        <GripVertical size={14} className="muted mt-0.5 opacity-0 transition group-hover:opacity-100" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between"><span className="font-mono text-[10px] muted">{ticket.number}</span><PriorityBadge priority={ticket.priority} /></div>
                          <Link href={`/tickets/${ticket.id}`} className="mt-1.5 block font-semibold leading-snug hover:text-[var(--gold-bright)]">{ticket.subject}</Link>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2"><SiteBadge siteId={ticket.siteId} compact /><StatusBadge status={ticket.status} /></div>
                      <div className="mt-3 flex items-center justify-between border-t divider pt-2 text-[10px] muted"><span>{ticket.requester}</span><span>{ticket.assignee?.split(" ")[0] ?? "Unassigned"}</span></div>
                    </motion.article>
                  )) : (
                    <div className="grid min-h-32 place-items-center rounded-lg border border-dashed divider p-5 text-center">
                      <div>
                        <p className="font-semibold">Column clear</p>
                        <p className="muted mt-1 text-[10px]">{mode === "site" ? "Drop a ticket here to assign its school." : "No active tickets in this group."}</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <p className="muted text-[10px]">Drag between school columns to update routing. Accessible alternative: open a ticket and use the labeled school control.</p>
    </div>
  );
}
