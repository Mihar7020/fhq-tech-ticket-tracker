import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const session = await getSession();
  if (!session || session.role === "READ_ONLY") return Response.json({ error: "forbidden" }, { status: 403 });

  const { id, commentId } = await params;
  const ticket = await db.ticket.findFirst({ where: { OR: [{ id }, { publicId: id }] }, select: { id: true } });
  if (!ticket) return Response.json({ error: "not_found" }, { status: 404 });

  const note = await db.message.findFirst({ where: { id: commentId, ticketId: ticket.id, direction: "INTERNAL" }, select: { id: true } });
  if (!note) return Response.json({ error: "not_found" }, { status: 404 });

  await db.$transaction([
    db.message.delete({ where: { id: note.id } }),
    db.ticket.update({ where: { id: ticket.id }, data: { updatedAt: new Date() } }),
  ]);

  return Response.json({ ok: true });
}
