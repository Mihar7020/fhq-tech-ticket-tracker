"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, BookmarkPlus, GripVertical, LayoutDashboard, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/page-header";
import { DoomMeter } from "@/components/doom-meter";
import { PriorityBadge } from "@/components/status-badge";
import { SiteBadge } from "@/components/site-badge";
import { useApp } from "@/components/app-providers";
import { sites, tickets as initialTickets } from "@/lib/demo-data";
import type { Ticket } from "@/lib/types";

type GroupMode = "site" | "status" | "priority" | "assignee" | "category" | "risk";

const getGroup = (ticket: Ticket, mode: GroupMode) => {
  if (mode === "site") return ticket.siteId ?? "unrouted";
  if (mode === "assignee") return ticket.assignee ?? "Unassigned";
  if (mode === "risk") return ticket.doomRisk >= 80 ? "At risk" : ticket.doomRisk >= 50 ? "Watch" : "Healthy";
  return ticket[mode];
};

export function BoardView() {
  const [mode, setMode] = useState<GroupMode>("site");
  const [boardTickets, setBoardTickets] = useState(initialTickets.filter((ticket) => ticket.status !== "Resolved"));
  const [dragId, setDragId] = useState<string>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useApp();

  const groups = useMemo(() => {
    if (mode === "site") {
      return [{ key: "unrouted", label: "Unrouted", color: "#d94a3a" }, ...sites.map((site) => ({ key: site.id, label: site.code, long: site.name, color: site.color }))];
    }

    const keys = Array.from(new Set(boardTickets.map((ticket) => String(getGroup(ticket, mode)))));
    return keys.map((key, index) => ({ key, label: key, color: index === 0 ? "#256b73" : "#8d867a" }));
  }, [mode, boardTickets]);

  function moveTo(group: string) {
    if (!dragId) return;
    setBoardTickets((current) => current.map((ticket) => {
      if (ticket.id !== dragId) return ticket;
      if (mode === "site") return { ...ticket, siteId: group === "unrouted" ? undefined : group };
      if (mode === "assignee") return { ...ticket, assignee: group === "Unassigned" ? undefined : group };
      if (mode === "status") return { ...ticket, status: group as Ticket["status"] };
      if (mode === "priority") return { ...ticket, priority: group as Ticket["priority"] };
      return ticket;
    }));
    toast(`Ticket moved to ${groups.find((item) => item.key === group)?.label} - undo available`);
    setDragId(undefined);
  }

  function scrollBoard(event: React.WheelEvent<HTMLDivElement>) {
    const element = scrollRef.current;
    if (!element || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
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
              <section key={group.key} className="card-quiet min-h-[560px] overflow-hidden" onDragOver={(event) => event.preventDefault()} onDrop={() => moveTo(group.key)}>
                <header className="sticky top-0 z-10 border-b divider bg-[var(--ink-2)] p-4" style={{ boxShadow: `inset 0 3px 0 ${group.color}` }}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="grid min-w-7 place-items-center rounded-lg px-1.5 py-1 text-[10px] font-black text-white" style={{ background: group.color }}>{group.label}</span>
                        <strong className="truncate">{"long" in group ? group.long : group.label}</strong>
                      </div>
                    </div>
                    <span className="chip">{groupTickets.length}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[10px] muted">
                    <span>{atRisk ? <span className="danger flex items-center gap-1"><AlertTriangle size={10} /> {atRisk} at risk</span> : "No immediate risk"}</span>
                    <span>{Math.round(groupTickets.reduce((sum, item) => sum + item.doomRisk, 0) / Math.max(groupTickets.length, 1))}% avg</span>
                  </div>
                </header>
                <div className="space-y-2 p-2">
                  {groupTickets.length ? groupTickets.map((ticket, index) => (
                    <motion.article
                      layout
                      draggable
                      onDragStart={() => setDragId(ticket.id)}
                      key={ticket.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * .035, .25) }}
                      className="group cursor-grab rounded-lg border divider bg-[var(--ink-3)] p-3 shadow-sm active:cursor-grabbing"
                    >
                      <div className="mb-3 flex items-start gap-2">
                        <GripVertical size={14} className="muted mt-0.5 opacity-0 transition group-hover:opacity-100" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between"><span className="font-mono text-[10px] muted">{ticket.number}</span><PriorityBadge priority={ticket.priority} /></div>
                          <Link href={`/tickets/${ticket.id}`} className="mt-1.5 block font-semibold leading-snug hover:text-[var(--gold-bright)]">{ticket.subject}</Link>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2"><SiteBadge siteId={ticket.siteId} compact /><DoomMeter minutes={ticket.doomMinutes} risk={ticket.doomRisk} compact /></div>
                      <div className="mt-3 flex items-center justify-between border-t divider pt-2 text-[10px] muted"><span>{ticket.requester}</span><span>{ticket.assignee?.split(" ")[0] ?? "Unassigned"}</span></div>
                    </motion.article>
                  )) : (
                    <div className="grid min-h-32 place-items-center rounded-lg border border-dashed divider p-5 text-center">
                      <div>
                        <p className="font-semibold">Column clear</p>
                        <p className="muted mt-1 text-[10px]">Drop a ticket here to re-route it.</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <p className="muted text-[10px]">Accessible alternative: open a ticket and use the labeled school or assignment controls.</p>
    </div>
  );
}
