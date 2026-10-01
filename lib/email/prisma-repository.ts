import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { IngestRecord, IngestRepository } from "@/lib/email/ingest";

export const prismaIngestRepository: IngestRepository = {
  async listPeople() {
    const rows = await db.person.findMany({ where: { active: true, mergedIntoId: null }, include: { aliases: true } });
    return rows.map((person) => ({ id: person.id, name: person.fullName, email: person.aliases.find((alias) => alias.isPrimary)?.email ?? person.aliases[0]?.email ?? "", aliases: person.aliases.filter((alias) => !alias.isPrimary).map((alias) => alias.email), role: person.roleTitle ?? "", department: person.department ?? "", room: person.room ?? "", phone: person.phone ?? "", siteId: person.siteId ?? undefined, active: person.active, metadata: (person.metadata ?? undefined) as Record<string, string> | undefined }));
  },
  async listSites() {
    const rows = await db.site.findMany();
    return rows.map((site) => ({ id: site.id, code: site.code, name: site.name, color: site.color, address: site.address ?? "", timezone: site.timezone, primaryTech: "", domain: site.mailDomains[0], bellSchedule: site.bellSchedule ? JSON.stringify(site.bellSchedule) : undefined }));
  },
  async listThreadMessages() {
    const rows = await db.message.findMany({ select: { internetMessageId: true, subject: true, threadId: true }, where: { threadId: { not: null } }, orderBy: { sentAt: "desc" }, take: 20_000 });
    return rows.map((row) => ({ messageId: row.internetMessageId, subject: row.subject, threadId: row.threadId! }));
  },
  async save(record: IngestRecord) {
    return db.$transaction(async (tx) => {
      if (record.threadMatch.kind === "match") {
        const thread = await tx.emailThread.findUniqueOrThrow({ where: { id: record.threadMatch.threadId }, include: { ticket: true } });
        await tx.message.create({ data: messageData(record, thread.ticketId, thread.id) });
        await tx.emailThread.update({ where: { id: thread.id }, data: { lastMessageAt: record.sentAt, weldedMessageCount: { increment: 1 } } });
        await tx.auditLog.create({ data: { entityType: "Ticket", entityId: thread.ticketId, ticketId: thread.ticketId, action: "EMAIL_WELDED", after: { internetMessageId: record.internetMessageId } } });
        return { ticketId: thread.ticketId, publicId: thread.ticket.publicId };
      }
      const team = await tx.team.findUnique({ where: { slug: "fhq-tech" } });
      const created = await tx.ticket.create({ data: { publicId: record.publicId, subject: record.subject, requesterEmailAtIntake: record.senderEmail, personNameAtIntake: record.senderName, siteId: record.route.outcome === "exact" || record.route.outcome === "domain" ? record.route.siteId : undefined, personId: record.route.outcome === "exact" ? record.route.personId : undefined, siteNameAtIntake: record.route.siteId ? (await tx.site.findUnique({ where: { id: record.route.siteId } }))?.name : undefined, category: record.triage.category, affectedService: record.triage.service, priority: record.triage.priority.toUpperCase() as "CRITICAL" | "HIGH" | "NORMAL" | "LOW", urgency: record.triage.urgency, impact: record.triage.impact, routingConfidence: record.route.confidence, status: record.route.outcome === "unknown" || record.route.outcome === "conflict" ? "TRIAGE" : "NEW", teamId: team?.id } });
      const ticket = await tx.ticket.update({ where: { id: created.id }, data: { publicId: `FHQ-${String(created.number).padStart(4, "0")}` } });
      const thread = await tx.emailThread.create({ data: { ticketId: ticket.id, normalizedSubject: record.normalizedSubject, lastMessageAt: record.sentAt } });
      await tx.message.create({ data: messageData(record, ticket.id, thread.id) });
      await tx.routingDecision.create({ data: { ticketId: ticket.id, outcome: record.route.outcome === "exact" ? "EXACT" : record.route.outcome === "domain" ? "DOMAIN" : record.route.outcome === "conflict" ? "CONFLICT" : record.route.outcome === "unknown" ? "UNKNOWN" : "SUGGESTED", confidence: record.route.confidence, rationale: { text: record.route.rationale }, signals: record.route.signals as unknown as Prisma.InputJsonValue, siteId: record.route.siteId } });
      if (record.digest.available) { await tx.digest.create({ data: { ticketId: ticket.id, revisions: { create: { revision: 1, problemStatement: record.digest.problemStatement!, asks: record.digest.asks, missingInfo: record.digest.missingInfo, confidence: record.digest.confidence } } } }); }
      await tx.auditLog.create({ data: { entityType: "Ticket", entityId: ticket.id, ticketId: ticket.id, action: "EMAIL_INGESTED", after: { messageId: record.internetMessageId, route: record.route.outcome } } });
      return { ticketId: ticket.id, publicId: ticket.publicId };
    });
  },
};

function messageData(record: IngestRecord, ticketId: string, threadId: string) {
  return { internetMessageId: record.internetMessageId, inReplyTo: record.inReplyTo, references: record.references, direction: "INBOUND" as const, fromAddress: record.senderEmail, fromName: record.senderName, toAddresses: record.recipients, ccAddresses: [], subject: record.subject, textBody: record.textBody, htmlBodySanitized: record.htmlBodySanitized, sentAt: record.sentAt, ticketId, threadId, attachments: { create: record.attachments.map((attachment) => ({ filename: attachment.filename, contentType: attachment.contentType, sizeBytes: attachment.sizeBytes, checksum: attachment.checksum, storageKey: attachment.storageKey, contentId: attachment.contentId, quarantined: attachment.quarantined })) } };
}
