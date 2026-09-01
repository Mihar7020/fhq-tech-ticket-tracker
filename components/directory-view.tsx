"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronDown, Download, FileClock, Link2, MoreHorizontal, Plus, Search, Upload, UserRoundCog, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SiteBadge } from "@/components/site-badge";
import { people as initialPeople, sites } from "@/lib/demo-data";
import { escapeCsvCell } from "@/lib/csv-import";
import { useApp } from "@/components/app-providers";

export function DirectoryView() {
  const [query, setQuery] = useState("");
  const [siteFilter, setSiteFilter] = useState("all");
  const [tab, setTab] = useState<"people" | "schools" | "history">("people");
  const { toast } = useApp();
  const filtered = useMemo(() => initialPeople.filter((person) => `${person.name} ${person.email} ${person.role}`.toLowerCase().includes(query.toLowerCase()) && (siteFilter === "all" || person.siteId === siteFilter)), [query, siteFilter]);

  function exportCsv() {
    const header = ["Full Name", "Email", "Aliases", "School", "Role", "Department", "Room", "Phone", "Active"];
    const rows = initialPeople.map((person) => [person.name, person.email, person.aliases.join(";"), sites.find((site) => site.id === person.siteId)?.name ?? "", person.role, person.department, person.room, person.phone, String(person.active)]);
    const csv = [header, ...rows].map((row) => row.map((cell) => escapeCsvCell(cell)).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "fhq-staff-directory.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    toast("Directory exported");
  }

  return (
    <div className="page-wrap">
      <PageHeader
        eyebrow="Admin"
        title="Staff directory"
        description="People, aliases, and schools power ticket routing."
        actions={
          <>
            <button className="btn" onClick={exportCsv}><Download size={15} /> Export CSV</button>
            <Link className="btn btn-primary" href="/directory/import"><Upload size={15} /> Import directory</Link>
          </>
        }
      />

      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="card p-5"><div className="flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--gold-soft)] gold"><Users size={17} /></span><span className="chip text-[var(--green)]">98.6% routed</span></div><p className="display mt-5 text-4xl">1,247</p><p className="muted mt-1 text-xs">Active staff - 6 schools</p></div>
        <div className="card p-5"><div className="flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--red-soft)] danger"><AlertTriangle size={17} /></span><span className="label danger">Needs attention</span></div><p className="display mt-5 text-4xl">3</p><p className="muted mt-1 text-xs">2 unknown senders - 1 duplicate suspect</p></div>
        <div className="card p-5"><div className="flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--ink-3)] gold"><FileClock size={17} /></span><span className="muted text-[10px]">Aug 12 - Mihar</span></div><p className="display mt-5 text-4xl">v18</p><p className="muted mt-1 text-xs">Current import snapshot</p></div>
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b divider p-4 lg:flex-row lg:items-center">
          <div className="flex rounded-lg border divider bg-[var(--ink-3)] p-1">
            {(["people", "schools", "history"] as const).map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-md px-3 py-2 text-xs font-bold capitalize ${tab === item ? "accent-fill" : "muted"}`}>{item}</button>)}
          </div>
          {tab === "people" && (
            <>
              <label className="relative flex-1">
                <span className="sr-only">Search people</span>
                <Search size={15} className="muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input className="input input-with-icon" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, role..." />
              </label>
              <label className="relative">
                <span className="sr-only">Filter by school</span>
                <select value={siteFilter} onChange={(event) => setSiteFilter(event.target.value)} className="btn appearance-none pr-9">
                  <option value="all">All schools</option>
                  {sites.map((site) => <option value={site.id} key={site.id}>{site.code} - {site.name}</option>)}
                </select>
                <ChevronDown size={13} className="pointer-events-none absolute right-3 top-3" />
              </label>
              <button onClick={() => toast("New person form opened")} className="btn"><Plus size={14} /> Add person</button>
            </>
          )}
        </div>

        {tab === "people" && <PeopleTable people={filtered} clearFilters={() => { setQuery(""); setSiteFilter("all"); }} />}
        {tab === "schools" && <SchoolCards />}
        {tab === "history" && <HistoryList />}
      </section>

      <section className="card mt-5 overflow-hidden">
        <div className="flex items-center justify-between border-b divider px-5 py-4"><div><p className="label danger">Needs attention</p><h2 className="display mt-1 text-2xl">Three routing gaps</h2></div><span className="chip danger">3</span></div>
        <div className="divide-y divider">
          {[
            { title: "coach.harris@gmail.com", body: "Unknown sender - 2 tickets mention Chief Payepot School", action: "Create or link person" },
            { title: "Samantha Keepness", body: "Directory record has no school - imported Aug 12", action: "Assign school" },
            { title: "Tara White Horse / Tara Whitehorse", body: "92% duplicate confidence - shared phone and room", action: "Review merge" },
          ].map((item) => <div key={item.title} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--red-soft)] danger"><AlertTriangle size={15} /></span><div className="flex-1"><strong className="text-xs">{item.title}</strong><p className="muted mt-1 text-[10px]">{item.body}</p></div><button className="btn text-xs" onClick={() => toast(`${item.action} opened`)}>{item.action}</button></div>)}
        </div>
      </section>
    </div>
  );
}

function PeopleTable({ people, clearFilters }: { people: typeof initialPeople; clearFilters: () => void }) {
  if (!people.length) {
    return <div className="p-12 text-center"><UserRoundCog className="gold mx-auto mb-4" /><h2 className="display text-2xl">No people match.</h2><button className="btn mt-4" onClick={clearFilters}>Clear filters</button></div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-xs">
        <thead><tr className="border-b divider text-[10px] uppercase tracking-widest muted"><th className="p-4 pl-5">Person</th><th className="p-4">School</th><th className="p-4">Role / department</th><th className="p-4">Room</th><th className="p-4">Aliases</th><th className="p-4">Status</th><th className="p-4"></th></tr></thead>
        <tbody>
          {people.map((person) => (
            <tr key={person.id} className="border-b divider transition hover:bg-[var(--ink-3)]/55">
              <td className="p-4 pl-5"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--gold-soft)] text-[10px] font-black gold">{person.name.split(" ").map((part) => part[0]).join("")}</span><div><strong>{person.name}</strong><p className="muted mt-0.5">{person.email}</p></div></div></td>
              <td className="p-4"><SiteBadge siteId={person.siteId} compact /></td>
              <td className="p-4"><strong>{person.role}</strong><p className="muted mt-0.5">{person.department}</p></td>
              <td className="p-4">{person.room}</td>
              <td className="p-4"><span className="chip"><Link2 size={11} />{person.aliases.length}</span></td>
              <td className="p-4"><span className="flex items-center gap-1.5 text-[var(--green)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--green)]" />Active</span></td>
              <td className="p-4"><button className="btn icon-btn h-8 min-h-8 w-8" aria-label={`Edit ${person.name}`}><MoreHorizontal size={14} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SchoolCards() {
  return (
    <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
      {sites.map((site) => (
        <article className="card-quiet p-5" key={site.id} style={{ borderTopColor: site.color, borderTopWidth: 3 }}>
          <div className="flex items-start justify-between"><div><span className="chip">{site.code}</span><h3 className="display mt-3 text-2xl">{site.name}</h3></div><button className="btn icon-btn h-8 min-h-8 w-8" aria-label={`Edit ${site.name}`}><MoreHorizontal size={14} /></button></div>
          <p className="muted mt-2 text-xs">{site.address}</p>
          <dl className="mt-5 space-y-2 border-t divider pt-4 text-xs"><div className="flex justify-between"><dt className="muted">Primary tech</dt><dd>{site.primaryTech}</dd></div><div className="flex justify-between"><dt className="muted">Bell schedule</dt><dd>{site.bellSchedule}</dd></div><div className="flex justify-between"><dt className="muted">Mail signal</dt><dd>{site.domain}</dd></div></dl>
        </article>
      ))}
    </div>
  );
}

function HistoryList() {
  const history = [
    { v: "v18", file: "FHQTC Staff List - August.xlsx", date: "Aug 12, 2026 - 9:18 AM", actor: "Mihar Kathiriya", diff: "+24 - 31 updated" },
    { v: "v17", file: "Staff Export 2026-06-30.csv", date: "Jun 30, 2026 - 3:42 PM", actor: "Rodello Manalastas", diff: "+8 - 19 updated" },
    { v: "v16", file: "May-staff-clean.xlsx", date: "May 14, 2026 - 10:05 AM", actor: "Mihar Kathiriya", diff: "+12 - 6 inactive" },
  ];

  return (
    <div className="p-5">
      <div className="space-y-3">
        {history.map((item, index) => <article key={item.v} className="card-quiet flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><span className={`grid h-11 w-11 place-items-center rounded-lg font-black ${index === 0 ? "bg-[var(--gold)] text-white" : "bg-[var(--ink-3)]"}`}>{item.v}</span><div className="min-w-0 flex-1"><strong>{item.file}</strong><p className="muted mt-1 text-[10px]">{item.date} - by {item.actor} - {item.diff}</p></div>{index === 0 ? <span className="chip text-[var(--green)]">Current</span> : <button className="btn text-xs">Preview rollback</button>}</article>)}
      </div>
      <div className="mt-5 rounded-lg border divider bg-[var(--gold-soft)] p-4 text-xs"><strong>Historical attribution remains stable.</strong><p className="muted mt-1">Rolling back the directory changes current routing records only. Existing tickets keep the person and school snapshot captured on intake.</p></div>
    </div>
  );
}
