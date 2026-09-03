import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({ sourcePublicId: z.string().trim().regex(/^FHQ-\d+$/i) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role === "READ_ONLY") return Response.json({ error: "forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_ticket_number" }, { status: 400 });
  const { id } = await params;
  const [target, source, actor] = await Promise.all([
    db.ticket.findFirst({ where: { OR: [{ id }, { publicId: id }] } }),
    db.ticket.findUnique({ where: { publicId: parsed.data.sourcePublicId.toUpperCase() } }),
    db.user.findUnique({ where: { email: session.email.toLowerCase() } }),
  ]);
  if (!target || !source) return Response.json({ error: "ticket_not_found" }, { status: 404 });
  if (target.id === source.id) return Response.json({ error: "same_ticket" }, { status: 400 });
  if (source.status === "MERGED") return Response.json({ error: "already_merged" }, { status: 409 });
  await db.$transaction([
    db.ticket.update({ where: { id: source.id }, data: { status: "MERGED", mergedIntoId: target.id, closedAt: new Date() } }),
    db.auditLog.create({ data: { entityType: "Ticket", entityId: source.id, ticketId: source.id, actorId: actor?.id, action: "TICKET_MERGED", after: { mergedInto: target.publicId } } }),
    db.auditLog.create({ data: { entityType: "Ticket", entityId: target.id, ticketId: target.id, actorId: actor?.id, action: "TICKET_RECEIVED_MERGE", after: { source: source.publicId } } }),
  ]);
  return Response.json({ ok: true, source: source.publicId, target: target.publicId });
}
