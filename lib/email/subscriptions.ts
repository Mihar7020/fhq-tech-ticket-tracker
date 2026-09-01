import { graphFetch } from "@/lib/email/graph";

export async function createInboxSubscription() {
  const mailbox = process.env.GRAPH_MAILBOX; const appUrl = process.env.APP_URL; const clientState = process.env.GRAPH_WEBHOOK_SECRET;
  if (!mailbox || !appUrl || !clientState) throw new Error("Mailbox, app URL, and webhook secret are required.");
  const expirationDateTime = new Date(Date.now() + 2.5 * 24 * 60 * 60 * 1000).toISOString();
  const response = await graphFetch("/subscriptions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ changeType: "created", notificationUrl: `${appUrl.replace(/\/$/, "")}/api/webhooks/graph`, lifecycleNotificationUrl: `${appUrl.replace(/\/$/, "")}/api/webhooks/graph`, resource: `/users/${mailbox}/mailFolders('Inbox')/messages`, expirationDateTime, clientState, latestSupportedTlsVersion: "v1_2" }) });
  return response.json() as Promise<{ id: string; expirationDateTime: string }>;
}

export async function renewInboxSubscription(subscriptionId: string) {
  const expirationDateTime = new Date(Date.now() + 2.5 * 24 * 60 * 60 * 1000).toISOString();
  const response = await graphFetch(`/subscriptions/${encodeURIComponent(subscriptionId)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expirationDateTime }) });
  return response.json() as Promise<{ id: string; expirationDateTime: string }>;
}
