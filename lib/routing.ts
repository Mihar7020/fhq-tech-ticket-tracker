import type { Person, Site } from "@/lib/types";

export type RoutingSignal = { type: "exact" | "domain" | "name" | "body"; siteId?: string; personId?: string; confidence: number; detail: string };
export type RoutingResult = { outcome: "exact" | "domain" | "suggested" | "conflict" | "unknown"; siteId?: string; personId?: string; confidence: number; signals: RoutingSignal[]; rationale: string };

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const normalizeText = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const similarity = (left: string, right: string) => {
  const a = new Set(normalizeText(left).split(" ").filter(Boolean));
  const b = new Set(normalizeText(right).split(" ").filter(Boolean));
  const intersection = [...a].filter((token) => b.has(token)).length;
  return intersection / Math.max(a.size, b.size, 1);
};

export function resolveRoute(input: { senderEmail: string; displayName?: string; body?: string; people: Person[]; sites: Site[] }): RoutingResult {
  const sender = normalizeEmail(input.senderEmail);
  const signals: RoutingSignal[] = [];
  const exactPeople = input.people.filter((person) => [person.email, ...person.aliases].map(normalizeEmail).includes(sender) && person.active);
  if (exactPeople.length === 1) {
    const person = exactPeople[0];
    signals.push({ type: "exact", personId: person.id, siteId: person.siteId, confidence: 1, detail: `Exact directory alias matched ${sender}` });
  } else if (exactPeople.length > 1) {
    return { outcome: "conflict", confidence: 0, signals: exactPeople.map((person) => ({ type: "exact", personId: person.id, siteId: person.siteId, confidence: 1, detail: `Address is attached to ${person.name}` })), rationale: "The same sender address matches multiple active people." };
  }
  const domain = sender.split("@")[1];
  const domainSite = input.sites.find((site) => site.domain?.toLowerCase() === domain);
  if (domainSite) signals.push({ type: "domain", siteId: domainSite.id, confidence: .86, detail: `Sender domain ${domain} maps to ${domainSite.name}` });
  const body = normalizeText(input.body ?? "");
  const bodySite = input.sites.find((site) => body.includes(normalizeText(site.name)) || body.includes(normalizeText(site.code)));
  if (bodySite) signals.push({ type: "body", siteId: bodySite.id, confidence: .78, detail: `Email body mentions ${bodySite.name}` });
  if (!exactPeople.length && input.displayName) {
    const candidates = input.people.map((person) => ({ person, score: similarity(input.displayName!, person.name) })).sort((a, b) => b.score - a.score);
    if (candidates[0]?.score >= .7) signals.push({ type: "name", personId: candidates[0].person.id, siteId: candidates[0].person.siteId, confidence: Math.min(.79, candidates[0].score), detail: `Display name resembles ${candidates[0].person.name}` });
  }
  const exact = signals.find((signal) => signal.type === "exact");
  const siteIds = new Set(signals.map((signal) => signal.siteId).filter(Boolean));
  if (siteIds.size > 1) return { outcome: "conflict", personId: exact?.personId, siteId: exact?.siteId, confidence: exact?.confidence ?? .5, signals, rationale: "Directory, domain, or email-body site signals disagree. A technician must resolve this conflict." };
  if (exact) return { outcome: "exact", personId: exact.personId, siteId: exact.siteId, confidence: 1, signals, rationale: `${exact.detail}; supporting signals agree.` };
  const strongest = signals.sort((a, b) => b.confidence - a.confidence)[0];
  if (strongest?.type === "domain") return { outcome: "domain", siteId: strongest.siteId, confidence: strongest.confidence, signals, rationale: strongest.detail };
  if (strongest) return { outcome: "suggested", personId: strongest.personId, siteId: strongest.siteId, confidence: strongest.confidence, signals, rationale: `${strongest.detail}. Suggested only; not applied silently.` };
  return { outcome: "unknown", confidence: 0, signals: [], rationale: "No directory, domain, name, or body signal matched. Ticket stays Unrouted." };
}
