import { randomUUID } from "node:crypto";
import { simpleParser, type AddressObject } from "mailparser";
import type { Person, Site } from "@/lib/types";
import { extractDigest } from "@/lib/digest";
import { resolveRoute } from "@/lib/routing";
import { sanitizeEmailHtml, stripQuotedReply } from "@/lib/security";
import { isAutomatedMessage, matchThread, normalizeSubject } from "@/lib/threading";
import { triageEmail } from "@/lib/triage";
import { storeAttachment } from "@/lib/email/storage";

export type ExistingMessage = { messageId: string; threadId: string; subject: string; externalThreadId?: string; senderEmail?: string; sentAt?: Date };
export type IngestRepository = {
  listPeople(): Promise<Person[]>;
  listSites(): Promise<Site[]>;
  listThreadMessages(): Promise<ExistingMessage[]>;
  save(input: IngestRecord): Promise<{ ticketId: string; publicId: string }>;
};
export type IngestRecord = {
  publicId: string;
  internetMessageId: string;
  inReplyTo?: string;
  references: string[];
  senderEmail: string;
  senderName?: string;
  recipients: string[];
  ccRecipients: string[];
  externalThreadId?: string;
  subject: string;
  normalizedSubject: string;
  textBody: string;
  htmlBodySanitized?: string;
  sentAt: Date;
  threadMatch: ReturnType<typeof matchThread>;
  route: ReturnType<typeof resolveRoute>;
  digest: ReturnType<typeof extractDigest>;
  triage: ReturnType<typeof triageEmail>;
  attachments: { filename: string; contentType: string; sizeBytes: number; storageKey: string; checksum: string; contentId?: string; quarantined: boolean }[];
};

function firstAddress(value?: AddressObject | AddressObject[]) { const object = Array.isArray(value) ? value[0] : value; return object?.value?.[0]; }

export async function ingestMime(raw: Buffer, repository: IngestRepository, metadata?: { externalThreadId?: string }): Promise<{ kind: "created" | "updated" | "ignored" | "duplicate"; ticketId?: string; publicId?: string; reason?: string }> {
  const maxRaw = 30 * 1024 * 1024;
  if (raw.byteLength > maxRaw) throw new Error("Raw message exceeds the 30 MB safety limit.");
  const parsed = await simpleParser(raw, { skipHtmlToText: false, skipTextToHtml: true, maxHtmlLengthToParse: 5_000_000 });
  const sender = firstAddress(parsed.from);
  if (!sender?.address) {
    return { kind: "ignored", reason: "Message has no parseable sender." };
  }
  const internetMessageId = parsed.messageId?.trim();
  if (!internetMessageId) {
    return { kind: "ignored", reason: "Message has no Message-ID and cannot be deduplicated safely." };
  }
  const headerValues: Record<string, string | undefined> = { "auto-submitted": parsed.headers.get("auto-submitted")?.toString(), precedence: parsed.headers.get("precedence")?.toString(), "x-autoreply": parsed.headers.get("x-autoreply")?.toString() };
  if (isAutomatedMessage(headerValues, sender.address)) {
    return { kind: "ignored", reason: "Loop protection blocked an automated response." };
  }
  const existing = await repository.listThreadMessages();
  const references = Array.isArray(parsed.references) ? parsed.references : parsed.references ? [parsed.references] : [];
  const sentAt = parsed.date ?? new Date();
  const threadMatch = matchThread({ messageId: internetMessageId, inReplyTo: parsed.inReplyTo, references, subject: parsed.subject ?? "(no subject)", externalThreadId: metadata?.externalThreadId, senderEmail: sender.address, sentAt }, existing);
  if (threadMatch.kind === "duplicate") {
    return { kind: "duplicate", reason: "Message-ID already ingested." };
  }
  const cleanText = stripQuotedReply(parsed.text ?? "");
  const [people, sites] = await Promise.all([repository.listPeople(), repository.listSites()]);
  const route = resolveRoute({ senderEmail: sender.address, displayName: sender.name, body: cleanText, people, sites });
  const digest = extractDigest(cleanText);
  const triage = triageEmail(cleanText, digest.affectedCount, digest.neededBy ? 60 : undefined);
  const maxAttachment = Number(process.env.ATTACHMENT_MAX_BYTES ?? 26_214_400);
  const attachments = await Promise.all(parsed.attachments.map(async (attachment) => {
    if (attachment.size > maxAttachment) throw new Error(`Attachment ${attachment.filename ?? "unnamed"} exceeds the configured limit.`);
    const stored = await storeAttachment({ bytes: attachment.content, filename: attachment.filename ?? "attachment", contentType: attachment.contentType });
    return { filename: attachment.filename ?? "attachment", contentType: attachment.contentType, sizeBytes: attachment.size, storageKey: stored.key, checksum: stored.checksum, contentId: attachment.contentId, quarantined: stored.quarantined };
  }));
  const addresses = (value?: AddressObject | AddressObject[]) => [...(value ? (Array.isArray(value) ? value : [value]) : [])].flatMap((item) => item.value.map((address) => address.address?.toLowerCase() ?? "")).filter(Boolean);
  const record: IngestRecord = { publicId: `FHQ-${Date.now().toString().slice(-6)}`, internetMessageId, inReplyTo: parsed.inReplyTo, references, senderEmail: sender.address.toLowerCase(), senderName: sender.name, recipients: addresses(parsed.to), ccRecipients: addresses(parsed.cc), externalThreadId: metadata?.externalThreadId, subject: parsed.subject?.slice(0, 500) || "(no subject)", normalizedSubject: normalizeSubject(parsed.subject ?? ""), textBody: cleanText, htmlBodySanitized: parsed.html ? sanitizeEmailHtml(parsed.html) : undefined, sentAt, threadMatch, route, digest, triage, attachments };
  const saved = await repository.save(record);
  return { kind: threadMatch.kind === "match" ? "updated" : "created", ...saved };
}

export function createMemoryRepository(input: { people: Person[]; sites: Site[]; messages?: ExistingMessage[] }) {
  const records: IngestRecord[] = []; const messages = input.messages ?? [];
  const repository: IngestRepository & { records: IngestRecord[] } = {
    records,
    async listPeople() { return input.people; }, async listSites() { return input.sites; }, async listThreadMessages() { return messages; },
    async save(record) { records.push(record); return { ticketId: randomUUID(), publicId: record.publicId }; },
  };
  return repository;
}
