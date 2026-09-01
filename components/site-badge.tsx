import { MapPin } from "lucide-react";
import { sites } from "@/lib/demo-data";

export function SiteBadge({ siteId, compact = false, explain }: { siteId?: string; compact?: boolean; explain?: string }) {
  const site = sites.find((item) => item.id === siteId);
  if (!site) {
    return <span className="chip danger border-[color:var(--red)] bg-[var(--red-soft)]"><MapPin size={11} /> Unrouted</span>;
  }
  return (
    <span className="chip" title={explain ?? site.name}>
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
      {compact ? site.code : site.name}
    </span>
  );
}
