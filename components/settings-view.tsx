"use client";

import { useEffect, useRef, useState } from "react";
import { Bold, Check, ImagePlus, Italic, KeyRound, Link2, Mail, Save, ShieldCheck, Underline, UserRoundCog } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useApp } from "@/components/app-providers";

export function SettingsView({ initialSignature, currentUserName, currentUserEmail }: { initialSignature: string; currentUserName: string; currentUserEmail: string }) {
  const { toast } = useApp();
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [signatureConfigured, setSignatureConfigured] = useState(Boolean(initialSignature));
  const [error, setError] = useState("");

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initialSignature;
  }, [initialSignature]);

  function format(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  }

  function addLink() {
    const url = window.prompt("Paste the link address");
    if (url) format("createLink", url);
  }

  function addLogo(file?: File) {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) { setError("The logo must be smaller than 2 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      editorRef.current?.focus();
      format("insertImage", String(reader.result));
    };
    reader.readAsDataURL(file);
  }

  async function saveSignature() {
    setSaving(true);
    setError("");
    const response = await fetch("/api/settings/signature", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ html: editorRef.current?.innerHTML ?? "" }) });
    const result = await response.json().catch(() => ({})) as { html?: string; error?: string };
    setSaving(false);
    if (!response.ok) {
      setError(result.error === "signature_image_too_large" ? "One of the pasted images is larger than 2 MB." : "The signature could not be saved.");
      return;
    }
    if (editorRef.current) editorRef.current.innerHTML = result.html ?? "";
    setSignatureConfigured(Boolean(result.html));
    toast("Email signature saved");
  }

  return (
    <div className="page-wrap max-w-5xl">
      <PageHeader eyebrow="Personal + system" title="Settings" description="Your FHQ Tech preferences and email identity." />
      <div className="grid gap-5 lg:grid-cols-[.7fr_1.3fr]">
        <aside className="card h-fit p-3">
          <div className="flex items-center gap-3 rounded-lg bg-[var(--gold-soft)] px-3 py-3 text-xs font-bold text-[var(--gold-bright)]"><UserRoundCog size={16} />Personal</div>
          <div className="mt-1 flex items-center gap-3 rounded-lg px-3 py-3 text-xs font-bold muted"><Mail size={16} />Email</div>
          <div className="mt-1 flex items-center gap-3 rounded-lg px-3 py-3 text-xs font-bold muted"><ShieldCheck size={16} />Security</div>
        </aside>
        <div className="space-y-5">
          <section className="card overflow-hidden">
            <div className="border-b divider p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="label">Outgoing email</p>
                  <h2 className="display mt-1 text-2xl">Your signature</h2>
                  <p className="muted mt-2 text-xs">Paste your Outlook signature here. It is added to emails for tickets assigned to you.</p>
                </div>
                <span className="chip">{signatureConfigured ? "Configured" : "Not set"}</span>
              </div>
            </div>
            <div className="p-5">
              <div className="mb-3 flex flex-wrap gap-2" role="toolbar" aria-label="Signature formatting">
                <FormatButton label="Bold" onClick={() => format("bold")}><Bold size={14} /></FormatButton>
                <FormatButton label="Italic" onClick={() => format("italic")}><Italic size={14} /></FormatButton>
                <FormatButton label="Underline" onClick={() => format("underline")}><Underline size={14} /></FormatButton>
                <FormatButton label="Add link" onClick={addLink}><Link2 size={14} /></FormatButton>
                <label className="btn h-9 min-h-9 cursor-pointer px-3 text-xs">
                  <span className="sr-only">Text color</span>
                  <input type="color" className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0" onChange={(event) => format("foreColor", event.target.value)} /> Color
                </label>
                <FormatButton label="Upload logo" onClick={() => fileRef.current?.click()}><ImagePlus size={14} /> Logo</FormatButton>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" onChange={(event) => { addLogo(event.target.files?.[0]); event.target.value = ""; }} />
              </div>
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className="min-h-44 rounded-lg border divider bg-white p-4 text-sm leading-6 focus:border-[var(--gold)] focus:outline-none focus:ring-3 focus:ring-[var(--gold-soft)]"
                data-placeholder="Paste your Outlook signature here..."
                aria-label="Email signature editor"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="muted text-[11px]">Signed as {currentUserName} · {currentUserEmail}</p>
                <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void saveSignature()}><Save size={15} /> {saving ? "Saving..." : "Save signature"}</button>
              </div>
              {error ? <p className="mt-3 text-xs text-[var(--red)]" role="alert">{error}</p> : null}
            </div>
          </section>

          <section className="card p-5">
            <p className="label">Appearance</p>
            <h2 className="display mt-1 text-2xl">Your workspace</h2>
            <div className="mt-5 rounded-lg border divider bg-[var(--ink-3)] p-4">
              <div className="flex items-start gap-3"><Check className="gold mt-0.5" size={17} /><div><strong className="text-sm">Light theme</strong><p className="muted mt-1 text-xs">FHQ Tech uses one fixed, readable light interface.</p></div></div>
            </div>
          </section>

          <section className="card p-5">
            <div className="flex items-start gap-3"><KeyRound className="gold" size={18} /><div><strong>Private IT workspace</strong><p className="muted mt-1 text-xs">Account and email actions stay restricted to signed-in FHQ Tech staff.</p></div></div>
          </section>
        </div>
      </div>
    </div>
  );
}

function FormatButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className="btn h-9 min-h-9 px-3 text-xs" aria-label={label} title={label} onMouseDown={(event) => event.preventDefault()} onClick={onClick}>{children}</button>;
}
