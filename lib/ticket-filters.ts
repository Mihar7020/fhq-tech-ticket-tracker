/**
 * Ticket list filters, kept in the page address (?school=SBEC&status=open) so Back and the
 * "← Tickets" link return to the same view, and remembered in the browser for next time.
 */
export type TicketFilters = { query: string; site: string; status: string; tech: string };
export type SiteRef = { id: string; code: string };

export const DEFAULT_FILTERS: TicketFilters = { query: "", site: "all", status: "open", tech: "all" };
export const SAVED_FILTERS_KEY = "fhq:ticket-filters";
export const LIST_CONTEXT_KEY = "fhq:ticket-list";

type Params = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

/** Reads filters from the address. School is written by code (SBEC), stored internally by id. */
export function filtersFromParams(params: Params, sites: SiteRef[]): TicketFilters | null {
  const school = first(params.school); const status = first(params.status); const tech = first(params.tech); const query = first(params.q);
  if (!school && !status && !tech && !query) return null;
  const site = !school || school === "all" ? "all" : school === "unrouted" ? "unrouted" : sites.find((item) => item.code.toLowerCase() === school.toLowerCase())?.id ?? "all";
  return { query, site, status: status || DEFAULT_FILTERS.status, tech: tech || DEFAULT_FILTERS.tech };
}

/** "?school=SBEC&status=open", leaving out anything at its default. Empty string when nothing is filtered. */
export function filtersToSearch(filters: TicketFilters, sites: SiteRef[]) {
  const params = new URLSearchParams();
  if (filters.site !== "all") params.set("school", filters.site === "unrouted" ? "unrouted" : sites.find((item) => item.id === filters.site)?.code ?? filters.site);
  if (filters.status !== DEFAULT_FILTERS.status) params.set("status", filters.status);
  if (filters.tech !== DEFAULT_FILTERS.tech) params.set("tech", filters.tech);
  if (filters.query.trim()) params.set("q", filters.query.trim());
  const text = params.toString();
  return text ? `?${text}` : "";
}

export const isDefaultFilters = (filters: TicketFilters) =>
  filters.site === "all" && filters.status === DEFAULT_FILTERS.status && filters.tech === DEFAULT_FILTERS.tech && !filters.query.trim();

/** Short description of the view for the Previous/Next bar: "SBEC · Open". */
export function describeFilters(filters: TicketFilters, sites: SiteRef[]) {
  const parts = [
    filters.site === "all" ? "All schools" : filters.site === "unrouted" ? "Unrouted" : sites.find((item) => item.id === filters.site)?.code ?? "School",
    filters.status === "open" ? "Open" : filters.status === "all" ? "Any status" : filters.status,
  ];
  if (filters.tech !== "all") parts.push(filters.tech === "unassigned" ? "Unassigned" : filters.tech.split(" ")[0]);
  if (filters.query.trim()) parts.push(`"${filters.query.trim()}"`);
  return parts.join(" · ");
}

/** The request text for the hover preview: no image placeholders, mailto duplicates or quoted chain, trimmed. */
export function previewText(text: string, maxChars = 600, maxLines = 12) {
  const quoteAt = text.search(/^(?:\s*From:\s.+\r?\n(?:.*\r?\n){0,3}?\s*(?:Sent|Date):\s|\s*-{2,}\s*Original Message|\s*On .{6,200} wrote:\s*$|\s*_{8,}\s*$)/im);
  const main = quoteAt > 20 ? text.slice(0, quoteAt) : text;
  const cleaned = main.replace(/\[cid:[^\]]+\]/gi, "").replace(/<mailto:[^>\s]+>/gi, "").replace(/<https?:[^>\s]+>/gi, "").replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  const lines = cleaned.split("\n");
  let out = lines.slice(0, maxLines).join("\n");
  const cut = lines.length > maxLines || out.length > maxChars;
  if (out.length > maxChars) out = out.slice(0, maxChars).replace(/\s+\S*$/, "");
  return cut ? `${out.trimEnd()}…` : out;
}
