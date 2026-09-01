export type StaffField = "name" | "email" | "site" | "role" | "department" | "room" | "phone" | "active";
export type ImportRow = Record<string, string>;
export type ColumnMapping = Record<string, StaffField | "metadata" | "ignore">;
export type ValidatedRow = { row: ImportRow; errors: string[]; action: "add" | "update" | "unchanged" };

const aliases: Record<StaffField, string[]> = {
  name: ["name", "full name", "employee name", "staff name"],
  email: ["email", "email address", "work email", "e-mail"],
  site: ["site", "school", "location", "worksite"],
  role: ["role", "title", "job title", "position"],
  department: ["department", "dept"],
  room: ["room", "room number", "office"],
  phone: ["phone", "telephone", "extension"],
  active: ["active", "status", "enabled"],
};

export function suggestMapping(headers: string[]): ColumnMapping {
  return Object.fromEntries(headers.map((header) => {
    const normalized = header.trim().toLowerCase();
    const match = (Object.keys(aliases) as StaffField[]).find((field) => aliases[field].includes(normalized));
    return [header, match ?? "metadata"];
  }));
}

export function validateRows(rows: ImportRow[], mapping: ColumnMapping, existingEmails: Set<string> = new Set()): ValidatedRow[] {
  const seen = new Set<string>();
  const mappedValue = (row: ImportRow, field: StaffField) => Object.entries(mapping).find(([, value]) => value === field)?.[0] ? row[Object.entries(mapping).find(([, value]) => value === field)![0]]?.trim() : "";
  return rows.filter((row) => Object.values(row).some((value) => value.trim())).map((row) => {
    const name = mappedValue(row, "name");
    const email = mappedValue(row, "email").toLowerCase();
    const site = mappedValue(row, "site");
    const errors: string[] = [];
    if (!name) errors.push("Full name is required");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Valid email is required");
    if (!site) errors.push("School/site is required");
    if (email && seen.has(email)) errors.push("Duplicate email in file");
    seen.add(email);
    return { row, errors, action: existingEmails.has(email) ? "update" : "add" } as ValidatedRow;
  });
}

export function escapeCsvCell(value: string): string {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}
