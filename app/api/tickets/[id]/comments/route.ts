import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendThreadedReply } from "@/lib/email/graph";

const schema = z.object({ body: z.string().trim().min(1).max(20_000), internal: z.boolean().default(false), cc: z.array(z.string().trim().toLowerCase().email()).max(20).default([]) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role === "READ_ONLY") return Response.json({ error: "forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_comment" }, { status: 400 });
  const { id } = await params;
  const ticket = await db.ticket.findFirst({ where: { OR: [{ id }, { publicId: id }] }, include: { assignee: { select: { signatureHtml: true } }, messages: { where: { direction: "INBOUND" }, orderBy: { sentAt: "desc" }, take: 1 } } });
  if (!ticket) return Response.json({ error: "not_found" }, { status: 404 });
  const inbound = ticket.messages[0];
  const actor = await db.user.findUnique({ where: { email: session.email.toLowerCase() } });
  let emailStatus: "not_attempted" | "sent" | "failed" = parsed.data.internal ? "not_attempted" : "not_attempted";
  let emailError: string | undefined;
  let sentMetadata: { internetMessageId?: string; conversationId?: string } | undefined;
  if (!parsed.data.internal && inbound && !inbound.internetMessageId.endsWith("@fhqtc.local>")) {
    try {
      sentMetadata = await sendThreadedReply({ messageId: inbound.internetMessageId, comment: parsed.data.body, cc: parsed.data.cc, signatureHtml: ticket.assignee?.signatureHtml ?? actor?.signatureHtml });
      emailStatus = "sent";
    } catch (error) {
      emailStatus = "failed";
      emailError = error instanceof Error ? error.message : "Email reply failed.";
      console.error("Public comment email reply failed", { ticketId: ticket.id, publicId: ticket.publicId, error: emailError });
    }
  }
  if (sentMetadata?.conversationId && inbound?.threadId) {
    try { await db.emailThread.update({ where: { id: inbound.threadId }, data: { externalThreadId: sentMetadata.conversationId } }); }
    catch (error) { console.error("Could not store Graph conversation ID", { ticketId: ticket.id, error }); }
  }
  const [message] = await db.$transaction([
    db.message.create({ data: { internetMessageId: sentMetadata?.internetMessageId || `<comment-${randomUUID()}@fhqtc.local>`, direction: parsed.data.internal ? "INTERNAL" : "OUTBOUND", fromAddress: session.email, fromName: session.name, toAddresses: parsed.data.internal ? [] : [ticket.requesterEmailAtIntake], ccAddresses: parsed.data.internal ? [] : parsed.data.cc, subject: `Re: ${ticket.subject}`, textBody: parsed.data.body, sentAt: new Date(), ticketId: ticket.id, threadId: inbound?.threadId } }),
    db.auditLog.create({ data: { entityType: "Ticket", entityId: ticket.id, ticketId: ticket.id, actorId: actor?.id, action: parsed.data.internal ? "INTERNAL_NOTE" : "OUTBOUND_COMMENT", after: { emailStatus, ...(emailError ? { emailError } : {}) } } }),
    db.ticket.update({ where: { id: ticket.id }, data: { updatedAt: new Date() } }),
  ]);
  return Response.json({ ok: true, emailStatus, id: message.id });
}
