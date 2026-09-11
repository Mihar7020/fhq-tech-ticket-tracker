import { randomBytes } from "node:crypto";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { createMicrosoftUser, resetMicrosoftPassword } from "@/lib/email/graph";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), displayName: z.string().trim().min(2).max(120), userPrincipalName: z.string().trim().toLowerCase().email(), licenseSkuId: z.string().trim().optional() }),
  z.object({ action: z.literal("reset"), userPrincipalName: z.string().trim().toLowerCase().email() }),
]);

function temporaryPassword() {
  return `Fhq!${randomBytes(10).toString("base64url")}9a`;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return Response.json({ error: "forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });
  const { id } = await params;
  const [ticket, actor] = await Promise.all([
    db.ticket.findFirst({ where: { OR: [{ id }, { publicId: id }] } }),
    db.user.findUnique({ where: { email: session.email.toLowerCase() } }),
  ]);
  if (!ticket) return Response.json({ error: "ticket_not_found" }, { status: 404 });

  const password = temporaryPassword();
  try {
    if (parsed.data.action === "create") {
      const user = await createMicrosoftUser({ displayName: parsed.data.displayName, userPrincipalName: parsed.data.userPrincipalName, password, licenseSkuId: parsed.data.licenseSkuId || undefined });
      await db.auditLog.create({ data: { entityType: "Ticket", entityId: ticket.id, ticketId: ticket.id, actorId: actor?.id, action: "MICROSOFT_ACCOUNT_CREATED", after: { userPrincipalName: user.userPrincipalName, displayName: user.displayName, licensed: Boolean(parsed.data.licenseSkuId) } } });
      return Response.json({ ok: true, userPrincipalName: user.userPrincipalName, temporaryPassword: password });
    }
    await resetMicrosoftPassword({ userPrincipalName: parsed.data.userPrincipalName, password });
    await db.auditLog.create({ data: { entityType: "Ticket", entityId: ticket.id, ticketId: ticket.id, actorId: actor?.id, action: "MICROSOFT_PASSWORD_RESET", after: { userPrincipalName: parsed.data.userPrincipalName } } });
    return Response.json({ ok: true, userPrincipalName: parsed.data.userPrincipalName, temporaryPassword: password });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Microsoft Graph action failed.";
    console.error("Microsoft account action failed", { ticketId: ticket.id, action: parsed.data.action, detail });
    return Response.json({ error: "microsoft_action_failed", detail }, { status: 502 });
  }
}
