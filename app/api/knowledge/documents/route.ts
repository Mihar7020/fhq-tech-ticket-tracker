import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const MAX_BYTES = 4 * 1024 * 1024;
const allowedTypes = new Set(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "text/plain", "text/csv", "image/png", "image/jpeg"]);

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role === "READ_ONLY") return Response.json({ error: "forbidden" }, { status: 403 });
  const form = await request.formData();
  const file = form.get("file");
  const articleId = String(form.get("articleId") ?? "").trim() || null;
  if (!(file instanceof File) || !file.size || file.size > MAX_BYTES || !allowedTypes.has(file.type)) return Response.json({ error: "invalid_document" }, { status: 400 });
  const actor = await db.user.findUnique({ where: { email: session.email.toLowerCase() } });
  if (!actor) return Response.json({ error: "user_not_found" }, { status: 404 });
  if (articleId && !(await db.knowledgeArticle.findUnique({ where: { id: articleId }, select: { id: true } }))) return Response.json({ error: "article_not_found" }, { status: 404 });
  const filename = file.name.replace(/[\r\n"\\/]/g, "_").slice(0, 180) || "document";
  const document = await db.knowledgeDocument.create({ data: { filename, contentType: file.type, sizeBytes: file.size, data: Buffer.from(await file.arrayBuffer()), articleId, uploadedById: actor.id } });
  await db.auditLog.create({ data: { entityType: "KnowledgeDocument", entityId: document.id, actorId: actor.id, action: "KNOWLEDGE_DOCUMENT_UPLOADED", after: { filename, sizeBytes: file.size, articleId } } });
  return Response.json({ ok: true, id: document.id });
}
