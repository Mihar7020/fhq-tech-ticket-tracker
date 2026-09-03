import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasDatabase } from "@/lib/ticket-data";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const [ticketCount, incidentCount, directoryCount] = hasDatabase() ? await Promise.all([
    db.ticket.count({ where: { status: { notIn: ["RESOLVED", "CLOSED", "MERGED"] } } }),
    db.incident.count({ where: { status: { not: "RESOLVED" } } }),
    db.person.count({ where: { active: true, mergedIntoId: null } }),
  ]) : [0, 0, 0];
  return <Suspense fallback={<div className="min-h-screen bg-[var(--ink)]" />}><AppShell session={session} counts={{ tickets: ticketCount, incidents: incidentCount, directory: directoryCount }}>{children}</AppShell></Suspense>;
}
