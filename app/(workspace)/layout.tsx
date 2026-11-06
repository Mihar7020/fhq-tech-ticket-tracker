import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { SilentRefresh } from "@/components/silent-refresh";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasDatabase } from "@/lib/ticket-data";`nimport { replyState } from "@/lib/ticket-status";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const [ticketCount, incidentCount, directoryCount] = hasDatabase() ? await Promise.all([
    db.ticket.count({ where: { status: { notIn: ["RESOLVED", "CLOSED", "MERGED"] } } }),
    db.incident.count({ where: { status: { not: "RESOLVED" } } }),
    db.person.count({ where: { active: true, mergedIntoId: null } }),
  ]) : [0, 0, 0];
  // Open tickets where the requester replied after the team's last reply.
  const replyCount = hasDatabase()
    ? (await db.ticket.findMany({ where: { status: { notIn: ["RESOLVED", "CLOSED", "MERGED"] } }, select: { status: true, messages: { select: { id: true, direction: true, sentAt: true, fromName: true, fromAddress: true }, orderBy: { sentAt: "asc" } } } }))
        .filter((ticket) => replyState(ticket.messages, [], ticket.status).awaitingReply).length
    : 0;
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--ink)]" />}>
      <AppShell
        session={session}
        counts={{ tickets: ticketCount, incidents: incidentCount, directory: directoryCount, replies: replyCount }}
      >
        <SilentRefresh />
        {children}
      </AppShell>
    </Suspense>
  );
}