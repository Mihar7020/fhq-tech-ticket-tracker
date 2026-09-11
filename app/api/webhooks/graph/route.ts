import { z } from "zod";
import { after } from "next/server";
import { getMessageMetadata, getMessageMime } from "@/lib/email/graph";
import { ingestMime } from "@/lib/email/ingest";
import { prismaIngestRepository } from "@/lib/email/prisma-repository";
import { rateLimit } from "@/lib/rate-limit";

const notificationSchema = z.object({ value: z.array(z.object({ clientState: z.string(), resourceData: z.object({ id: z.string().min(1) }) })).max(100) });

export async function POST(request: Request) {
  const url = new URL(request.url); const validationToken = url.searchParams.get("validationToken");
  if (validationToken) return new Response(validationToken, { status: 200, headers: { "Content-Type": "text/plain" } });
  const limiter = rateLimit(request.headers.get("x-forwarded-for") ?? "graph-webhook", 120, 60_000);
  if (!limiter.allowed) return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(Math.ceil((limiter.retryAfterMs ?? 1000) / 1000)) } });
  const parsed = notificationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_notification" }, { status: 400 });
  const secret = process.env.GRAPH_WEBHOOK_SECRET;
  if (!secret || parsed.data.value.some((item) => item.clientState !== secret)) return Response.json({ error: "invalid_client_state" }, { status: 401 });
  const accepted = parsed.data.value.map((item) => item.resourceData.id);
  after(async () => {
    await Promise.allSettled(accepted.map(async (messageId) => {
      try {
        const [mime, metadata] = await Promise.all([getMessageMime(messageId), getMessageMetadata(messageId)]);
        const result = await ingestMime(mime, prismaIngestRepository, { externalThreadId: metadata.conversationId });
        console.log("Graph message ingestion completed", { messageId, result });
        return result;
      } catch (error) {
        console.error("Graph message ingestion failed", { messageId, error });
        throw error;
      }
    }));
  });
  return Response.json({ accepted: accepted.length }, { status: 202 });
}

export function GET(request: Request) { const token = new URL(request.url).searchParams.get("validationToken"); return token ? new Response(token, { headers: { "Content-Type": "text/plain" } }) : Response.json({ service: "fhq-graph-webhook", status: "ready" }); }
