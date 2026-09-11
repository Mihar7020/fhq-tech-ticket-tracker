import { db } from "@/lib/db";
import { hasDatabase } from "@/lib/ticket-data";

const DISPLAY_TIME_ZONE = "America/Regina";

export async function getKnowledgeLibrary() {
  if (!hasDatabase()) return { articles: [], documents: [] };
  const [articles, documents] = await Promise.all([
    db.knowledgeArticle.findMany({ include: { _count: { select: { documents: true } } }, orderBy: { updatedAt: "desc" } }),
    db.knowledgeDocument.findMany({ include: { article: { select: { title: true } }, uploadedBy: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
  ]);
  return {
    articles: articles.map((article) => ({ id: article.id, title: article.title, body: article.body, category: article.category ?? "General", status: article.status, siteCodes: article.siteCodes, documentCount: article._count.documents, updatedAt: article.updatedAt.toLocaleDateString("en-CA", { timeZone: DISPLAY_TIME_ZONE, month: "short", day: "numeric", year: "numeric" }) })),
    documents: documents.map((document) => ({ id: document.id, filename: document.filename, contentType: document.contentType, sizeBytes: document.sizeBytes, articleId: document.articleId, articleTitle: document.article?.title ?? null, uploadedBy: document.uploadedBy.name, createdAt: document.createdAt.toLocaleDateString("en-CA", { timeZone: DISPLAY_TIME_ZONE, month: "short", day: "numeric", year: "numeric" }) })),
  };
}
