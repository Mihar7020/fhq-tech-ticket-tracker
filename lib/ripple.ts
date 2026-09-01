export type ClusterTicket = { id: string; siteId?: string; fingerprint: string; createdAt: number };
export function findRippleClusters(tickets: ClusterTicket[], windowMs = 90 * 60 * 1000) {
  const grouped = new Map<string, ClusterTicket[]>();
  for (const ticket of tickets) { const current = grouped.get(ticket.fingerprint) ?? []; current.push(ticket); grouped.set(ticket.fingerprint, current); }
  return [...grouped.entries()].flatMap(([fingerprint, members]) => {
    const recent = members.filter((member) => Math.max(...members.map((item) => item.createdAt)) - member.createdAt <= windowMs);
    if (recent.length < 3) return [];
    const sites = new Set(recent.map((member) => member.siteId).filter(Boolean));
    return [{ fingerprint, ticketIds: recent.map((member) => member.id), scope: sites.size > 1 ? "division-wide" as const : "local" as const, siteIds: [...sites] }];
  });
}
