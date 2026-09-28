import { graphFetch } from "@/lib/email/graph";

type GraphSubscription = {
  id: string;
  resource: string;
  expirationDateTime: string;
  notificationUrl?: string;
  lifecycleNotificationUrl?: string | null;
};

// Graph allows up to 10,080 minutes for Outlook message subscriptions. Six days means a
// missed daily cron no longer kills intake; the old 2.5-day window survived only one miss.
const LIFETIME_MS = 6 * 24 * 60 * 60 * 1000;
const expiry = () => new Date(Date.now() + LIFETIME_MS).toISOString();

const inboxResource = () => {
  const mailbox = process.env.GRAPH_MAILBOX;
  if (!mailbox) throw new Error("GRAPH_MAILBOX is required.");
  return `users/${mailbox}/mailFolders('Inbox')/messages`;
};

const webhookUrl = () => {
  const appUrl = process.env.APP_URL;
  if (!appUrl) throw new Error("APP_URL is required.");
  if (!/^https:\/\//i.test(appUrl)) throw new Error("APP_URL must be a public https URL for Graph notifications.");
  return `${appUrl.replace(/\/$/, "")}/api/webhooks/graph`;
};

export async function createInboxSubscription() {
  const clientState = process.env.GRAPH_WEBHOOK_SECRET;
  if (!clientState) throw new Error("GRAPH_WEBHOOK_SECRET is required.");
  const url = webhookUrl();
  const response = await graphFetch("/subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ changeType: "created", notificationUrl: url, lifecycleNotificationUrl: url, resource: inboxResource(), expirationDateTime: expiry(), clientState, latestSupportedTlsVersion: "v1_2" }),
  });
  return response.json() as Promise<GraphSubscription>;
}

export async function renewInboxSubscription(subscriptionId: string) {
  const response = await graphFetch(`/subscriptions/${encodeURIComponent(subscriptionId)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expirationDateTime: expiry() }) });
  return response.json() as Promise<GraphSubscription>;
}

/** Answers a Graph `reauthorizationRequired` lifecycle event. */
export async function reauthorizeSubscription(subscriptionId: string) {
  try {
    await graphFetch(`/subscriptions/${encodeURIComponent(subscriptionId)}/reauthorize`, { method: "POST" });
  } catch {
    // Renewing the expiry also reauthorizes; fall through if the reauthorize action is rejected.
  }
  return renewInboxSubscription(subscriptionId);
}

export async function listInboxSubscriptions() {
  const response = await graphFetch("/subscriptions");
  const data = await response.json() as { value?: GraphSubscription[] };
  const expected = inboxResource().toLowerCase();
  return (data.value ?? []).filter((subscription) => subscription.resource.toLowerCase() === expected);
}

/**
 * Makes sure exactly one healthy subscription points at the current APP_URL.
 * Recreates it if it was removed, expired, or still points at an old deployment URL.
 */
export async function ensureInboxSubscription() {
  const url = webhookUrl();
  const subscriptions = await listInboxSubscriptions();
  const healthy = subscriptions.filter((subscription) => subscription.notificationUrl === url && new Date(subscription.expirationDateTime).getTime() > Date.now());
  const stale = subscriptions.filter((subscription) => !healthy.includes(subscription));
  const [keep, ...duplicates] = healthy;
  let removed = stale.length + duplicates.length;

  for (const subscription of [...stale, ...duplicates]) {
    await graphFetch(`/subscriptions/${encodeURIComponent(subscription.id)}`, { method: "DELETE" }).catch(() => undefined);
  }

  if (keep) {
    try {
      const renewed = await renewInboxSubscription(keep.id);
      return { action: "renewed" as const, id: renewed.id, expirationDateTime: renewed.expirationDateTime, removed };
    } catch {
      // Graph sometimes returns 404 for a subscription it just listed; recreate below.
      await graphFetch(`/subscriptions/${encodeURIComponent(keep.id)}`, { method: "DELETE" }).catch(() => undefined);
      removed += 1;
    }
  }
  const created = await createInboxSubscription();
  return { action: "created" as const, id: created.id, expirationDateTime: created.expirationDateTime, removed };
}
