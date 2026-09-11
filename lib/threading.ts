export const normalizeSubject = (subject: string) => subject.replace(/^\s*((re|fw|fwd):\s*)+/gi, "").replace(/\[FHQ-\d+\]/gi, "").trim().toLowerCase();
export const isAutomatedMessage = (headers: Record<string, string | undefined>, from: string) => {
  const auto = `${headers["auto-submitted"] ?? ""} ${headers["precedence"] ?? ""} ${headers["x-autoreply"] ?? ""}`.toLowerCase();
  return /auto-replied|auto-generated|bulk|junk|list/.test(auto) || /mailer-daemon|postmaster|no-?reply/i.test(from);
};
export function matchThread(input: { messageId: string; inReplyTo?: string; references?: string[]; subject: string; externalThreadId?: string; senderEmail?: string; sentAt?: Date }, existing: { messageId: string; threadId: string; subject: string; externalThreadId?: string; senderEmail?: string; sentAt?: Date }[]) {
  if (existing.some((item) => item.messageId === input.messageId)) return { kind: "duplicate" as const };
  if (input.externalThreadId) {
    const conversation = existing.find((item) => item.externalThreadId === input.externalThreadId);
    if (conversation) return { kind: "match" as const, threadId: conversation.threadId, reason: "Microsoft conversation ID" };
  }
  const replyIds = new Set([input.inReplyTo, ...(input.references ?? [])].filter(Boolean));
  const direct = existing.find((item) => replyIds.has(item.messageId));
  if (direct) return { kind: "match" as const, threadId: direct.threadId, reason: "Message-ID ancestry" };
  const normalized = normalizeSubject(input.subject);
  const subjectMatches = existing.filter((item) => normalizeSubject(item.subject) === normalized);
  if (input.senderEmail && input.sentAt) {
    const trustedSubjectMatch = subjectMatches.find((item) => item.senderEmail && item.sentAt && input.senderEmail!.toLowerCase() === item.senderEmail.toLowerCase() && Math.abs(input.sentAt!.getTime() - item.sentAt.getTime()) <= 30 * 24 * 60 * 60 * 1000);
    if (trustedSubjectMatch) return { kind: "match" as const, threadId: trustedSubjectMatch.threadId, reason: "Same sender and subject within 30 days" };
  }
  const subjectMatch = subjectMatches[0];
  return subjectMatch ? { kind: "candidate" as const, threadId: subjectMatch.threadId, reason: "Normalized subject only; sender and time window must also match" } : { kind: "new" as const };
}
