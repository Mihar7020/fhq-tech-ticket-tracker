import type { Metadata } from "next";
import { KnowledgeView } from "@/components/knowledge-view";
import { requireSession } from "@/lib/auth";
import { getKnowledgeLibrary } from "@/lib/knowledge-data";
export const metadata: Metadata = { title: "Knowledge" };
export default async function Page() {
  const [library, session] = await Promise.all([getKnowledgeLibrary(), requireSession()]);
  return <KnowledgeView initialArticles={library.articles} initialDocuments={library.documents} role={session.role} />;
}
