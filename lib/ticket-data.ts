import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { Person, Site, Tech, Ticket, TicketStatus, TimelineEvent } from "@/lib/types";
import { sites as coreSites, techs as coreTechs } from "@/lib/demo-data";

export const hasDatabase = () => Boolean(process.env.DATABASE_URL?.trim());

const statusFromDb: Record<string, TicketStatus> = {
  NEW: "New", TRIAGE: "Triage", IN_PROGRESS: "In progress",
  WAITING_ON_STAFF: "Waiting on staff", WAITING_ON_IT: "Waiting on IT",
  RESOLVED: "Resolved", CLOSED: "Voided", MERGED: "Resolved",
};

const priorityFromDb = { CRITICAL: "Critical", HIGH: "High", NORMAL: "Normal", LOW: "Low" } as const;
export const statusToDb = { "New": "NEW", Triage: "TRIAGE", "In progress": "IN_PROGRESS", "Waiting on staff": "WAITING_ON_STAFF", "Waiting on IT": "WAITING_ON_IT", Resolved: "RESOLVED", Voided: "CLOSED" } as const;
export const priorityToDb = { Critical: "CRITICAL", High: "HIGH", Normal: "NORMAL", Low: "LOW" } as const;

const ticketInclude = {
  site: true,
  person: { include: { aliases: true } },
  assignee: true,
  messages: { orderBy: { sentAt: "asc" as const } },
  digests: { include: { revisions: { orderBy: { revision: "desc" as const }, take: 1 } }, orderBy: { updatedAt: "desc" as const }, take: 1 },
  auditEvents: { include: { actor: true }, orderBy: { createdAt: "asc" as const } },
  mergedInto: { select: { publicId: true } },
} satisfies Prisma.TicketInclude;

type TicketRow = Prisma.TicketGetPayload<{ include: typeof ticketInclude }>;

function relative(date: Date) {
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return date.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
}

export function mapTicket(row: TicketRow): Ticket {
  const firstMessage = row.messages[0];
  const digest = row.digests[0]?.revisions[0];
  const requester = row.person?.fullName || row.personNameAtIntake || firstMessage?.fromName || row.requesterEmailAtIntake.split("@")[0] || "Unknown requester";
  const minutes = row.predictedBreachAt ? Math.max(0, Math.round((row.predictedBreachAt.getTime() - Date.now()) / 60_000)) : 999;
  return {
    id: row.id,
    number: row.publicId,
    subject: row.subject,
    digest: digest?.problemStatement || firstMessage?.textBody || row.subject,
    requester,
    requesterEmail: row.requesterEmailAtIntake,
    requesterRole: row.person?.roleTitle || "Staff",
    siteId: row.siteId ?? undefined,
    status: statusFromDb[row.status] ?? "New",
    priority: priorityFromDb[row.priority],
    assignee: row.assignee?.name,
    category: row.category || "Uncategorized",
    service: row.affectedService || "General IT",
    createdAt: row.createdAt.toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
    updatedAt: relative(row.updatedAt),
    doomMinutes: minutes,
    doomRisk: Math.round((row.predictedBreachRisk ?? 0) * 100),
    frustration: Math.round(row.frustrationScore ?? 0),
    affected: row.affectedCount ?? 1,
    asks: (digest?.asks as string[] | undefined) ?? [],
    missing: (digest?.missingInfo as string[] | undefined) ?? [],
    suggestedAction: digest?.suggestedFirstAction || "Review the request and contact the requester if more detail is needed.",
    originalEmail: firstMessage?.textBody || "Manual request",
    fields: [],
    routingReason: row.site ? `Routed to ${row.site.name}.` : "School has not been assigned yet.",
    flags: row.status === "MERGED" && row.mergedInto ? [`Merged into ${row.mergedInto.publicId}`] : undefined,
  };
}

export async function getTickets() {
  if (!hasDatabase()) return [];
  const rows = await db.ticket.findMany({ include: ticketInclude, orderBy: { createdAt: "desc" } });
  return rows.map(mapTicket);
}

export async function getTicket(id: string) {
  if (!hasDatabase()) return null;
  const row = await db.ticket.findFirst({ where: { OR: [{ id }, { publicId: id }] }, include: ticketInclude });
  return row ? { ticket: mapTicket(row), timeline: mapTimeline(row) } : null;
}

function mapTimeline(row: TicketRow): TimelineEvent[] {
  const messages: TimelineEvent[] = row.messages.map((message) => ({
    id: message.id,
    kind: message.direction === "INTERNAL" ? "note" : "email",
    actor: message.fromName || message.fromAddress,
    title: message.direction === "INTERNAL" ? "Internal note" : message.direction === "OUTBOUND" ? "Public comment" : "Request received",
    body: message.textBody || "",
    at: relative(message.sentAt),
    internal: message.direction === "INTERNAL",
  }));
  const audits: TimelineEvent[] = row.auditEvents
    .filter((event) => !["EMAIL_INGESTED", "OUTBOUND_COMMENT", "INTERNAL_NOTE"].includes(event.action))
    .map((event) => ({ id: event.id, kind: "status", actor: event.actor?.name || "FHQ Tech", title: event.action.replaceAll("_", " ").toLowerCase().replace(/^./, (c) => c.toUpperCase()), body: "Ticket updated.", at: relative(event.createdAt), internal: true }));
  return [...messages, ...audits].sort((a, b) => a.at.localeCompare(b.at));
}

export async function getSites(): Promise<Site[]> {
  if (!hasDatabase()) return coreSites;
  const rows = await db.site.findMany({ include: { primaryTech: true }, orderBy: { code: "asc" } });
  return rows.map((site) => ({ id: site.id, code: site.code, name: site.name, color: site.color, address: site.address || "", timezone: site.timezone, primaryTech: site.primaryTech?.name || "Unassigned", domain: site.mailDomains[0] }));
}

export async function getTechs(): Promise<Tech[]> {
  if (!hasDatabase()) return coreTechs;
  const rows = await db.user.findMany({ where: { active: true, role: { in: ["ADMIN", "TECH"] } }, include: { assignedTickets: { where: { status: { notIn: ["RESOLVED", "CLOSED", "MERGED"] } } }, primarySites: true }, orderBy: { name: "asc" } });
  return rows.map((user) => ({ id: user.id, name: user.name, initials: user.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2), color: "#256b73", open: user.assignedTickets.length, capacity: 12, sites: user.primarySites.map((site) => site.code), status: "Available" }));
}

export async function getPeople(): Promise<Person[]> {
  if (!hasDatabase()) return [];
  const rows = await db.person.findMany({ where: { mergedIntoId: null }, include: { aliases: true }, orderBy: { fullName: "asc" } });
  return rows.map((person) => ({ id: person.id, name: person.fullName, email: person.aliases.find((alias) => alias.isPrimary)?.email || person.aliases[0]?.email || "", aliases: person.aliases.filter((alias) => !alias.isPrimary).map((alias) => alias.email), role: person.roleTitle || "", department: person.department || "", room: "", phone: person.phone || "", siteId: person.siteId ?? undefined, active: person.active }));
}
