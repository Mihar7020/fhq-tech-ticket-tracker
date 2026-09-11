import type { Metadata } from "next";
import { SettingsView } from "@/components/settings-view";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasDatabase } from "@/lib/ticket-data";
export const metadata: Metadata = { title: "Settings" };
export default async function Page() {
  const session = await requireSession();
  const user = hasDatabase() ? await db.user.findUnique({ where: { email: session.email.toLowerCase() }, select: { signatureHtml: true } }) : null;
  return (
    <>
      <SettingsView initialSignature={user?.signatureHtml ?? ""} currentUserName={session.name} currentUserEmail={session.email} />
      <section className="page-wrap pt-0">
        <div className="card overflow-hidden p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative h-24 w-32 shrink-0" aria-hidden="true">
              <div className="absolute left-4 top-5 h-14 w-20 rounded-lg border-2 border-dashed border-[color:var(--teal)] bg-[var(--gold-soft)]" />
              <div className="absolute left-12 top-2 h-8 w-8 rounded-full border-2 border-[color:var(--teal)] bg-[var(--ink-2)]" />
              <div className="absolute left-24 top-12 h-6 w-6 rounded-full bg-[color:rgba(37,107,115,.14)]" />
              <div className="absolute bottom-3 left-2 h-1 w-28 rounded-full bg-[color:rgba(37,107,115,.18)]" />
              <div className="absolute left-8 top-11 h-1 w-12 rounded-full bg-[color:var(--teal)]" />
              <div className="absolute left-8 top-16 h-1 w-9 rounded-full bg-[color:var(--teal)]/70" />
            </div>
            <div>
              <p className="label text-[color:var(--teal)]">Settings roadmap</p>
              <h2 className="display mt-1 text-2xl">More settings coming soon</h2>
              <p className="muted mt-2 max-w-2xl text-sm">Some admin controls are still being built out. Anything already working on this page stays available.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
