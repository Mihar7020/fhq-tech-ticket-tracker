import { describe, expect, it } from "vitest";
import { DEFAULT_FILTERS, describeFilters, filtersFromParams, filtersToSearch, previewText } from "@/lib/ticket-filters";

const sites = [{ id: "s1", code: "SBEC" }, { id: "s2", code: "OFFICE" }];

describe("filters in the address", () => {
  it("round-trips school by code, status, tech and search", () => {
    const filters = { query: "printer", site: "s1", status: "In progress", tech: "Joe Gallenger" };
    const search = filtersToSearch(filters, sites);
    expect(search).toBe("?school=SBEC&status=In+progress&tech=Joe+Gallenger&q=printer");
    expect(filtersFromParams(Object.fromEntries(new URLSearchParams(search)), sites)).toEqual(filters);
  });
  it("leaves the address clean for the default view", () => {
    expect(filtersToSearch(DEFAULT_FILTERS, sites)).toBe("");
    expect(filtersFromParams({}, sites)).toBeNull();
  });
  it("matches school codes case-insensitively and handles unrouted and unknown codes", () => {
    expect(filtersFromParams({ school: "sbec" }, sites)?.site).toBe("s1");
    expect(filtersFromParams({ school: "unrouted" }, sites)?.site).toBe("unrouted");
    expect(filtersFromParams({ school: "NOPE" }, sites)?.site).toBe("all");
  });
  it("describes the view", () => {
    expect(describeFilters({ ...DEFAULT_FILTERS, site: "s1" }, sites)).toBe("SBEC · Open");
  });
});

describe("previewText", () => {
  it("drops image placeholders, mailto duplicates and the quoted chain", () => {
    const text = "Hi, the printer is jammed.\n[cid:image001.png@01DD]\nSierra.Poitras@fhqtc.net<mailto:Sierra.Poitras@fhqtc.net>\n\nFrom: Joe <joe@fhqtc.net>\nSent: Monday\nSubject: RE";
    expect(previewText(text)).toBe("Hi, the printer is jammed.\n\nSierra.Poitras@fhqtc.net");
  });
  it("trims long requests", () => {
    expect(previewText("word ".repeat(400), 100).length).toBeLessThanOrEqual(101);
    expect(previewText("a\n".repeat(30), 600, 5)).toBe("a\na\na\na\na…");
  });
});
