import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { findGraphMessageIdByInternetMessageId, graphFetch } from "@/lib/email/graph";
import { pickGraphAttachment } from "@/lib/email-display";

export const maxDuration = 60;

type GraphAttachment = { id: string; name?: string; contentType?: string; size?: number; contentId?: string | null; "@odata.type"?: string };

// Shown in the browser; everything else downloads. SVG and HTML are never shown inline.
const INLINE = /^(image\/(png|jpe?g|gif|webp|bmp)|application\/pdf)$/i;

/**
 * Streams an email attachment straight from the helpdesk mailbox in Outlook, on demand.
 * Nothing is stored by the app: if the original email is deleted from the mailbox, this returns 404.
 * Read-only; email intake is untouched.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  const attachment = await db.attachment.findUnique({ where: { id }, include: { message: { select: { internetMessageId: true, direction: true } } } });
  if (!attachment || attachment.message.direction !== "INBOUND") return Response.json({ error: "not_found" }, { status: 404 });

  try {
    const mailbox = process.env.GRAPH_MAILBOX;
    if (!mailbox) throw new Error("GRAPH_MAILBOX is not configured.");
    const messageId = await findGraphMessageIdByInternetMessageId(attachment.message.internetMessageId);
    const base = `/users/${encodeURIComponent(mailbox)}/messages/${encodeURIComponent(messageId)}/attachments`;
    const list = await (await graphFetch(`${base}?$select=id,name,contentType,size,contentId`)).json() as { value?: GraphAttachment[] };
    const files = (list.value ?? []).filter((item) => !item["@odata.type"] || item["@odata.type"] === "#microsoft.graph.fileAttachment");
    const match = pickGraphAttachment(attachment, files);
    if (!match) return Response.json({ error: "not_found" }, { status: 404 });

    const content = await graphFetch(`${base}/${encodeURIComponent(match.id)}/$value`);
    const type = attachment.contentType || match.contentType || "application/octet-stream";
    const safeName = attachment.filename.replace(/[^\w.\- ]/g, "_");
    return new Response(content.body, {
      headers: {
        "Content-Type": type,
        "Content-Disposition": `${INLINE.test(type) ? "inline" : "attachment"}; filename="${safeName}"`,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (error) {
    console.error("Attachment fetch from Outlook failed", { attachmentId: id, error });
    return Response.json({ error: "attachment_unavailable" }, { status: 404 });
  }
}
