import { db } from "@/lib/db";
import { hasDatabase } from "@/lib/ticket-data";

const statusLabels = {
  NEW: "New",
  TRIAGE: "Triage",
  IN_PROGRESS: "In progress",
  WAITING_ON_STAFF: "Waiting on staff",
  WAITING_ON_IT: "Waiting on IT",
  RESOLVED: "Resolved",
  CLOSED: "Voided",
  MERGED: "Merged",
} as const;

const priorityLabels = {
  CRITICAL: "Critical",
  HIGH: "High",
  NORMAL: "Normal",
  LOW: "Low",
} as const;

export type ReportData = Awaited<ReturnType<typeof getReportData>>;

export async function getReportData() {
  const generatedAt = new Date();
  if (!hasDatabase()) {
    return {
      generatedAt: generatedAt.toISOString(),
      connected: false,
      totals: { tickets: 0, open: 0, new: 0, resolved: 0, voided: 0, averageResolutionHours: null as number | null },
      byStatus: [] as Array<{ label: string; count: number }>,
      bySchool: [] as Array<{ code: string; name: string; total: number; open: number; resolved: number; voided: number }>,
      byTechnician: [] as Array<{ name: string; open: number; resolved: number; total: number }>,
      tickets: [] as Array<{ id: string; number: string; subject: string; requester: string; school: string; technician: string; status: string; priority: string; createdAt: string; updatedAt: string }>,
      audit: [] as Array<{ id: string; ticketNumber: string; action: string; actor: string; createdAt: string }>,
    };
  }

  const [tickets, sites, technicians, auditRows] = await Promise.all([
    db.ticket.findMany({
      select: {
        id: true, publicId: true, subject: true, requesterEmailAtIntake: true,
        personNameAtIntake: true, status: true, priority: true, createdAt: true,
        updatedAt: true, resolvedAt: true, site: { select: { code: true, name: true } },
        assignee: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.site.findMany({ select: { id: true, code: true, name: true }, orderBy: { code: "asc" } }),
    db.user.findMany({
      where: { active: true, role: { in: ["ADMIN", "TECH"] } },
      select: { id: true, name: true }, orderBy: { name: "asc" },
    }),
    db.auditLog.findMany({
      where: { ticketId: { not: null } },
      select: {
        id: true, action: true, createdAt: true,
        actor: { select: { name: true } },
        ticket: { select: { publicId: true } },
      },
      orderBy: { createdAt: "desc" }, take: 100,
    }),
  ]);

  const isOpen = (status: keyof typeof statusLabels) => !["RESOLVED", "CLOSED", "MERGED"].includes(status);
  const resolvedTickets = tickets.filter((ticket) => ticket.resolvedAt);
  const averageResolutionHours = resolvedTickets.length
    ? Math.round((resolvedTickets.reduce((sum, ticket) => sum + (ticket.resolvedAt!.getTime() - ticket.createdAt.getTime()), 0) / resolvedTickets.length / 3_600_000) * 10) / 10
    : null;

  const byStatus = Object.entries(statusLabels)
    .map(([status, label]) => ({ label, count: tickets.filter((ticket) => ticket.status === status).length }))
    .filter((row) => row.count > 0);

  return {
    generatedAt: generatedAt.toISOString(),
    connected: true,
    totals: {
      tickets: tickets.length,
      open: tickets.filter((ticket) => isOpen(ticket.status)).length,
      new: tickets.filter((ticket) => ticket.status === "NEW").length,
      resolved: tickets.filter((ticket) => ticket.status === "RESOLVED").length,
      voided: tickets.filter((ticket) => ticket.status === "CLOSED").length,
      averageResolutionHours,
    },
    byStatus,
    bySchool: sites.map((site) => {
      const schoolTickets = tickets.filter((ticket) => ticket.site?.code === site.code);
      return {
        code: site.code, name: site.name, total: schoolTickets.length,
        open: schoolTickets.filter((ticket) => isOpen(ticket.status)).length,
        resolved: schoolTickets.filter((ticket) => ticket.status === "RESOLVED").length,
        voided: schoolTickets.filter((ticket) => ticket.status === "CLOSED").length,
      };
    }),
    byTechnician: technicians.map((technician) => {
      const assigned = tickets.filter((ticket) => ticket.assignee?.name === technician.name);
      return {
        name: technician.name, total: assigned.length,
        open: assigned.filter((ticket) => isOpen(ticket.status)).length,
        resolved: assigned.filter((ticket) => ticket.status === "RESOLVED").length,
      };
    }),
    tickets: tickets.slice(0, 250).map((ticket) => ({
      id: ticket.id,
      number: ticket.publicId,
      subject: ticket.subject,
      requester: ticket.personNameAtIntake || ticket.requesterEmailAtIntake,
      school: ticket.site?.code || "Unrouted",
      technician: ticket.assignee?.name || "Unassigned",
      status: statusLabels[ticket.status],
      priority: priorityLabels[ticket.priority],
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
    })),
    audit: auditRows.map((row) => ({
      id: row.id,
      ticketNumber: row.ticket?.publicId || "—",
      action: row.action.replaceAll("_", " ").toLowerCase().replace(/^./, (letter) => letter.toUpperCase()),
      actor: row.actor?.name || "System",
      createdAt: row.createdAt.toISOString(),
    })),
  };
}
