import { getSession } from "@/lib/auth";
import { listSubscribedSkus } from "@/lib/email/graph";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return Response.json({ error: "forbidden" }, { status: 403 });
  try {
    return Response.json({ licenses: await listSubscribedSkus() });
  } catch (error) {
    console.error("Microsoft license lookup failed", error);
    return Response.json({ error: "license_lookup_failed" }, { status: 502 });
  }
}
