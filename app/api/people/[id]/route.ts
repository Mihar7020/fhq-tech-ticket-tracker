import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return Response.json({ error: "forbidden" }, { status: 403 });
  const { id } = await params;
  const person = await db.person.findUnique({ where: { id }, include: { _count: { select: { tickets: true } } } });
  if (!person) return Response.json({ error: "not_found" }, { status: 404 });
  if (person._count.tickets > 0) {
    await db.person.update({ where: { id }, data: { active: false } });
    return Response.json({ ok: true, action: "deactivated" });
  }
  await db.person.delete({ where: { id } });
  return Response.json({ ok: true, action: "deleted" });
}
