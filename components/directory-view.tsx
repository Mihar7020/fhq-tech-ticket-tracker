"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Download, Link2, Plus, Search, Trash2, Upload, UserRoundCog, Users, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SiteBadge } from "@/components/site-badge";
import { escapeCsvCell } from "@/lib/csv-import";
import { useApp } from "@/components/app-providers";
import type { Person, Site } from "@/lib/types";

export function DirectoryView({ initialPeople, sites }: { initialPeople: Person[]; sites: Site[] }) {
  const [people, setPeople] = useState(initialPeople);
  const [query, setQuery] = useState("");
  const [siteFilter, setSiteFilter] = useState("all");
  const [tab, setTab] = useState<"people" | "schools" | "history">("people");
  const [addOpen, setAddOpen] = useState(false);
  const { toast } = useApp();
  const filtered = useMemo(() => people.filter((person) => `${person.name} ${person.email} ${person.role}`.toLowerCase().includes(query.toLowerCase()) && (siteFilter === "all" || person.siteId === siteFilter)), [people, query, siteFilter]);

  function exportCsv() {
    const header = ["Full Name", "Email", "Aliases", "School", "Role", "Department", "Phone", "Active"];
    const rows = people.map((person) => [person.name, person.email, person.aliases.join(";"), sites.find((site) => site.id === person.siteId)?.name ?? "", person.role, person.department, person.phone, String(person.active)]);
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
        <div className="card p-5"><div className="flex items-center justify-between"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--gold-soft)] gold"><Users size={17} /></span><span className="chip text-[var(--green)]">Live</span></div><p className="display mt-5 text-4xl">{people.filter((person) => person.active).length}</p><p className="muted mt-1 text-xs">Active staff - {sites.length} schools</p></div>
        <div className="card p-5"><p className="label">Inactive records</p><p className="display mt-5 text-4xl">{people.filter((person) => !person.active).length}</p><p className="muted mt-1 text-xs">Kept for ticket history</p></div>
        <div className="card p-5"><p className="label">Unassigned school</p><p className="display mt-5 text-4xl">{people.filter((person) => !person.siteId).length}</p><p className="muted mt-1 text-xs">Records needing routing attention</p></div>
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
              <button onClick={() => setAddOpen(true)} className="btn"><Plus size={14} /> Add person</button>
            </>
          )}
        </div>

        {tab === "people" && <PeopleTable people={filtered} clearFilters={() => { setQuery(""); setSiteFilter("all"); }} onDelete={async (person) => { if (!window.confirm(`Remove ${person.name} from the directory? Records with ticket history will be deactivated instead.`)) return; const response = await fetch(`/api/people/${person.id}`, { method: "DELETE" }); if (!response.ok) { toast("Could not remove this person"); return; } const result = await response.json() as { action: string }; setPeople((current) => result.action === "deleted" ? current.filter((item) => item.id !== person.id) : current.map((item) => item.id === person.id ? { ...item, active: false } : item)); toast(result.action === "deleted" ? "Person deleted" : "Person deactivated to preserve ticket history"); }} />}
        {tab === "schools" && <SchoolCards sites={sites} />}
        {tab === "history" && <HistoryList />}
      </section>

      {addOpen && <AddPersonDialog sites={sites} onClose={() => setAddOpen(false)} onCreated={(person) => { setPeople((current) => [...current, person].sort((a, b) => a.name.localeCompare(b.name))); setAddOpen(false); toast("Person added"); }} />}
    </div>
  );
}

