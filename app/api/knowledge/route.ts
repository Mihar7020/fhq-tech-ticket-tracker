import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({ title: z.string().trim().min(3).max(180), body: z.string().trim().min(1).max(100_000), category: z.string().trim().max(80).optional(), status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"), siteCodes: z.array(z.string().trim().max(20)).max(20).default([]) });
const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "article";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role === "READ_ONLY") return Response.json({ error: "forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_article" }, { status: 400 });
  const actor = await db.user.findUnique({ where: { email: session.email.toLowerCase() } });
  const slug = `${slugify(parsed.data.title)}-${Date.now().toString(36)}`;
  const article = await db.knowledgeArticle.create({ data: { ...parsed.data, category: parsed.data.category || null, slug, publishedAt: parsed.data.status === "PUBLISHED" ? new Date() : null } });
  await db.auditLog.create({ data: { entityType: "KnowledgeArticle", entityId: article.id, actorId: actor?.id, action: "KNOWLEDGE_ARTICLE_CREATED", after: { title: article.title, status: article.status } } });
  return Response.json({ ok: true, id: article.id });
}
