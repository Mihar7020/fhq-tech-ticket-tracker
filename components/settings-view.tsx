"use client";

import { useState } from "react";
import { Bell, Brain, Check, KeyRound, Mail, Radio, Save, ShieldCheck, UserRoundCog } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useApp } from "@/components/app-providers";

export function SettingsView() {
  const { toast } = useApp();
  const [digest, setDigest] = useState(true);
  const rows = [
    { icon: Mail, title: "Microsoft Graph mailbox", body: "Webhook ingestion - FHQTCTech mailbox later", status: "Configuration required" },
    { icon: Brain, title: "Ticket summaries", body: "Human review is always required", status: "Prototype mode" },
    { icon: Radio, title: "Live presence", body: "Collision guard and workload signals", status: "Demo channel" },
  ];

  return (
    <div className="page-wrap max-w-5xl">
      <PageHeader eyebrow="Personal + system" title="Settings" description="Workspace preferences and future system connections." actions={<button className="btn btn-primary" onClick={() => toast("Settings saved")}><Save size={15} /> Save settings</button>} />
      <div className="grid gap-5 lg:grid-cols-[.7fr_1.3fr]">
        <aside className="card h-fit p-3">
          {[
            { icon: UserRoundCog, label: "Personal" },
            { icon: Mail, label: "Email ingestion" },
            { icon: ShieldCheck, label: "Roles & security" },
            { icon: Bell, label: "Automations" },
          ].map((item, index) => {
            const Icon = item.icon;
            return <button key={item.label} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-xs font-bold ${index === 0 ? "bg-[var(--gold-soft)] gold" : "muted hover:bg-[var(--ink-3)]"}`}><Icon size={16} />{item.label}</button>;
          })}
        </aside>
        <div className="space-y-5">
          <section className="card p-5">
            <p className="label">Appearance</p>
            <h2 className="display mt-1 text-2xl">Your workspace</h2>
            <div className="mt-5 rounded-lg border divider bg-[var(--ink-3)] p-4">
              <div className="flex items-start gap-3">
                <Check className="gold mt-0.5" size={17} />
                <div>
                  <strong className="text-sm">Light theme</strong>
                  <p className="muted mt-1 text-xs">FHQ Tech now uses one fixed light interface.</p>
                </div>
              </div>
            </div>
            <label className="mt-5 flex items-center justify-between rounded-lg border divider bg-[var(--ink-3)] p-4">
              <span>
                <strong className="text-xs">Summary-first ticket view</strong>
                <span className="muted mt-1 block text-[10px]">Original request remains visible in the ticket detail.</span>
              </span>
              <input type="checkbox" checked={digest} onChange={(event) => setDigest(event.target.checked)} className="h-4 w-4 accent-[var(--gold)]" />
            </label>
          </section>
          <section className="card overflow-hidden">
            <div className="border-b divider p-5">
              <p className="label">System connections</p>
              <h2 className="display mt-1 text-2xl">Future services</h2>
            </div>
            {rows.map((row) => {
              const Icon = row.icon;
              return (
                <div key={row.title} className="flex items-center gap-3 border-b divider p-5 last:border-0">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--ink-3)] gold"><Icon size={17} /></span>
                  <div className="flex-1">
                    <strong className="text-xs">{row.title}</strong>
                    <p className="muted mt-1 text-[10px]">{row.body}</p>
                  </div>
                  <span className="chip">{row.status}</span>
                </div>
              );
            })}
          </section>
          <section className="card p-5">
            <div className="flex items-start gap-3">
              <KeyRound className="gold" size={18} />
              <div>
                <strong>Role: Admin</strong>
                <p className="muted mt-1 text-xs">You can edit the directory, configure schools, manage automations, and re-route tickets.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