function PeopleTable({ people, clearFilters, onDelete }: { people: Person[]; clearFilters: () => void; onDelete: (person: Person) => void }) {
  if (!people.length) {
    return <div className="p-12 text-center"><UserRoundCog className="gold mx-auto mb-4" /><h2 className="display text-2xl">No people match.</h2><button className="btn mt-4" onClick={clearFilters}>Clear filters</button></div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-xs">
        <thead><tr className="border-b divider text-[10px] uppercase tracking-widest muted"><th className="p-4 pl-5">Person</th><th className="p-4">School</th><th className="p-4">Role / department</th><th className="p-4">Aliases</th><th className="p-4">Status</th><th className="p-4"></th></tr></thead>
        <tbody>
          {people.map((person) => (
            <tr key={person.id} className="border-b divider transition hover:bg-[var(--ink-3)]/55">
              <td className="p-4 pl-5"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--gold-soft)] text-[10px] font-black gold">{person.name.split(" ").map((part) => part[0]).join("")}</span><div><strong>{person.name}</strong><p className="muted mt-0.5">{person.email}</p></div></div></td>
              <td className="p-4"><SiteBadge siteId={person.siteId} compact /></td>
              <td className="p-4"><strong>{person.role}</strong><p className="muted mt-0.5">{person.department}</p></td>
              <td className="p-4"><span className="chip"><Link2 size={11} />{person.aliases.length}</span></td>
              <td className="p-4"><span className={`flex items-center gap-1.5 ${person.active ? "text-[var(--green)]" : "muted"}`}><span className={`h-1.5 w-1.5 rounded-full ${person.active ? "bg-[var(--green)]" : "bg-[var(--line-strong)]"}`} />{person.active ? "Active" : "Inactive"}</span></td>
              <td className="p-4"><button onClick={() => onDelete(person)} className="btn icon-btn h-8 min-h-8 w-8" aria-label={`Delete ${person.name}`}><Trash2 size={14} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SchoolCards({ sites }: { sites: Site[] }) {
  return (
    <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
      {sites.map((site) => (
        <article className="card-quiet p-5" key={site.id} style={{ borderTopColor: site.color, borderTopWidth: 3 }}>
          <div className="flex items-start justify-between"><div><span className="chip">{site.code}</span><h3 className="display mt-3 text-2xl">{site.name}</h3></div></div>
          <p className="muted mt-2 text-xs">{site.address}</p>
          <dl className="mt-5 space-y-2 border-t divider pt-4 text-xs"><div className="flex justify-between gap-4"><dt className="muted">Support coverage</dt><dd className="text-right">All FHQ Tech technicians</dd></div></dl>
        </article>
      ))}
    </div>
  );
}

function AddPersonDialog({ sites, onClose, onCreated }: { sites: Site[]; onClose: () => void; onCreated: (person: Person) => void }) {
  const [form, setForm] = useState({ name: "", email: "", siteId: sites[0]?.id || "", role: "", department: "", phone: "" });
  const [saving, setSaving] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSaving(true);
    const response = await fetch("/api/people", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const result = await response.json() as { id?: string };
    setSaving(false); if (!response.ok || !result.id) return;
    onCreated({ id: result.id, name: form.name, email: form.email, aliases: [], role: form.role, department: form.department, room: "", phone: form.phone, siteId: form.siteId, active: true });
  }
  const field = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/35 p-4"><form onSubmit={submit} className="card w-full max-w-xl p-5"><div className="mb-5 flex items-center justify-between"><div><p className="label">Directory</p><h2 className="display mt-1 text-2xl">Add person</h2></div><button type="button" onClick={onClose} className="btn icon-btn" aria-label="Close"><X size={16} /></button></div><div className="grid gap-4 sm:grid-cols-2"><label><span className="label mb-2 block">Full name</span><input required className="input" value={form.name} onChange={(event) => field("name", event.target.value)} /></label><label><span className="label mb-2 block">Email</span><input required type="email" className="input" value={form.email} onChange={(event) => field("email", event.target.value)} /></label><label><span className="label mb-2 block">School</span><select className="input" value={form.siteId} onChange={(event) => field("siteId", event.target.value)}>{sites.map((site) => <option key={site.id} value={site.id}>{site.code} - {site.name}</option>)}</select></label><label><span className="label mb-2 block">Role</span><input className="input" value={form.role} onChange={(event) => field("role", event.target.value)} /></label><label><span className="label mb-2 block">Department</span><input className="input" value={form.department} onChange={(event) => field("department", event.target.value)} /></label><label><span className="label mb-2 block">Phone</span><input className="input" value={form.phone} onChange={(event) => field("phone", event.target.value)} /></label></div><div className="mt-5 flex justify-end gap-2"><button type="button" className="btn" onClick={onClose}>Cancel</button><button disabled={saving} className="btn btn-primary">{saving ? "Saving..." : "Add person"}</button></div></form></div>;
}

function HistoryList() {
  return (
    <div className="p-12 text-center"><h2 className="display text-2xl">No directory imports yet</h2><p className="muted mt-2 text-sm">Import history will appear after the first real directory upload.</p></div>
  );
}
