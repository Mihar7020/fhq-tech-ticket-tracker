import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendNewTicketEmail, sendThreadedReply } from "@/lib/email/graph";
import { getOrCreateStaffUser } from "@/lib/staff-user";
import { normalizeSubject } from "@/lib/threading";

const schema = z.object({ body: z.string().trim().min(1).max(20_000), internal: z.boolean().default(false), cc: z.array(z.string().trim().toLowerCase().email()).max(20).default([]) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role === "READ_ONLY") return Response.json({ error: "forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_comment" }, { status: 400 });
  const { id } = await params;
  const ticket = await db.ticket.findFirst({ where: { OR: [{ id }, { publicId: id }] }, include: { thread: true, assignee: { select: { signatureHtml: true } }, messages: { where: { direction: "INBOUND" }, orderBy: { sentAt: "desc" }, take: 1 } } });
  if (!ticket) return Response.json({ error: "not_found" }, { status: 404 });
  const inbound = ticket.messages[0];
  const actor = await getOrCreateStaffUser(session);
  let emailStatus: "not_attempted" | "sent" | "failed" = parsed.data.internal ? "not_attempted" : "not_attempted";
  let emailError: string | undefined;
  let outboundMessageId = `<comment-${randomUUID()}@fhqtc.local>`;
  let startedNewThread = false;
  if (!parsed.data.internal && inbound) {
    try {
      if (inbound.internetMessageId.endsWith("@fhqtc.local>")) {
        if (ticket.requesterEmailAtIntake.endsWith("@fhqtc.local")) throw new Error("This manual ticket does not have a requester email address.");
        const sent = await sendNewTicketEmail({
          to: ticket.requesterEmailAtIntake,
          subject: ticket.subject,
          ticketNumber: ticket.publicId,
          comment: parsed.data.body,
          cc: parsed.data.cc,
          signatureHtml: ticket.assignee?.signatureHtml ?? actor?.signatureHtml,
        });
        outboundMessageId = sent.internetMessageId;
        startedNewThread = true;
      } else {
        await sendThreadedReply({ messageId: inbound.internetMessageId, comment: parsed.data.body, cc: parsed.data.cc, signatureHtml: ticket.assignee?.signatureHtml ?? actor?.signatureHtml });
      }
      emailStatus = "sent";
    } catch (error) {
      emailStatus = "failed";
      emailError = error instanceof Error ? error.message : "Email reply failed.";
      console.error("Public comment email reply failed", { ticketId: ticket.id, publicId: ticket.publicId, error: emailError });
    }
  }
  const message = await db.$transaction(async (tx) => {
    let threadId = inbound?.threadId ?? ticket.thread?.id;
    if (startedNewThread && emailStatus === "sent" && !threadId) {
      const thread = await tx.emailThread.create({ data: { ticketId: ticket.id, normalizedSubject: normalizeSubject(ticket.subject), lastMessageAt: new Date() } });
      threadId = thread.id;
    } else if (startedNewThread && emailStatus === "sent" && threadId) {
      await tx.emailThread.update({ where: { id: threadId }, data: { lastMessageAt: new Date() } });
    }

    const saved = await tx.message.create({ data: { internetMessageId: outboundMessageId, direction: parsed.data.internal ? "INTERNAL" : "OUTBOUND", fromAddress: session.email, fromName: session.name, toAddresses: parsed.data.internal ? [] : [ticket.requesterEmailAtIntake], ccAddresses: parsed.data.internal ? [] : parsed.data.cc, subject: startedNewThread ? `[${ticket.publicId}] ${ticket.subject}` : `Re: ${ticket.subject}`, textBody: parsed.data.body, sentAt: new Date(), ticketId: ticket.id, threadId } });
    await tx.auditLog.create({ data: { entityType: "Ticket", entityId: ticket.id, ticketId: ticket.id, actorId: actor?.id, action: parsed.data.internal ? "INTERNAL_NOTE" : "OUTBOUND_COMMENT", after: { emailStatus, ...(emailError ? { emailError } : {}) } } });
    await tx.ticket.update({ where: { id: ticket.id }, data: { updatedAt: new Date() } });
    return saved;
  });
  return Response.json({ ok: true, emailStatus, id: message.id });
}
