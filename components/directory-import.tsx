"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CheckCircle2, FileSpreadsheet, RotateCcw, UploadCloud, X } from "lucide-react";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import { motion } from "framer-motion";
import { ColumnMapping, ImportRow, StaffField, suggestMapping, validateRows } from "@/lib/csv-import";
import { useApp } from "@/components/app-providers";

const fieldOptions: { value: StaffField | "metadata" | "ignore"; label: string }[] = [
  { value: "name", label: "Full name" }, { value: "email", label: "Email" }, { value: "site", label: "School / site" }, { value: "role", label: "Role / title" }, { value: "department", label: "Department" }, { value: "phone", label: "Phone" }, { value: "active", label: "Active status" }, { value: "metadata", label: "Keep as metadata" }, { value: "ignore", label: "Ignore column" },
];

export function DirectoryImport() {
  const [step, setStep] = useState(0);
  const [filename, setFilename] = useState("");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useApp();
  const router = useRouter();
  const headers = rows[0] ? Object.keys(rows[0]) : [];
  const validated = useMemo(() => validateRows(rows, mapping, new Set()), [rows, mapping]);
  const counts = { add: validated.filter((row) => row.action === "add" && !row.errors.length).length, update: validated.filter((row) => row.action === "update" && !row.errors.length).length, errors: validated.filter((row) => row.errors.length).length };

  async function readFile(file?: File) {
    if (!file) return;
    setLoading(true); setError(""); setFilename(file.name);
    try {
      let parsed: ImportRow[] = [];
      if (/\.xlsx?$/i.test(file.name)) {
        const buffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.worksheets[0];
        if (!worksheet) throw new Error("The workbook has no readable worksheet.");
        const candidateRows: string[][] = [];
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber <= 10) candidateRows.push((row.values as unknown[]).slice(1).map((value) => String(value ?? "").trim()));
        });
        const headerCandidate = candidateRows.map((values, index) => ({ values, index, score: values.filter(Boolean).length })).sort((a, b) => b.score - a.score)[0];
        const headers = headerCandidate?.values.map((value, index) => value || `Column ${index + 1}`);
        if (!headers?.length) throw new Error("No header row was found in the workbook.");
        const headerRow = headerCandidate.index + 1;
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber <= headerRow || parsed.length >= 5000) return;
          const values = (row.values as unknown[]).slice(1);
          parsed.push(Object.fromEntries(headers.map((header, index) => [header, String(values[index] ?? "").trim()])));
        });
      } else {
        const text = (await file.text()).replace(/^\uFEFF/, "");
        const result = Papa.parse<ImportRow>(text, { header: true, skipEmptyLines: "greedy", transformHeader: (header) => header.trim(), delimiter: "" });
        if (result.errors.length && !result.data.length) throw new Error(result.errors[0].message);
        parsed = result.data;
      }
      if (!parsed.length) throw new Error("No staff rows were found in this file.");
      setRows(parsed.slice(0, 5000)); setMapping(suggestMapping(Object.keys(parsed[0]))); setStep(1);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The file could not be read."); }
    finally { setLoading(false); }
  }

  async function confirmImport() {
    if (importing || counts.errors > 0) return;
    setImporting(true);
    setError("");
    try {
      const response = await fetch("/api/directory/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: validated.filter((item) => !item.errors.length).map((item) => item.row), mapping }),
      });
      const result = await response.json() as { added?: number; updated?: number; error?: string };
      if (!response.ok) throw new Error(result.error === "unknown_site" ? "One or more schools could not be matched." : "The directory import could not be saved.");
      toast(`Directory imported: ${result.added ?? 0} added, ${result.updated ?? 0} updated`);
      router.push("/directory");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The directory import could not be saved.");
      setImporting(false);
    }
  }

  const steps = ["Upload", "Map columns", "Validate", "Confirm"];
  return <div className="page-wrap max-w-6xl"><div className="mb-7"><a href="/directory" className="muted mb-4 flex items-center gap-2 text-xs font-semibold"><ArrowLeft size={14} /> Back to directory</a><p className="label gold mb-2">Versioned · never destructive</p><h1 className="display text-[clamp(2.2rem,5vw,4.4rem)]">Import staff directory</h1><p className="muted mt-3 max-w-2xl">Messy files are welcome. We’ll map your headers, validate every row, and show the exact diff before anything changes.</p></div>
    <ol className="mb-6 grid grid-cols-4 gap-2" aria-label="Import progress">{steps.map((label, index) => <li key={label} className={`rounded-xl border px-3 py-3 ${index === step ? "border-[color:var(--gold)] bg-[var(--gold-soft)]" : index < step ? "border-[color:rgba(119,180,138,.4)]" : "divider"}`}><div className="flex items-center gap-2"><span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-black ${index < step ? "bg-[var(--green)] text-white" : index === step ? "bg-[var(--gold)] text-white" : "bg-[var(--ink-3)] muted"}`}>{index < step ? <Check size={11} /> : index + 1}</span><span className="hide-mobile text-xs font-bold">{label}</span></div></li>)}</ol>
    <section className="card min-h-[520px] overflow-hidden">
      {step === 0 && <div className="grid min-h-[520px] place-items-center p-6"><div className="w-full max-w-2xl text-center"><button onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void readFile(event.dataTransfer.files[0]); }} className="group w-full rounded-3xl border-2 border-dashed divider bg-[var(--ink-3)]/45 p-12 transition hover:border-[color:var(--gold)] hover:bg-[var(--gold-soft)]"><motion.span whileHover={{ y: -4 }} className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[var(--gold)] text-white shadow-lg"><UploadCloud size={28} /></motion.span><h2 className="display text-3xl">Drop a staff file here</h2><p className="muted mt-2">CSV or Excel · up to 5,000 rows · 25 MB maximum</p><span className="btn mt-6">Choose file</span></button><input ref={inputRef} className="sr-only" type="file" accept=".csv,.xlsx,.xls,text/csv" onChange={(event) => void readFile(event.target.files?.[0])} />{loading && <p className="gold mt-4">Reading and normalizing your file…</p>}{error && <div role="alert" className="mt-4 flex items-center justify-center gap-2 danger"><AlertTriangle size={15} />{error}</div>}<p className="muted mt-5 text-[11px]">Supports BOM, CRLF, semicolon delimiters, quoted commas, inconsistent casing, padded emails, and trailing blank rows.</p></div></div>}
      {step === 1 && <div><div className="flex items-center justify-between border-b divider p-5"><div><p className="label">Detected {headers.length} columns</p><h2 className="display mt-1 text-2xl">Map your headers</h2></div><span className="chip"><FileSpreadsheet size={12} /> {filename}</span></div><div className="grid gap-3 p-5 md:grid-cols-2">{headers.map((header) => <label key={header} className="card-quiet grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 p-3"><span className="min-w-0"><span className="label block">Your column</span><strong className="block truncate">{header}</strong><span className="muted block truncate text-[10px]">Example: {rows[0]?.[header]}</span></span><select aria-label={`Map ${header}`} className="input w-44" value={mapping[header] ?? "metadata"} onChange={(event) => setMapping((current) => ({ ...current, [header]: event.target.value as ColumnMapping[string] }))}>{fieldOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>)}</div><div className="flex justify-between border-t divider p-5"><button className="btn" onClick={() => setStep(0)}><ArrowLeft size={14} /> Back</button><button className="btn btn-primary" disabled={!Object.values(mapping).includes("name") || !Object.values(mapping).includes("email") || !Object.values(mapping).includes("site")} onClick={() => setStep(2)}>Validate rows <ArrowRight size={14} /></button></div></div>}
      {step === 2 && <div><div className="flex flex-wrap items-center justify-between gap-3 border-b divider p-5"><div><p className="label">Row-level preview</p><h2 className="display mt-1 text-2xl">{validated.length} staff records checked</h2></div><div className="flex gap-2"><span className="chip text-[var(--green)]">{counts.add} add</span><span className="chip gold">{counts.update} update</span><span className="chip danger">{counts.errors} need attention</span></div></div><div className="max-h-[390px] overflow-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="sticky top-0 bg-[var(--ink-2)]"><tr className="border-b divider"><th className="p-3">Row</th><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">School / site</th><th className="p-3">Result</th></tr></thead><tbody>{validated.map((item, index) => { const value = (field: StaffField) => { const header = Object.entries(mapping).find(([, mapped]) => mapped === field)?.[0]; return header ? item.row[header] : ""; }; return <tr key={index} className={`border-b divider ${item.errors.length ? "bg-[var(--red-soft)]" : ""}`}><td className="p-3 muted">{index + 2}</td><td className="p-3 font-semibold">{value("name") || "—"}</td><td className="p-3">{value("email") || "—"}</td><td className="p-3">{value("site") || "—"}</td><td className="p-3">{item.errors.length ? <span className="danger flex items-center gap-1"><X size={12} />{item.errors.join(" · ")}</span> : <span className={item.action === "add" ? "text-[var(--green)]" : "gold"}>{item.action}</span>}</td></tr>; })}</tbody></table></div><div className="flex justify-between border-t divider p-5"><button className="btn" onClick={() => setStep(1)}><ArrowLeft size={14} /> Adjust mapping</button><button className="btn btn-primary" disabled={counts.errors > 0} onClick={() => setStep(3)}>Review exact diff <ArrowRight size={14} /></button></div></div>}
      {step === 3 && <div className="p-6"><div className="mx-auto max-w-3xl"><span className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-[var(--gold-soft)] gold"><CheckCircle2 size={30} /></span><div className="text-center"><p className="label">Final diff</p><h2 className="display mt-1 text-3xl">Ready to create snapshot</h2><p className="muted mt-2">This import is an upsert. No one is deleted, and historical ticket attribution never changes.</p></div><div className="my-7 grid gap-3 sm:grid-cols-3"><div className="card-quiet p-5 text-center"><strong className="display text-4xl text-[var(--green)]">{counts.add}</strong><p className="mt-1 text-xs">People added</p></div><div className="card-quiet p-5 text-center"><strong className="display text-4xl gold">{counts.update}</strong><p className="mt-1 text-xs">People updated</p></div><div className="card-quiet p-5 text-center"><strong className="display text-4xl">0</strong><p className="mt-1 text-xs">People removed</p></div></div><label className="flex items-start gap-3 rounded-xl border divider bg-[var(--ink-3)] p-4"><input type="checkbox" className="mt-0.5 accent-[var(--gold)]" /><span><strong className="text-xs">Mark missing people inactive</strong><span className="muted mt-1 block text-[10px]">Optional and reversible. Records are never hard-deleted.</span></span></label>{error ? <p className="danger mt-4 text-center text-sm" role="alert">{error}</p> : null}<div className="mt-6 flex justify-between"><button className="btn" disabled={importing} onClick={() => setStep(2)}><ArrowLeft size={14} /> Back</button><button className="btn btn-primary" disabled={importing} onClick={() => void confirmImport()}><Check size={15} /> {importing ? "Importing..." : "Confirm import"}</button></div></div></div>}
    </section>
    <div className="mt-4 flex items-center gap-2 text-[10px] muted"><RotateCcw size={12} /> Every confirmed import creates a one-click rollback point and immutable audit event.</div>
  </div>;
}
