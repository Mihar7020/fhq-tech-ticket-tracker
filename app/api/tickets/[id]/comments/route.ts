import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendThreadedReply } from "@/lib/email/graph";

const schema = z.object({ body: z.string().trim().min(1).max(20_000), internal: z.boolean().default(false) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role === "READ_ONLY") return Response.json({ error: "forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_comment" }, { status: 400 });
  const { id } = await params;
  const ticket = await db.ticket.findFirst({ where: { OR: [{ id }, { publicId: id }] }, include: { messages: { where: { direction: "INBOUND" }, orderBy: { sentAt: "desc" }, take: 1 } } });
  if (!ticket) return Response.json({ error: "not_found" }, { status: 404 });
  const inbound = ticket.messages[0];
  if (!parsed.data.internal && inbound && !inbound.internetMessageId.endsWith("@fhqtc.local>")) {
    await sendThreadedReply({ messageId: inbound.internetMessageId, comment: parsed.data.body });
  }
  const actor = await db.user.findUnique({ where: { email: session.email.toLowerCase() } });
  await db.$transaction([
    db.message.create({ data: { internetMessageId: `<comment-${randomUUID()}@fhqtc.local>`, direction: parsed.data.internal ? "INTERNAL" : "OUTBOUND", fromAddress: session.email, fromName: session.name, toAddresses: parsed.data.internal ? [] : [ticket.requesterEmailAtIntake], ccAddresses: [], subject: `Re: ${ticket.subject}`, textBody: parsed.data.body, sentAt: new Date(), ticketId: ticket.id, threadId: inbound?.threadId } }),
    db.auditLog.create({ data: { entityType: "Ticket", entityId: ticket.id, ticketId: ticket.id, actorId: actor?.id, action: parsed.data.internal ? "INTERNAL_NOTE" : "OUTBOUND_COMMENT" } }),
    db.ticket.update({ where: { id: ticket.id }, data: { updatedAt: new Date() } }),
  ]);
  return Response.json({ ok: true });
}
