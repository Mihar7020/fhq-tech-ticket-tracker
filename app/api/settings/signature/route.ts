import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { sanitizeSignatureHtml } from "@/lib/security";

const schema = z.object({ html: z.string().max(2_500_000) });
const dataImage = /data:(image\/(?:png|jpeg|gif|webp));base64,([a-zA-Z0-9+/=]+)/g;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role === "READ_ONLY") return Response.json({ error: "forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_signature" }, { status: 400 });
  const user = await db.user.findUnique({ where: { email: session.email.toLowerCase() } });
  if (!user) return Response.json({ error: "user_not_found" }, { status: 404 });

  let html = parsed.data.html;
  const matches = [...html.matchAll(dataImage)];
  for (const match of matches) {
    const bytes = Buffer.from(match[2], "base64");
    if (bytes.byteLength > 2 * 1024 * 1024) return Response.json({ error: "signature_image_too_large" }, { status: 413 });
    const extension = match[1].split("/")[1].replace("jpeg", "jpg");
    const asset = await db.signatureAsset.create({ data: { filename: `signature-logo.${extension}`, contentType: match[1], sizeBytes: bytes.byteLength, data: bytes, userId: user.id } });
    const origin = (process.env.APP_URL || new URL(request.url).origin).replace(/\/$/, "");
    html = html.replace(match[0], `${origin}/api/settings/signature-assets/${asset.id}`);
  }

  const signatureHtml = sanitizeSignatureHtml(html).trim();
  const retainedIds = [...signatureHtml.matchAll(/\/api\/settings\/signature-assets\/([a-zA-Z0-9_-]+)/g)].map((match) => match[1]);
  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { signatureHtml: signatureHtml || null } }),
    db.signatureAsset.deleteMany({ where: { userId: user.id, ...(retainedIds.length ? { id: { notIn: retainedIds } } : {}) } }),
    db.auditLog.create({ data: { entityType: "User", entityId: user.id, actorId: user.id, action: "EMAIL_SIGNATURE_UPDATED", after: { configured: Boolean(signatureHtml) } } }),
  ]);
  return Response.json({ ok: true, html: signatureHtml });
}
