import { getSession } from "@/lib/auth";
import { reconcileInbox } from "@/lib/email/reconcile";

export async function POST() {
  const session = await getSession();
  if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });

  try {
    return Response.json(await reconcileInbox(48));
  } catch (error) {
    console.error("[mail-reconciliation] manual run failed", error);
    return Response.json({ error: "mail_reconciliation_failed" }, { status: 500 });
  }
}
