"use client";

import Link from "next/link";
import { BellRing, BookOpen, Download, FileText, Radio, Send, ShieldAlert, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SiteBadge } from "@/components/site-badge";
import { siteMetrics } from "@/lib/demo-data";
import { useApp } from "@/components/app-providers";

export function IncidentsView() {
  const { toast } = useApp();
  return (
    <div className="page-wrap">
      <PageHeader eyebrow="Incidents" title="Incidents" description="Related tickets can be grouped when multiple schools are affected." actions={<button className="btn btn-primary" onClick={() => toast("Incident declared - audit event created")}><ShieldAlert size={15} /> Declare incident</button>} />
      <section className="card relative overflow-hidden border-[color:rgba(217,74,58,.28)] p-6">
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2"><span className="chip danger border-[color:var(--red)]"><Radio size={11} /> Division-wide - active</span><span className="font-mono text-[10px] muted">FHQ-INC-12</span></div>
              <h2 className="display text-[clamp(1.8rem,4vw,3rem)]">Wireless authentication instability</h2>
              <p className="muted mt-3 max-w-3xl leading-relaxed">Eleven requests share the same 802.1X authentication failure signature across MEC, CPS, and PPK. First seen at 8:17 AM.</p>
            </div>
            <div className="grid grid-cols-2 gap-2"><div className="card-quiet p-4 text-center"><strong className="display text-3xl danger">11</strong><p className="muted text-[10px]">Linked tickets</p></div><div className="card-quiet p-4 text-center"><strong className="display text-3xl">186</strong><p className="muted text-[10px]">Affected users</p></div></div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="card-quiet p-4"><p className="label">Root signature</p><p className="mt-2 font-mono text-xs">EAP-TLS - cert chain 0x800B0109</p></div>
            <div className="card-quiet p-4"><p className="label">Current owner</p><p className="mt-2 text-xs font-bold">Joe Gallenger - network lead</p></div>
            <div className="card-quiet p-4"><p className="label">Next update</p><p className="mt-2 text-xs font-bold">Draft ready - 186 recipients</p></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2"><button className="btn btn-danger" onClick={() => toast("Resolution update preview opened")}><Send size={14} /> Resolve + update</button><button className="btn" onClick={() => toast("Postmortem draft generated")}><FileText size={14} /> Generate postmortem</button><Link href="/status" className="btn"><BellRing size={14} /> Public update</Link></div>
        </div>
      </section>
      <section className="card mt-5 overflow-hidden">
        <div className="border-b divider px-5 py-4"><p className="label">Local clusters under watch</p><h2 className="display mt-1 text-2xl">Not incidents yet</h2></div>
        <div>{[{ code: "SBEC", title: "Projector HDMI handshake", count: 2, confidence: 74 }, { code: "OK", title: "Teams camera device loss", count: 2, confidence: 63 }].map((cluster) => <div className="flex flex-col gap-3 border-b divider px-5 py-4 last:border-0 sm:flex-row sm:items-center" key={cluster.title}><span className="chip gold">{cluster.code}</span><div className="flex-1"><strong>{cluster.title}</strong><p className="muted mt-1 text-[10px]">{cluster.count} tickets - auto-promotes at 3 - {cluster.confidence}% root-match confidence</p></div><button className="btn text-xs">Review cluster</button></div>)}</div>
      </section>
    </div>
  );
}

export function OperationsView() {
  return (
    <div className="page-wrap">
      <PageHeader eyebrow="Parked for now" title="Travel planning is not active" description="The schools are far enough apart that a route planner is not useful for the first version." actions={<Link href="/board" className="btn btn-primary">Open school board</Link>} />
      <section className="card p-6">
        <h2 className="display text-2xl">Better first-version focus</h2>
        <p className="muted mt-3 max-w-2xl leading-relaxed">For now, FHQ Tech should focus on clean tickets, school views, ownership, comments, notes, and searchable history. Travel planning can come back later if the workflow changes.</p>
      </section>
    </div>
  );
}

