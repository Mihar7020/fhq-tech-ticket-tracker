import Papa from "papaparse";
import ExcelJS from "exceljs";
import type { ImportRow } from "@/lib/csv-import";

const MAX_ROWS = 5000;
const MAX_BYTES = 25 * 1024 * 1024;

export function decodeSpreadsheetText(bytes: Uint8Array) {
  if (bytes.byteLength > MAX_BYTES) throw new Error("Directory file exceeds 25 MB.");
  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(bytes).replace(/^\uFEFF/, "");
  const replacementRatio = (utf8.match(/\uFFFD/g)?.length ?? 0) / Math.max(utf8.length, 1);
  return replacementRatio > .002 ? new TextDecoder("windows-1252").decode(bytes) : utf8;
}

export function parseStaffCsv(bytes: Uint8Array): ImportRow[] {
  const text = decodeSpreadsheetText(bytes);
  const result = Papa.parse<ImportRow>(text, { header: true, skipEmptyLines: "greedy", delimiter: "", transformHeader: (header, index) => header.trim() || `Column ${index + 1}`, transform: (value) => value.trim() });
  const fatal = result.errors.find((error) => error.type === "Delimiter" || error.type === "Quotes");
  if (fatal) throw new Error(`CSV parse error on row ${fatal.row ?? "?"}: ${fatal.message}`);
  return result.data.filter((row) => Object.values(row).some(Boolean)).slice(0, MAX_ROWS);
}

export async function parseStaffWorkbook(bytes: Uint8Array): Promise<ImportRow[]> {
  if (bytes.byteLength > MAX_BYTES) throw new Error("Directory file exceeds 25 MB.");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes as never);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("Workbook has no readable worksheet.");
  const firstRows: { rowNumber: number; values: string[]; score: number }[] = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => { if (rowNumber <= 10) { const values = (row.values as unknown[]).slice(1).map((value) => String(value ?? "").trim()); firstRows.push({ rowNumber, values, score: values.filter(Boolean).length }); } });
  const header = firstRows.sort((a, b) => b.score - a.score)[0];
  if (!header?.score) throw new Error("Workbook header could not be detected.");
  const names = header.values.map((value, index) => value || `Column ${index + 1}`);
  const rows: ImportRow[] = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => { if (rowNumber <= header.rowNumber || rows.length >= MAX_ROWS) return; const values = (row.values as unknown[]).slice(1); const record = Object.fromEntries(names.map((name, index) => [name, String(values[index] ?? "").trim()])); if (Object.values(record).some(Boolean)) rows.push(record); });
  return rows;
}

export type DirectoryRecord = { id: string; email: string; active: boolean; data: ImportRow };
export function planDirectoryUpsert(current: DirectoryRecord[], incoming: ImportRow[], emailColumn: string, deactivateMissing = false) {
  const byEmail = new Map(current.map((record) => [record.email.trim().toLowerCase(), record]));
  const incomingEmails = new Set(incoming.map((row) => row[emailColumn]?.trim().toLowerCase()).filter(Boolean));
  const added = incoming.filter((row) => !byEmail.has(row[emailColumn]?.trim().toLowerCase()));
  const updated = incoming.filter((row) => byEmail.has(row[emailColumn]?.trim().toLowerCase()));
  const inactivated = deactivateMissing ? current.filter((record) => record.active && !incomingEmails.has(record.email.trim().toLowerCase())).map((record) => ({ ...record, active: false })) : [];
  return { added, updated, inactivated, hardDeleted: [] as never[] };
}
