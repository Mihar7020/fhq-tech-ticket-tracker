import { graphFetch } from "@/lib/email/graph";

type GraphSubscription = {
  id: string;
  resource: string;
  expirationDateTime: string;
};

const inboxResource = () => {
  const mailbox = process.env.GRAPH_MAILBOX;
  if (!mailbox) throw new Error("Graph mailbox is required.");
  return `users/${mailbox}/mailFolders('Inbox')/messages`;
};

export async function createInboxSubscription() {
  const mailbox = process.env.GRAPH_MAILBOX; const appUrl = process.env.APP_URL; const clientState = process.env.GRAPH_WEBHOOK_SECRET;
  if (!mailbox || !appUrl || !clientState) throw new Error("Mailbox, app URL, and webhook secret are required.");
  const expirationDateTime = new Date(Date.now() + 2.5 * 24 * 60 * 60 * 1000).toISOString();
  const response = await graphFetch("/subscriptions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ changeType: "created", notificationUrl: `${appUrl.replace(/\/$/, "")}/api/webhooks/graph`, lifecycleNotificationUrl: `${appUrl.replace(/\/$/, "")}/api/webhooks/graph`, resource: inboxResource(), expirationDateTime, clientState, latestSupportedTlsVersion: "v1_2" }) });
  return response.json() as Promise<{ id: string; expirationDateTime: string }>;
}

export async function renewInboxSubscription(subscriptionId: string) {
  const expirationDateTime = new Date(Date.now() + 2.5 * 24 * 60 * 60 * 1000).toISOString();
  const response = await graphFetch(`/subscriptions/${encodeURIComponent(subscriptionId)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expirationDateTime }) });
  return response.json() as Promise<{ id: string; expirationDateTime: string }>;
}

export async function ensureInboxSubscription() {
  const response = await graphFetch("/subscriptions");
  const subscriptions = await response.json() as { value?: GraphSubscription[] };
  const expectedResource = inboxResource().toLowerCase();
  const existing = subscriptions.value?.find(
    (subscription) => subscription.resource.toLowerCase() === expectedResource,
  );

  return existing
    ? renewInboxSubscription(existing.id)
    : createInboxSubscription();
}
