import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { priorityToDb, statusToDb } from "@/lib/ticket-data";

const createSchema = z.object({
  subject: z.string().trim().min(4).max(500),
  requester: z.string().trim().min(2).max(200),
  requesterEmail: z.string().trim().email().optional().or(z.literal("")),
  siteId: z.string().min(1),
  priority: z.enum(["Critical", "High", "Normal", "Low"]),
  status: z.enum(["New", "Triage", "In progress", "Waiting on staff", "Waiting on IT", "Resolved"]),
  assigneeId: z.string().optional().or(z.literal("")),
  details: z.string().trim().min(6).max(50_000),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role === "READ_ONLY") return Response.json({ error: "forbidden" }, { status: 403 });
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_request", issues: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;
  const team = await db.team.findUnique({ where: { slug: "fhq-tech" } });
  const actor = await db.user.findUnique({ where: { email: session.email.toLowerCase() } });
  const temporaryPublicId = `pending-${randomUUID()}`;
  const requesterEmail = input.requesterEmail || "manual-request@fhqtc.local";

  const ticket = await db.$transaction(async (tx) => {
    const created = await tx.ticket.create({
      data: {
        publicId: temporaryPublicId,
        subject: input.subject,
        requesterEmailAtIntake: requesterEmail,
        personNameAtIntake: input.requester,
        siteId: input.siteId,
        siteNameAtIntake: (await tx.site.findUnique({ where: { id: input.siteId } }))?.name,
        status: statusToDb[input.status],
        priority: priorityToDb[input.priority],
        assigneeId: input.assigneeId || undefined,
        teamId: team?.id,
        resolvedAt: input.status === "Resolved" ? new Date() : undefined,
      },
    });
    const publicId = `FHQ-${String(created.number).padStart(4, "0")}`;
    await tx.message.create({ data: { internetMessageId: `<manual-${randomUUID()}@fhqtc.local>`, direction: "INBOUND", fromAddress: requesterEmail, fromName: input.requester, toAddresses: ["FHQTCTech@fhqtc.net"], ccAddresses: [], subject: input.subject, textBody: input.details, sentAt: new Date(), ticketId: created.id } });
    await tx.auditLog.create({ data: { entityType: "Ticket", entityId: created.id, ticketId: created.id, actorId: actor?.id, action: "MANUAL_TICKET_CREATED" } });
    return tx.ticket.update({ where: { id: created.id }, data: { publicId } });
  });
  return Response.json({ id: ticket.id, publicId: ticket.publicId }, { status: 201 });
}
