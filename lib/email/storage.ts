import { checksum } from "@/lib/email/graph";

export async function storeAttachment(input: { bytes: Buffer; filename: string; contentType: string }) {
  const max = Number(process.env.ATTACHMENT_MAX_BYTES ?? 26_214_400);
  if (input.bytes.byteLength > max) throw new Error(`Attachment exceeds ${max} bytes.`);
  const hash = checksum(input.bytes);
  const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
  const key = `attachments/${hash.slice(0, 2)}/${hash}-${safeName}`;
  const endpoint = process.env.STORAGE_ENDPOINT;
  if (!endpoint) return { key: `quarantine://${key}`, checksum: hash, quarantined: true };
  const response = await fetch(`${endpoint.replace(/\/$/, "")}/${key}`, { method: "PUT", headers: { "Content-Type": input.contentType, "X-Content-SHA256": hash, ...(process.env.STORAGE_BUCKET ? { "X-Storage-Bucket": process.env.STORAGE_BUCKET } : {}) }, body: new Uint8Array(input.bytes) });
  if (!response.ok) throw new Error(`Attachment storage failed (${response.status}).`);
  return { key, checksum: hash, quarantined: false };
}
