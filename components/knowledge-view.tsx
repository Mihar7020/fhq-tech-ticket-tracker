"use client";

import { useMemo, useRef, useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Download, FileText, Pencil, Plus, Save, Search, Trash2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { useApp } from "@/components/app-providers";

type Article = { id: string; title: string; body: string; category: string; status: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED"; siteCodes: string[]; documentCount: number; updatedAt: string };
type DocumentItem = { id: string; filename: string; contentType: string; sizeBytes: number; articleId: string | null; articleTitle: string | null; uploadedBy: string; createdAt: string };
const emptyDraft = { id: "", title: "", body: "", category: "General", status: "DRAFT" as "DRAFT" | "PUBLISHED", siteCodes: "" };

export function KnowledgeView({ initialArticles, initialDocuments, role }: { initialArticles: Article[]; initialDocuments: DocumentItem[]; role: string }) {
  const { toast } = useApp();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"articles" | "documents">("articles");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [articleId, setArticleId] = useState("");
  const canEdit = role !== "READ_ONLY";

  const articles = useMemo(() => initialArticles.filter((article) => `${article.title} ${article.body} ${article.category}`.toLowerCase().includes(query.toLowerCase())), [initialArticles, query]);
  const documents = useMemo(() => initialDocuments.filter((document) => `${document.filename} ${document.articleTitle ?? ""}`.toLowerCase().includes(query.toLowerCase())), [initialDocuments, query]);

  function startEdit(article?: Article) {
    setDraft(article ? { id: article.id, title: article.title, body: article.body, category: article.category, status: article.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT", siteCodes: article.siteCodes.join(", ") } : emptyDraft);
    setError("");
    setEditing(true);
  }

  async function saveArticle() {
    if (!draft.title.trim() || !draft.body.trim() || saving) return;
    setSaving(true); setError("");
    const body = { title: draft.title, body: draft.body, category: draft.category, status: draft.status, siteCodes: draft.siteCodes.split(",").map((code) => code.trim().toUpperCase()).filter(Boolean) };
    const response = await fetch(draft.id ? `/api/knowledge/${draft.id}` : "/api/knowledge", { method: draft.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (!response.ok) { setError("The article could not be saved."); return; }
    setEditing(false); setDraft(emptyDraft); toast(draft.id ? "Article updated" : "Article created"); router.refresh();
  }

  async function deleteArticle(id: string) {
    if (!window.confirm("Delete this article? Documents attached to it will remain in the document library.")) return;
    const response = await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
    if (!response.ok) { toast("Could not delete article"); return; }
    toast("Article deleted"); router.refresh();
  }

  async function uploadDocument(file?: File) {
    if (!file || uploading) return;
    setUploading(true); setError("");
    const form = new FormData(); form.set("file", file); if (articleId) form.set("articleId", articleId);
    const response = await fetch("/api/knowledge/documents", { method: "POST", body: form });
    setUploading(false); if (fileRef.current) fileRef.current.value = "";
    if (!response.ok) { setError("Upload failed. Use a PDF, Office file, text file, CSV, PNG, or JPG under 4 MB."); return; }
    toast("Document uploaded"); router.refresh();
  }

  async function deleteDocument(id: string) {
    if (!window.confirm("Delete this document permanently?")) return;
    const response = await fetch(`/api/knowledge/documents/${id}`, { method: "DELETE" });
    if (!response.ok) { toast("Could not delete document"); return; }
    toast("Document deleted"); router.refresh();
  }

  return (
    <div className="page-wrap">
      <PageHeader eyebrow="Reference" title="Knowledge base" description="Practical IT instructions and documents kept by the FHQ Tech team." actions={canEdit ? <button className="btn btn-primary" onClick={() => startEdit()}><Plus size={15} /> New article</button> : undefined} />

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b divider p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex rounded-lg border divider bg-[var(--ink-3)] p-1">
            <button className={`rounded-md px-3 py-2 text-xs font-bold ${tab === "articles" ? "accent-fill" : "muted"}`} onClick={() => setTab("articles")}>Articles</button>
            <button className={`rounded-md px-3 py-2 text-xs font-bold ${tab === "documents" ? "accent-fill" : "muted"}`} onClick={() => setTab("documents")}>Documents</button>
          </div>
          <label className="relative w-full sm:max-w-sm">
            <span className="sr-only">Search knowledge base</span><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 muted" size={15} />
            <input className="input input-with-icon" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search articles and documents" />
          </label>
        </div>

        {editing ? (
          <section className="border-b divider bg-[var(--ink-3)]/45 p-5" aria-label="Article editor">
            <div className="mb-4 flex items-center justify-between"><div><p className="label">Article editor</p><h2 className="display mt-1 text-xl">{draft.id ? "Edit article" : "New article"}</h2></div><button className="btn icon-btn" aria-label="Close editor" onClick={() => setEditing(false)}><X size={15} /></button></div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2"><span className="label mb-2 block">Title</span><input className="input" value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} /></label>
              <label><span className="label mb-2 block">Category</span><input className="input" value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} /></label>
              <label><span className="label mb-2 block">Schools, optional</span><input className="input" value={draft.siteCodes} onChange={(event) => setDraft((current) => ({ ...current, siteCodes: event.target.value }))} placeholder="PPK, OMEC" /></label>
              <label><span className="label mb-2 block">Status</span><select className="input" value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as "DRAFT" | "PUBLISHED" }))}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option></select></label>
              <label className="md:col-span-2"><span className="label mb-2 block">Article</span><textarea className="input min-h-64" value={draft.body} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} placeholder="Write the steps, checks, and solution..." /></label>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-[var(--red)]" role="alert">{error}</p><button className="btn btn-primary" disabled={saving || !draft.title.trim() || !draft.body.trim()} onClick={() => void saveArticle()}><Save size={15} /> {saving ? "Saving..." : "Save article"}</button></div>
          </section>
        ) : null}

        {tab === "articles" ? (
          <div className="divide-y divide-[var(--line)]">
            {articles.length ? articles.map((article) => (
              <article key={article.id} className="p-5">
                <div className="flex items-start gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--gold-soft)] text-[var(--gold-bright)]"><BookOpen size={18} /></span>
                  <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="display text-lg">{article.title}</h2><span className="chip">{article.status === "PUBLISHED" ? "Published" : "Draft"}</span><span className="chip">{article.category}</span></div><p className={`muted mt-2 whitespace-pre-wrap text-sm leading-6 ${expanded === article.id ? "" : "line-clamp-2"}`}>{article.body}</p><p className="muted mt-3 text-[10px]">Updated {article.updatedAt} · {article.documentCount} document{article.documentCount === 1 ? "" : "s"}{article.siteCodes.length ? ` · ${article.siteCodes.join(", ")}` : ""}</p></div>
                  <div className="flex shrink-0 gap-2">{canEdit ? <button className="btn icon-btn" aria-label={`Edit ${article.title}`} onClick={() => startEdit(article)}><Pencil size={14} /></button> : null}{role === "ADMIN" ? <button className="btn icon-btn danger" aria-label={`Delete ${article.title}`} onClick={() => void deleteArticle(article.id)}><Trash2 size={14} /></button> : null}<button className="btn icon-btn" aria-label={expanded === article.id ? "Collapse article" : "Expand article"} onClick={() => setExpanded((current) => current === article.id ? null : article.id)}>{expanded === article.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button></div>
                </div>
              </article>
            )) : <EmptyState icon={BookOpen} title="No matching articles" body={query ? "Try another search." : "Create the first FHQ Tech article when you have a repeatable solution."} />}
          </div>
        ) : (
          <div>
            {canEdit ? <section className="border-b divider bg-[var(--ink-3)]/45 p-5">
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end"><label><span className="label mb-2 block">Attach to article, optional</span><select className="input" value={articleId} onChange={(event) => setArticleId(event.target.value)}><option value="">General document library</option>{initialArticles.map((article) => <option key={article.id} value={article.id}>{article.title}</option>)}</select></label><label><span className="label mb-2 block">Document</span><input ref={fileRef} type="file" className="input pt-2" onChange={(event) => void uploadDocument(event.target.files?.[0])} /></label><button className="btn btn-primary" disabled={uploading} onClick={() => fileRef.current?.click()}><Upload size={15} /> {uploading ? "Uploading..." : "Choose file"}</button></div>
              {error ? <p className="mt-3 text-xs text-[var(--red)]" role="alert">{error}</p> : null}
            </section> : null}
            <div className="divide-y divide-[var(--line)]">
              {documents.length ? documents.map((document) => <div key={document.id} className="flex items-center gap-3 p-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--gold-soft)] text-[var(--gold-bright)]"><FileText size={18} /></span><div className="min-w-0 flex-1"><p className="truncate font-semibold">{document.filename}</p><p className="muted mt-1 text-[10px]">{formatBytes(document.sizeBytes)} · {document.articleTitle ?? "General library"} · {document.uploadedBy} · {document.createdAt}</p></div><a className="btn icon-btn" href={`/api/knowledge/documents/${document.id}`} aria-label={`Download ${document.filename}`}><Download size={14} /></a>{canEdit ? <button className="btn icon-btn danger" aria-label={`Delete ${document.filename}`} onClick={() => void deleteDocument(document.id)}><Trash2 size={14} /></button> : null}</div>) : <EmptyState icon={FileText} title="No matching documents" body={query ? "Try another search." : "Upload procedures, reference PDFs, or other IT documents here."} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, body }: { icon: typeof BookOpen; title: string; body: string }) { return <div className="grid place-items-center px-6 py-16 text-center"><span className="grid h-12 w-12 place-items-center rounded-lg bg-[var(--gold-soft)] text-[var(--gold-bright)]"><Icon size={20} /></span><h2 className="display mt-4 text-xl">{title}</h2><p className="muted mt-2 max-w-md text-sm">{body}</p></div>; }
function formatBytes(bytes: number) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }
