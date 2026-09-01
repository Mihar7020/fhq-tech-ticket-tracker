export const normalizeSubject = (subject: string) => subject.replace(/^\s*((re|fw|fwd):\s*)+/gi, "").replace(/\[FHQ-\d+\]/gi, "").trim().toLowerCase();
export const isAutomatedMessage = (headers: Record<string, string | undefined>, from: string) => {
  const auto = `${headers["auto-submitted"] ?? ""} ${headers["precedence"] ?? ""} ${headers["x-autoreply"] ?? ""}`.toLowerCase();
  return /auto-replied|auto-generated|bulk|junk|list/.test(auto) || /mailer-daemon|postmaster|no-?reply/i.test(from);
};
export function matchThread(input: { messageId: string; inReplyTo?: string; references?: string[]; subject: string }, existing: { messageId: string; threadId: string; subject: string }[]) {
  if (existing.some((item) => item.messageId === input.messageId)) return { kind: "duplicate" as const };
  const replyIds = new Set([input.inReplyTo, ...(input.references ?? [])].filter(Boolean));
  const direct = existing.find((item) => replyIds.has(item.messageId));
  if (direct) return { kind: "match" as const, threadId: direct.threadId, reason: "Message-ID ancestry" };
  const normalized = normalizeSubject(input.subject);
  const subjectMatch = existing.find((item) => normalizeSubject(item.subject) === normalized);
  return subjectMatch ? { kind: "candidate" as const, threadId: subjectMatch.threadId, reason: "Normalized subject only; sender and time window must also match" } : { kind: "new" as const };
}
