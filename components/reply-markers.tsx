import { CornerDownLeft, RotateCcw } from "lucide-react";
import type { Ticket } from "@/lib/types";

/** Small tag for lists and board cards: "Reopened" or "New reply". Nothing when neither applies. */
export function ReplyTag({ ticket }: { ticket: Pick<Ticket, "reopenedBy" | "awaitingReply"> }) {
  if (ticket.reopenedBy) return <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#c2410c] px-2 py-0.5 text-[10px] font-bold text-white"><RotateCcw size={10} aria-hidden="true" />Reopened</span>;
  if (ticket.awaitingReply) return <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#fbe2cc] px-2 py-0.5 text-[10px] font-bold text-[#7c2d12]"><CornerDownLeft size={10} aria-hidden="true" />New reply</span>;
  return null;
}

const ago = (iso: string) => {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hr ago`;
  return `${Math.floor(minutes / 1440)} days ago`;
};

/** Ticket-page banner: who reopened it (or replied), when, and a jump to their message. */
export function ReplyBanner({ ticket }: { ticket: Pick<Ticket, "reopenedBy" | "awaitingReply" | "requester"> }) {
  if (!ticket.reopenedBy && !ticket.awaitingReply) return null;
  const reopened = ticket.reopenedBy;
  return (
    <section role="status" className="card mb-5 flex flex-wrap items-center gap-3 border-[#f2b98d] bg-[#fdf3ea] p-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#c2410c] text-white">{reopened ? <RotateCcw size={16} aria-hidden="true" /> : <CornerDownLeft size={16} aria-hidden="true" />}</span>
      <p className="flex-1 text-sm">
        {reopened
          ? <><strong>Reopened by {reopened.name}</strong> <span className="muted">· {ago(reopened.at)}. They replied after it was resolved.</span></>
          : <><strong>New reply from {ticket.requester}</strong> <span className="muted">· waiting on the IT team.</span></>}
      </p>
      <a href={reopened?.replyId ? `#event-${reopened.replyId}` : "#timeline-heading"} className="btn min-h-[40px] text-sm">View reply</a>
    </section>
  );
}
