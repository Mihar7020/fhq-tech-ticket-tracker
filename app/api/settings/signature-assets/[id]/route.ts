import { db } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asset = await db.signatureAsset.findUnique({ where: { id } });
  if (!asset) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(asset.data), { headers: { "Content-Type": asset.contentType, "Content-Length": String(asset.sizeBytes), "Cache-Control": "public, max-age=31536000, immutable" } });
}
