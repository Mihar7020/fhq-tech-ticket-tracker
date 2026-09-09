import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const patchSchema = z.object({ accepted: z.boolean() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role === "READ_ONLY") return Response.json({ error: "forbidden" }, { status: 403 });
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });
  const { id } = await params;
  const existing = await db.routingDecision.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "not_found" }, { status: 404 });
  const decision = await db.routingDecision.update({
    where: { id },
    data: { accepted: parsed.data.accepted, correctedAt: new Date() },
  });
  return Response.json({ ok: true, accepted: decision.accepted });
}
