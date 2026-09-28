const TICKET_TAG = /\[(FHQ-\d+)\]/i;
const REPLY_PREFIX = /^\s*((re|fw|fwd|aw|sv|antw)\s*:\s*)+/i;

export const normalizeSubject = (subject: string) => subject.replace(REPLY_PREFIX, "").replace(/\[FHQ-\d+\]/gi, "").replace(/\s+/g, " ").trim().toLowerCase();
export const extractTicketTag = (subject: string) => subject.match(TICKET_TAG)?.[1]?.toUpperCase();
export const hasReplyPrefix = (subject: string) => REPLY_PREFIX.test(subject);
export const tagSubject = (subject: string, publicId: string) => (extractTicketTag(subject) ? subject : `${subject.replace(REPLY_PREFIX, "").trim()} [${publicId}]`);

export const isAutomatedMessage = (headers: Record<string, string | undefined>, from: string) => {
  const auto = `${headers["auto-submitted"] ?? ""} ${headers["precedence"] ?? ""} ${headers["x-autoreply"] ?? ""}`.toLowerCase();
  return /auto-replied|auto-generated|bulk|junk|list/.test(auto) || /mailer-daemon|postmaster|no-?reply/i.test(from);
};

export type ThreadCandidate = { messageId: string; threadId: string; subject: string; externalThreadId?: string; senderEmail?: string; sentAt?: Date; ticketPublicId?: string };
export type ThreadInput = { messageId: string; inReplyTo?: string; references?: string[]; subject: string; externalThreadId?: string; senderEmail?: string; sentAt?: Date };
export type ThreadMatch =
  | { kind: "duplicate" }
  | { kind: "match"; threadId: string; reason: string }
  | { kind: "candidate"; threadId: string; reason: string }
  | { kind: "new" };

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

/**
 * Order of trust:
 * 1. Message-ID already stored        -> duplicate
 * 2. [FHQ-1234] tag in the subject     -> match (we put it there on every outbound reply)
 * 3. In-Reply-To / References ancestry -> match
 * 4. Outlook conversationId, ONLY when the message is actually a reply (reply headers or Re:/Fw: prefix).
 *    Exchange groups unrelated mail with identical subjects into one conversation, so a brand-new
 *    "Printer not working" from a different person must never be welded into an old ticket.
 * 5. Same sender + same subject + reply prefix within 30 days -> match
 * 6. Subject-only                      -> candidate (new ticket, flagged as possibly related)
 */
export function matchThread(input: ThreadInput, existing: ThreadCandidate[]): ThreadMatch {
  if (existing.some((item) => item.messageId === input.messageId)) return { kind: "duplicate" };

  const tag = extractTicketTag(input.subject);
  if (tag) {
    const tagged = existing.find((item) => item.ticketPublicId?.toUpperCase() === tag);
    if (tagged) return { kind: "match", threadId: tagged.threadId, reason: `Ticket tag ${tag} in subject` };
  }

  const replyIds = new Set([input.inReplyTo, ...(input.references ?? [])].filter(Boolean));
  const direct = existing.find((item) => replyIds.has(item.messageId));
  if (direct) return { kind: "match", threadId: direct.threadId, reason: "Message-ID ancestry" };

  const looksLikeReply = replyIds.size > 0 || hasReplyPrefix(input.subject);
  if (input.externalThreadId && looksLikeReply) {
    const conversation = existing.find((item) => item.externalThreadId === input.externalThreadId);
    if (conversation) return { kind: "match", threadId: conversation.threadId, reason: "Microsoft conversation ID on a reply" };
  }

  const normalized = normalizeSubject(input.subject);
  const subjectMatches = normalized ? existing.filter((item) => normalizeSubject(item.subject) === normalized) : [];
  if (looksLikeReply && input.senderEmail && input.sentAt) {
    const sender = input.senderEmail.toLowerCase();
    const trusted = subjectMatches.find((item) => item.senderEmail?.toLowerCase() === sender && item.sentAt && Math.abs(input.sentAt!.getTime() - item.sentAt.getTime()) <= THIRTY_DAYS);
    if (trusted) return { kind: "match", threadId: trusted.threadId, reason: "Reply from same sender with same subject within 30 days" };
  }

  const subjectMatch = subjectMatches[0];
  return subjectMatch ? { kind: "candidate", threadId: subjectMatch.threadId, reason: "Same subject only; opened as a new ticket and flagged as possibly related" } : { kind: "new" };
}
