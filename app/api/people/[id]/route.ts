import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().email(),
  aliases: z.array(z.string().trim().email()).max(25).default([]),
  siteId: z.string().trim().nullable(),
  role: z.string().trim().max(150),
  department: z.string().trim().max(150),
  phone: z.string().trim().max(50),
  active: z.boolean(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return Response.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_person", issues: parsed.error.flatten() }, { status: 400 });

  const existing = await db.person.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return Response.json({ error: "not_found" }, { status: 404 });

  const input = parsed.data;
  const primaryEmail = input.email.toLowerCase();
  const aliases = [...new Set(input.aliases.map((email) => email.toLowerCase()))].filter((email) => email !== primaryEmail);
  const allEmails = [primaryEmail, ...aliases];
  const conflict = await db.personEmailAlias.findFirst({
    where: { personId: { not: id }, normalized: { in: allEmails } },
    select: { email: true },
  });
  if (conflict) return Response.json({ error: "email_in_use", email: conflict.email }, { status: 409 });

  const person = await db.$transaction(async (transaction) => {
    await transaction.personEmailAlias.deleteMany({ where: { personId: id } });
    return transaction.person.update({
      where: { id },
      data: {
        fullName: input.name,
        normalizedName: input.name.toLowerCase().replace(/\s+/g, " "),
        siteId: input.siteId || null,
        roleTitle: input.role || null,
        department: input.department || null,
        phone: input.phone || null,
        active: input.active,
        aliases: {
          create: allEmails.map((email, index) => ({
            email,
            normalized: email,
            isPrimary: index === 0,
            source: "manual",
          })),
        },
      },
      include: { aliases: true },
    });
  });

  return Response.json({
    person: {
      id: person.id,
      name: person.fullName,
      email: person.aliases.find((alias) => alias.isPrimary)?.email || primaryEmail,
      aliases: person.aliases.filter((alias) => !alias.isPrimary).map((alias) => alias.email),
      role: person.roleTitle || "",
      department: person.department || "",
      room: "",
      phone: person.phone || "",
      siteId: person.siteId ?? undefined,
      active: person.active,
    },
  });
}

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
