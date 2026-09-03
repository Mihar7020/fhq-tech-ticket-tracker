import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { priorityToDb, statusToDb } from "@/lib/ticket-data";

const patchSchema = z.object({
  status: z.enum(["New", "Triage", "In progress", "Waiting on staff", "Waiting on IT", "Resolved", "Voided"]).optional(),
  priority: z.enum(["Critical", "High", "Normal", "Low"]).optional(),
  assigneeId: z.string().nullable().optional(),
  siteId: z.string().nullable().optional(),
  subject: z.string().trim().min(1).max(500).optional(),
  summary: z.string().trim().min(1).max(20_000).optional(),
  category: z.string().trim().min(1).max(120).optional(),
  service: z.string().trim().min(1).max(160).optional(),
  affected: z.coerce.number().int().min(1).max(100_000).optional(),
  requester: z.string().trim().min(1).max(200).optional(),
  requesterEmail: z.string().trim().email().max(320).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role === "READ_ONLY") return Response.json({ error: "forbidden" }, { status: 403 });
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });
  const { id } = await params;
  const existing = await db.ticket.findFirst({ where: { OR: [{ id }, { publicId: id }] } });
  if (!existing) return Response.json({ error: "not_found" }, { status: 404 });
  const actor = await db.user.findUnique({ where: { email: session.email.toLowerCase() } });
  const data = parsed.data;
  const ticket = await db.$transaction(async (tx) => {
    const updated = await tx.ticket.update({
      where: { id: existing.id },
      data: {
        status: data.status ? statusToDb[data.status] : undefined,
        priority: data.priority ? priorityToDb[data.priority] : undefined,
        assigneeId: data.assigneeId === undefined ? undefined : data.assigneeId,
        siteId: data.siteId === undefined ? undefined : data.siteId,
        subject: data.subject,
        category: data.category,
        affectedService: data.service,
        affectedCount: data.affected,
        personNameAtIntake: data.requester,
        requesterEmailAtIntake: data.requesterEmail,
        resolvedAt: data.status === "Resolved" ? new Date() : data.status ? null : undefined,
        closedAt: data.status === "Voided" ? new Date() : data.status ? null : undefined,
      },
      include: { assignee: true },
    });
    if (data.summary) {
      const digest = await tx.digest.findFirst({ where: { ticketId: existing.id }, include: { revisions: { orderBy: { revision: "desc" }, take: 1 } } });
      if (digest) {
        const previousRevision = digest.revisions[0]?.revision ?? 0;
        await tx.digest.update({ where: { id: digest.id }, data: { currentRevision: previousRevision + 1, revisions: { create: { revision: previousRevision + 1, problemStatement: data.summary, asks: [], missingInfo: [] } } } });
      } else {
        await tx.digest.create({ data: { ticketId: existing.id, currentRevision: 1, revisions: { create: { revision: 1, problemStatement: data.summary, asks: [], missingInfo: [] } } } });
      }
    }
    await tx.auditLog.create({ data: { entityType: "Ticket", entityId: existing.id, ticketId: existing.id, actorId: actor?.id, action: "TICKET_UPDATED", before: { status: existing.status, priority: existing.priority, assigneeId: existing.assigneeId }, after: data } });
    return updated;
  });
  return Response.json({ ok: true, assignee: ticket.assignee?.name, status: ticket.status, priority: ticket.priority });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role === "READ_ONLY") return Response.json({ error: "forbidden" }, { status: 403 });
  const { id } = await params;
  const existing = await db.ticket.findFirst({ where: { OR: [{ id }, { publicId: id }] } });
  if (!existing) return Response.json({ error: "not_found" }, { status: 404 });
  const actor = await db.user.findUnique({ where: { email: session.email.toLowerCase() } });
  await db.$transaction([
    db.ticket.update({ where: { id: existing.id }, data: { status: "CLOSED", closedAt: new Date(), resolvedAt: null } }),
    db.auditLog.create({ data: { entityType: "Ticket", entityId: existing.id, ticketId: existing.id, actorId: actor?.id, action: "TICKET_VOIDED", before: { status: existing.status }, after: { status: "CLOSED" } } }),
  ]);
  return Response.json({ ok: true, status: "Voided" });
}
