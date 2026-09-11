import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const document = await db.knowledgeDocument.findUnique({ where: { id } });
  if (!document) return new Response("Not found", { status: 404 });
  const filename = encodeURIComponent(document.filename);
  return new Response(new Uint8Array(document.data), { headers: { "Content-Type": document.contentType, "Content-Length": String(document.sizeBytes), "Content-Disposition": `attachment; filename*=UTF-8''${filename}`, "Cache-Control": "private, no-store" } });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role === "READ_ONLY") return Response.json({ error: "forbidden" }, { status: 403 });
  const { id } = await params;
  const document = await db.knowledgeDocument.findUnique({ where: { id } });
  if (!document) return Response.json({ error: "not_found" }, { status: 404 });
  const actor = await db.user.findUnique({ where: { email: session.email.toLowerCase() } });
  await db.$transaction([
    db.knowledgeDocument.delete({ where: { id } }),
    db.auditLog.create({ data: { entityType: "KnowledgeDocument", entityId: id, actorId: actor?.id, action: "KNOWLEDGE_DOCUMENT_DELETED", before: { filename: document.filename } } }),
  ]);
  return Response.json({ ok: true });
}
