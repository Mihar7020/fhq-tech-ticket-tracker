import clsx from "clsx";
import { Clock3 } from "lucide-react";

export function DoomMeter({ minutes, risk, compact = false }: { minutes: number; risk: number; compact?: boolean }) {
  if (risk === 0) return <span className="chip text-[var(--green)]">Resolved</span>;
  const high = risk >= 80;
  const medium = risk >= 55;
  const label = minutes < 60 ? `${minutes}m` : minutes < 1440 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${Math.floor(minutes / 1440)}d`;
  const color = high ? "#ff536b" : medium ? "#e8a84a" : "#79b58b";
  return <div className={clsx("min-w-24", compact && "min-w-20")} title={`${Math.round(risk)}% predicted SLA breach risk`}><div className="mb-1 flex items-center justify-between gap-2"><span className="flex items-center gap-1 text-xs font-bold" style={{ color }}><Clock3 size={12} />{label}</span>{!compact && <span className="muted text-[10px]">{Math.round(risk)}%</span>}</div><div className="h-1 overflow-hidden rounded-full bg-[var(--ink-3)]"><div className="h-full rounded-full transition-all" style={{ width: `${risk}%`, background: color }} /></div></div>;
}
