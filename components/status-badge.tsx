import type { Priority, TicketStatus } from "@/lib/types";

const statusStyles: Record<TicketStatus, { color: string; background: string; border: string }> = {
  New: { color: "var(--gold-bright)", background: "var(--gold-soft)", border: "rgba(224, 163, 22, .38)" },
  Triage: { color: "var(--text)", background: "var(--ink-3)", border: "var(--line-strong)" },
  "In progress": { color: "var(--text)", background: "var(--ink-3)", border: "var(--line-strong)" },
  "Waiting on staff": { color: "var(--muted)", background: "var(--ink-3)", border: "var(--line)" },
  "Waiting on IT": { color: "var(--muted)", background: "var(--ink-3)", border: "var(--line)" },
  Resolved: { color: "var(--green)", background: "rgba(111, 159, 120, .10)", border: "rgba(111, 159, 120, .35)" },
};

const priorityStyles: Record<Priority, { color: string; background: string; border: string }> = {
  Critical: { color: "#f17869", background: "var(--red-soft)", border: "rgba(217, 74, 58, .40)" },
  High: { color: "var(--gold-bright)", background: "var(--gold-soft)", border: "rgba(224, 163, 22, .35)" },
  Normal: { color: "var(--muted)", background: "var(--ink-3)", border: "var(--line)" },
  Low: { color: "var(--muted)", background: "var(--ink-3)", border: "var(--line)" },
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  const style = statusStyles[status];
  return (
    <span className="chip" style={{ color: style.color, borderColor: style.border, background: style.background }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.color }} />
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const style = priorityStyles[priority];
  return <span className="chip" style={{ color: style.color, borderColor: style.border, background: style.background }}>{priority}</span>;
}
