"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { LIST_CONTEXT_KEY } from "@/lib/ticket-filters";

type ListContext = { ids: string[]; href: string; label: string };

const subscribe = () => () => {};
const readContext = () => { try { return window.sessionStorage.getItem(LIST_CONTEXT_KEY); } catch { return null; } };

/**
 * "← Tickets" back to the exact filtered list you came from, plus Previous / Next through that same
 * list (e.g. every open SBEC ticket). Falls back to a plain "← Tickets" when opened directly.
 */
export function TicketNav({ ticketId }: { ticketId: string }) {
  const raw = useSyncExternalStore(subscribe, readContext, () => null);
  const context = useMemo<ListContext | null>(() => {
    try { const value = raw ? JSON.parse(raw) as ListContext : null; return value && Array.isArray(value.ids) ? value : null; } catch { return null; }
  }, [raw]);
  const index = context ? context.ids.indexOf(ticketId) : -1;
  const prev = index > 0 ? context!.ids[index - 1] : undefined;
  const next = index >= 0 && index < context!.ids.length - 1 ? context!.ids[index + 1] : undefined;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link href={context?.href ?? "/tickets"} className="flex items-center gap-2 text-xs font-semibold muted hover:text-[var(--text)]"><ArrowLeft size={15} /> Tickets</Link>
      {index >= 0 && context ? (
        <nav aria-label="Tickets in this list" className="flex items-center gap-1 text-xs muted">
          {prev ? <Link href={`/tickets/${prev}`} className="btn min-h-[32px] px-2 text-xs" aria-label="Previous ticket"><ChevronLeft size={14} /> Prev</Link> : <span className="btn min-h-[32px] px-2 text-xs opacity-40" aria-disabled="true"><ChevronLeft size={14} /> Prev</span>}
          <span className="px-1 tabular-nums">{index + 1} of {context.ids.length} · {context.label}</span>
          {next ? <Link href={`/tickets/${next}`} className="btn min-h-[32px] px-2 text-xs" aria-label="Next ticket">Next <ChevronRight size={14} /></Link> : <span className="btn min-h-[32px] px-2 text-xs opacity-40" aria-disabled="true">Next <ChevronRight size={14} /></span>}
        </nav>
      ) : null}
    </div>
  );
}
