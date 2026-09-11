import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({ title: z.string().trim().min(3).max(180), body: z.string().trim().min(1).max(100_000), category: z.string().trim().max(80).optional(), status: z.enum(["DRAFT", "PUBLISHED"]), siteCodes: z.array(z.string().trim().max(20)).max(20) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role === "READ_ONLY") return Response.json({ error: "forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_article" }, { status: 400 });
  const { id } = await params;
  const existing = await db.knowledgeArticle.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "not_found" }, { status: 404 });
  const actor = await db.user.findUnique({ where: { email: session.email.toLowerCase() } });
  const article = await db.knowledgeArticle.update({ where: { id }, data: { ...parsed.data, category: parsed.data.category || null, publishedAt: parsed.data.status === "PUBLISHED" ? existing.publishedAt ?? new Date() : null } });
  await db.auditLog.create({ data: { entityType: "KnowledgeArticle", entityId: article.id, actorId: actor?.id, action: "KNOWLEDGE_ARTICLE_UPDATED", before: { status: existing.status }, after: { title: article.title, status: article.status } } });
  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return Response.json({ error: "forbidden" }, { status: 403 });
  const { id } = await params;
  const existing = await db.knowledgeArticle.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "not_found" }, { status: 404 });
  const actor = await db.user.findUnique({ where: { email: session.email.toLowerCase() } });
  await db.$transaction([
    db.knowledgeArticle.delete({ where: { id } }),
    db.auditLog.create({ data: { entityType: "KnowledgeArticle", entityId: id, actorId: actor?.id, action: "KNOWLEDGE_ARTICLE_DELETED", before: { title: existing.title } } }),
  ]);
  return Response.json({ ok: true });
}
