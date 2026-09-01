import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { SiteBadge } from "@/components/site-badge";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import type { Ticket } from "@/lib/types";

export function TicketRow({ ticket, compact = false }: { ticket: Ticket; compact?: boolean }) {
  return (
    <Link href={`/tickets/${ticket.id}`} className={`group grid items-center gap-3 border-b divider px-4 transition-colors last:border-0 hover:bg-[var(--ink-3)]/70 sm:px-5 ${compact ? "min-h-16 py-2" : "min-h-[78px] py-3"}`}>
      <div className="flex min-w-0 items-start gap-3">
        <span className="muted mt-0.5 hidden w-20 shrink-0 font-mono text-[11px] sm:block">{ticket.number}</span>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5 sm:hidden">
            <span className="muted font-mono text-[10px]">{ticket.number}</span>
            <PriorityBadge priority={ticket.priority} />
          </div>
          <h3 className="truncate font-semibold tracking-normal group-hover:text-[var(--gold-bright)]">{ticket.subject}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] muted">
            <span>{ticket.requester}</span>
            <span aria-hidden>-</span>
            <SiteBadge siteId={ticket.siteId} compact />
            <span className="hidden md:inline">{ticket.updatedAt}</span>
            {ticket.flags?.slice(0, 1).map((flag) => <span key={flag} className="danger flex items-center gap-1"><AlertTriangle size={10} />{flag}</span>)}
          </div>
        </div>
      </div>
      <div className="hidden items-center gap-3 sm:flex">
        <div className="w-28"><StatusBadge status={ticket.status} /></div>
        <div className="w-20"><PriorityBadge priority={ticket.priority} /></div>
        <div className="w-28 text-xs muted">{ticket.assignee?.split(" ")[0] ?? "Unassigned"}</div>
        <ChevronRight size={16} className="muted transition-transform group-hover:translate-x-1" />
      </div>
      <div className="flex items-center justify-between sm:hidden"><StatusBadge status={ticket.status} /><span className="text-xs muted">{ticket.assignee?.split(" ")[0] ?? "Unassigned"}</span></div>
    </Link>
  );
}
