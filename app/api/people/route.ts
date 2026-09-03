import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({ name: z.string().trim().min(2).max(200), email: z.string().trim().email(), siteId: z.string().min(1), role: z.string().trim().max(150).optional(), department: z.string().trim().max(150).optional(), phone: z.string().trim().max(50).optional() });

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return Response.json({ error: "forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_person", issues: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;
  const person = await db.person.create({ data: { fullName: input.name, normalizedName: input.name.toLowerCase().replace(/\s+/g, " "), siteId: input.siteId, roleTitle: input.role || undefined, department: input.department || undefined, phone: input.phone || undefined, aliases: { create: { email: input.email.toLowerCase(), normalized: input.email.toLowerCase(), isPrimary: true, source: "manual" } } }, include: { aliases: true } });
  return Response.json({ id: person.id }, { status: 201 });
}