export function KnowledgeView() {
  const { toast } = useApp();
  const articles = [
    { title: "Restore classroom projector HDMI signal", tag: "AV & displays", site: "SBEC", uses: 18, status: "Draft from 7 resolutions" },
    { title: "Reset a PowerSchool staff sign-in", tag: "Accounts", site: "All schools", uses: 31, status: "Published" },
    { title: "Recalibrate SMART Board touch alignment", tag: "Classroom tech", site: "OK", uses: 9, status: "Published" },
    { title: "Recover Chromebook cart charging after breaker trip", tag: "Student devices", site: "All schools", uses: 22, status: "Draft from 4 resolutions" },
  ];
  return (
    <div className="page-wrap">
      <PageHeader eyebrow="Knowledge" title="Resolved work, remembered" description="Clean resolutions become drafts that can help with repeat issues." actions={<button onClick={() => toast("4 draft articles queued for review")} className="btn btn-primary"><Sparkles size={15} /> Review drafts</button>} />
      <section className="card overflow-hidden"><div className="grid gap-3 border-b divider p-5 sm:grid-cols-3"><div className="card-quiet p-4"><strong className="display text-3xl">147</strong><p className="muted mt-1 text-[10px]">Published answers</p></div><div className="card-quiet p-4"><strong className="display text-3xl gold">12</strong><p className="muted mt-1 text-[10px]">Drafts to review</p></div><div className="card-quiet p-4"><strong className="display text-3xl text-[var(--green)]">29%</strong><p className="muted mt-1 text-[10px]">Applied to first response</p></div></div><div className="divide-y divider">{articles.map((article) => <article key={article.title} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--gold-soft)] gold"><BookOpen size={17} /></span><div className="flex-1"><h3 className="font-bold">{article.title}</h3><div className="mt-2 flex flex-wrap gap-2"><span className="chip">{article.tag}</span><span className="chip">{article.site}</span><span className="muted text-[10px] self-center">Used {article.uses} times</span></div></div><span className={`chip ${article.status.startsWith("Draft") ? "gold" : "text-[var(--green)]"}`}>{article.status}</span><button className="btn text-xs">Open</button></article>)}</div></section>
    </div>
  );
}

export function ReportsView() {
  const { toast } = useApp();
  return (
    <div className="page-wrap">
      <PageHeader eyebrow="Manager view - school metrics" title="Division pulse" description="The five-second answer: load is elevated at MEC, classroom AV repeats most, and median resolution is improving." actions={<button onClick={() => toast("Management-ready weekly report generated")} className="btn btn-primary"><Download size={15} /> Export weekly brief</button>} />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[{ label: "Tickets this week", value: "84", delta: "+12%" }, { label: "Median resolution", value: "52m", delta: "-18%" }, { label: "First reply", value: "11m", delta: "-4m" }, { label: "Summary accuracy", value: "94.2%", delta: "+2.1%" }].map((item) => <div className="card p-5" key={item.label}><p className="label">{item.label}</p><div className="mt-4 flex items-end justify-between"><strong className="display text-4xl">{item.value}</strong><span className={item.delta.startsWith("+") && item.label !== "Summary accuracy" ? "danger text-xs" : "text-[var(--green)] text-xs"}>{item.delta}</span></div></div>)}</section>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_.75fr]"><section className="card p-5"><div className="mb-6"><p className="label">Seven-day volume</p><h2 className="display mt-1 text-2xl">Load by school</h2></div><div className="flex h-64 items-end gap-3 border-b divider px-2">{[42, 58, 47, 72, 66, 86, 61].map((height, index) => <div key={index} className="flex h-full flex-1 flex-col justify-end gap-1"><div className="rounded-t-lg bg-[var(--gold)]/85 transition hover:bg-[var(--gold-bright)]" style={{ height: `${height}%` }} /><span className="text-center text-[9px] muted">{["Thu", "Fri", "Mon", "Tue", "Wed", "Thu", "Fri"][index]}</span></div>)}</div></section><section className="card p-5"><p className="label danger">Fix at the source</p><h2 className="display mt-1 text-2xl">Top recurring problems</h2><ol className="mt-5 space-y-4">{[{ name: "Projector signal path", count: 19, site: "SBEC + OK" }, { name: "Chromebook charging", count: 14, site: "All schools" }, { name: "PowerSchool sign-in", count: 11, site: "PPK + CPS" }].map((item, index) => <li className="flex gap-3" key={item.name}><span className="display gold text-2xl">0{index + 1}</span><div><strong className="text-xs">{item.name}</strong><p className="muted mt-1 text-[10px]">{item.count} tickets - {item.site}</p></div></li>)}</ol></section></div>
      <section className="card mt-5 overflow-hidden"><div className="border-b divider p-5"><p className="label">School load and service health</p><h2 className="display mt-1 text-2xl">Where the work lives</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead><tr className="border-b divider text-[10px] uppercase tracking-widest muted"><th className="p-4">School</th><th className="p-4">Open</th><th className="p-4">At risk</th><th className="p-4">Median resolve</th><th className="p-4">Weekly trend</th><th className="p-4">Health</th></tr></thead><tbody>{siteMetrics.map((site) => <tr key={site.id} className="border-b divider"><td className="p-4"><SiteBadge siteId={site.id} /></td><td className="p-4 font-bold">{site.open}</td><td className="p-4 danger">{site.atRisk}</td><td className="p-4">{site.median}m</td><td className="p-4">{site.trend > 0 ? "+" : ""}{site.trend}%</td><td className="p-4"><span className={site.atRisk > 1 ? "danger" : "text-[var(--green)]"}>{site.atRisk > 1 ? "Needs focus" : "Stable"}</span></td></tr>)}</tbody></table></div></section>
    </div>
  );
}
