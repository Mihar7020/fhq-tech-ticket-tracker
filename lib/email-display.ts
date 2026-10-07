import type { AttachmentInfo } from "@/lib/types";

/** Content-ID as written in "[cid:...]" placeholders or MIME headers, normalised for comparison. */
export const normalizeCid = (value?: string | null) => (value ?? "").trim().replace(/^<|>$/g, "").toLowerCase();

export const isImageAttachment = (attachment: Pick<AttachmentInfo, "contentType">) => /^image\/(png|jpe?g|gif|webp|bmp)$/i.test(attachment.contentType);

export const attachmentUrl = (attachment: Pick<AttachmentInfo, "id">) => `/api/attachments/${encodeURIComponent(attachment.id)}`;

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type EmailSegment = { kind: "text"; value: string } | { kind: "image"; attachment: AttachmentInfo };

/**
 * Turns an email's plain text into text and inline-image segments.
 * Outlook writes inline images as "[cid:image001.png@01DD...]"; those become the real image when
 * the attachment is known, and disappear when it isn't. Duplicated "<mailto:...>" links are dropped.
 */
export function splitEmailText(text: string, attachments: AttachmentInfo[]) {
  const byCid = new Map(attachments.filter((item) => item.contentId).map((item) => [normalizeCid(item.contentId), item]));
  const used = new Set<string>();
  const segments: EmailSegment[] = [];
  const cleaned = text.replace(/<mailto:[^>\s]+>/gi, "");
  const pattern = /\[cid:([^\]\s]+)\]/gi;
  let last = 0;
  for (const match of cleaned.matchAll(pattern)) {
    const before = cleaned.slice(last, match.index);
    if (before) segments.push({ kind: "text", value: before });
    const attachment = byCid.get(normalizeCid(match[1]));
    if (attachment && isImageAttachment(attachment)) {
      segments.push({ kind: "image", attachment });
      used.add(attachment.id);
    }
    last = (match.index ?? 0) + match[0].length;
  }
  const rest = cleaned.slice(last);
  if (rest) segments.push({ kind: "text", value: rest });
  return { segments, others: attachments.filter((item) => !used.has(item.id)) };
}

/** Picks the Graph attachment that corresponds to a stored attachment row. */
export function pickGraphAttachment<T extends { id: string; name?: string; contentId?: string | null }>(stored: { filename: string; contentId?: string | null }, candidates: T[]) {
  const cid = normalizeCid(stored.contentId);
  if (cid) {
    const byCid = candidates.find((item) => normalizeCid(item.contentId) === cid);
    if (byCid) return byCid;
  }
  return candidates.find((item) => item.name === stored.filename);
}
