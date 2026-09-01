import { describe, expect, it } from "vitest";
import { parseStaffCsv, planDirectoryUpsert } from "@/lib/import-parser";
import { suggestMapping, validateRows, escapeCsvCell } from "@/lib/csv-import";

const bytes = (value: string) => new TextEncoder().encode(value);
describe("directory importer", () => {
  it("handles BOM, CRLF, quoted commas, semicolon delimiters, casing, whitespace, and blank rows", () => { const rows = parseStaffCsv(bytes(`\uFEFFFull Name;Email Address;School\r\n"Whitehorse, Tara"; tara@school.edu ;Standing Buffalo\r\n\r\n`)); expect(rows).toHaveLength(1); expect(rows[0]["Full Name"]).toBe("Whitehorse, Tara"); expect(rows[0]["Email Address"]).toBe("tara@school.edu"); });
  it("maps flexible headers and preserves extras as metadata", () => { const mapping = suggestMapping(["Employee Name", "Work Email", "Location", "Employee ID"]); expect(mapping["Employee Name"]).toBe("name"); expect(mapping["Work Email"]).toBe("email"); expect(mapping["Employee ID"]).toBe("metadata"); });
  it("reports row errors and duplicate addresses", () => { const rows = [{ Name: "Tara", Email: "tara@school.edu", School: "SB" }, { Name: "Other", Email: "tara@school.edu", School: "SB" }, { Name: "No Email", Email: "bad", School: "" }]; const result = validateRows(rows, { Name: "name", Email: "email", School: "site" }); expect(result[1].errors).toContain("Duplicate email in file"); expect(result[2].errors.length).toBeGreaterThan(1); });
  it("never hard-deletes and makes missing people inactive only by explicit choice", () => { const current = [{ id: "1", email: "old@school.edu", active: true, data: {} }]; const defaultPlan = planDirectoryUpsert(current, [{ Email: "new@school.edu" }], "Email"); const explicitPlan = planDirectoryUpsert(current, [{ Email: "new@school.edu" }], "Email", true); expect(defaultPlan.inactivated).toEqual([]); expect(explicitPlan.inactivated[0].active).toBe(false); expect(explicitPlan.hardDeleted).toEqual([]); });
  it("defends exported CSV formulas", () => { expect(escapeCsvCell("=HYPERLINK(\"evil\")")).toMatch(/^"'=/); });
});
