import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { priorityToDb, statusToDb } from "@/lib/ticket-data";

const patchSchema = z.object({
  status: z.enum(["New", "Triage", "In progress", "Waiting on staff", "Waiting on IT", "Resolved"]).optional(),
  priority: z.enum(["Critical", "High", "Normal", "Low"]).optional(),
  assigneeId: z.string().nullable().optional(),
  siteId: z.string().nullable().optional(),
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
        resolvedAt: data.status === "Resolved" ? new Date() : data.status ? null : undefined,
      },
      include: { assignee: true },
    });
    await tx.auditLog.create({ data: { entityType: "Ticket", entityId: existing.id, ticketId: existing.id, actorId: actor?.id, action: "TICKET_UPDATED", before: { status: existing.status, priority: existing.priority, assigneeId: existing.assigneeId }, after: data } });
    return updated;
  });
  return Response.json({ ok: true, assignee: ticket.assignee?.name, status: ticket.status, priority: ticket.priority });
}
