import { db } from "@/lib/db";

const isAuthorized = (request: Request) =>
  Boolean(process.env.CRON_SECRET) &&
  request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const seededTickets = await db.ticket.findMany({
    where: {
      messages: {
        some: {
          internetMessageId: { startsWith: "<seed-", endsWith: "@fhqtc.example>" },
        },
      },
    },
    select: { id: true },
  });
  const ticketIds = seededTickets.map(({ id }) => id);

  if (ticketIds.length === 0) {
    return Response.json({ ok: true, deleted: 0 });
  }

  const result = await db.$transaction(async (database) => {
    await database.knowledgeArticle.updateMany({
      where: { sourceTicketId: { in: ticketIds } },
      data: { sourceTicketId: null },
    });
    await database.auditLog.deleteMany({ where: { ticketId: { in: ticketIds } } });
    await database.message.deleteMany({ where: { ticketId: { in: ticketIds } } });
    await database.ticket.updateMany({
      where: { mergedIntoId: { in: ticketIds } },
      data: { mergedIntoId: null },
    });
    return database.ticket.deleteMany({ where: { id: { in: ticketIds } } });
  });

  return Response.json({ ok: true, deleted: result.count });
}
