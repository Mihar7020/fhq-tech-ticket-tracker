import { MapPin } from "lucide-react";
import { sites as demoSites } from "@/lib/demo-data";

type SiteLite = { id?: string; code: string; name: string };

/**
 * School pill. Uses the real school from the database: either passed directly (`site`) or looked up in
 * the `sites` list the page loaded. The built-in demo list is only a last resort, so schools added in
 * the database (like Office) show correctly instead of falling back to "Unrouted".
 */
export function SiteBadge({ siteId, site, sites, compact = false, explain }: { siteId?: string; site?: SiteLite; sites?: SiteLite[]; compact?: boolean; explain?: string }) {
  const resolved = site ?? (siteId ? sites?.find((item) => item.id === siteId) ?? demoSites.find((item) => item.id === siteId) : undefined);
  if (!siteId && !site) {
    return <span className="chip danger border-[color:var(--red)] bg-[var(--red-soft)]"><MapPin size={11} /> Unrouted</span>;
  }
  return (
    <span className="chip" title={explain ?? resolved?.name ?? "School assigned"}>
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)]" />
      {resolved ? (compact ? resolved.code : resolved.name) : "School"}
    </span>
  );
}
