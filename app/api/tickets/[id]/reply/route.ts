import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendThreadedReply } from "@/lib/email/graph";

const schema = z.object({ body: z.string().trim().min(1).max(20_000) });
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(); if (!session || session.role === "READ_ONLY") return Response.json({ error: "forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return Response.json({ error: "invalid_reply" }, { status: 400 });
  const { id } = await params;
  const [ticket, actor] = await Promise.all([
    db.ticket.findFirst({ where: { OR: [{ id }, { publicId: id }] }, include: { assignee: { select: { signatureHtml: true } }, messages: { where: { direction: "INBOUND" }, orderBy: { sentAt: "desc" }, take: 1 } } }),
    db.user.findUnique({ where: { email: session.email.toLowerCase() } }),
  ]);
  if (!ticket?.messages[0]) return Response.json({ error: "ticket_or_message_not_found" }, { status: 404 });
  await sendThreadedReply({ messageId: ticket.messages[0].internetMessageId, comment: parsed.data.body, signatureHtml: ticket.assignee?.signatureHtml ?? actor?.signatureHtml });
  await db.$transaction([db.auditLog.create({ data: { entityType: "Ticket", entityId: ticket.id, ticketId: ticket.id, actorId: actor?.id, action: "OUTBOUND_REPLY_SENT", after: { length: parsed.data.body.length } } }), db.ticket.update({ where: { id: ticket.id }, data: { updatedAt: new Date() } })]);
  return Response.json({ ok: true });
}
