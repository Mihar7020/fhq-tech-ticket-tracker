import { createHash } from "node:crypto";

const GRAPH_ROOT = "https://graph.microsoft.com/v1.0";
let tokenCache: { token: string; expiresAt: number } | undefined;

export async function getGraphToken() {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token;
  const tenant = process.env.GRAPH_TENANT_ID || process.env.MICROSOFT_TENANT_ID;
  const clientId = process.env.GRAPH_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.GRAPH_CLIENT_SECRET || process.env.MICROSOFT_CLIENT_SECRET;
  if (!tenant || !clientId || !clientSecret) throw new Error("Microsoft Graph credentials are not configured.");
  const body = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, scope: "https://graph.microsoft.com/.default", grant_type: "client_credentials" });
  const response = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, cache: "no-store" });
  if (!response.ok) throw new Error(`Graph token request failed (${response.status}).`);
  const data = await response.json() as { access_token: string; expires_in: number };
  tokenCache = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

export async function graphFetch(path: string, init?: RequestInit) {
  const token = await getGraphToken();
  const response = await fetch(`${GRAPH_ROOT}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) }, cache: "no-store" });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Microsoft Graph ${path} failed (${response.status}).${detail ? ` ${detail.slice(0, 500)}` : ""}`);
  }
  return response;
}

export async function getMessageMime(messageId: string) {
  const mailbox = process.env.GRAPH_MAILBOX;
  if (!mailbox) throw new Error("GRAPH_MAILBOX is not configured.");
  const response = await graphFetch(`/users/${encodeURIComponent(mailbox)}/messages/${encodeURIComponent(messageId)}/$value`);
  return Buffer.from(await response.arrayBuffer());
}

export type GraphInboxMessage = { id: string; receivedDateTime?: string };

export async function listInboxMessagesSince(since: Date) {
  const mailbox = process.env.GRAPH_MAILBOX;
  if (!mailbox) throw new Error("GRAPH_MAILBOX is not configured.");

  const query = new URLSearchParams({
    "$select": "id,receivedDateTime",
    "$filter": `receivedDateTime ge ${since.toISOString()}`,
    "$orderby": "receivedDateTime asc",
    "$top": "100",
  });
  let path: string | undefined = `/users/${encodeURIComponent(mailbox)}/mailFolders/inbox/messages?${query}`;
  const messages: GraphInboxMessage[] = [];
  const seen = new Set<string>();

  while (path) {
    const response = await graphFetch(path);
    const data = await response.json() as {
      value?: GraphInboxMessage[];
      "@odata.nextLink"?: string;
    };

    for (const message of data.value ?? []) {
      if (message.id && !seen.has(message.id)) {
        seen.add(message.id);
        messages.push(message);
      }
    }

    const nextLink = data["@odata.nextLink"];
    if (!nextLink) {
      path = undefined;
    } else if (nextLink.startsWith(GRAPH_ROOT)) {
      path = nextLink.slice(GRAPH_ROOT.length);
    } else {
      throw new Error("Microsoft Graph returned an unexpected pagination URL.");
    }
  }

  return messages;
}

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

// Uses Graph's one-step /reply (the method that has always worked here). The signature is
// appended to the comment HTML; CC goes in `message`, which /reply accepts alongside `comment`
// as long as `message.body` is not also set.
export async function sendThreadedReply(input: { messageId: string; comment: string; cc?: string[]; signatureHtml?: string | null }) {
  const mailbox = process.env.GRAPH_MAILBOX;
  if (!mailbox) throw new Error("GRAPH_MAILBOX is not configured.");
  const messageId = input.messageId.startsWith("<") ? await findGraphMessageIdByInternetMessageId(input.messageId) : input.messageId;
  const text = escapeHtml(input.comment).replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n/g, "<br>");
  const comment = `<div>${text}</div>${input.signatureHtml ? `<div style="margin-top:18px">${input.signatureHtml}</div>` : ""}`;
  const cc = (input.cc ?? []).filter(Boolean);
  await graphFetch(`/users/${encodeURIComponent(mailbox)}/messages/${encodeURIComponent(messageId)}/reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comment, ...(cc.length ? { message: { ccRecipients: cc.map((address) => ({ emailAddress: { address } })) } } : {}) }),
  });
}

async function findGraphMessageIdByInternetMessageId(internetMessageId: string) {
  const mailbox = process.env.GRAPH_MAILBOX;
  if (!mailbox) throw new Error("GRAPH_MAILBOX is not configured.");
  const filter = `internetMessageId eq '${internetMessageId.replaceAll("'", "''")}'`;
  const response = await graphFetch(`/users/${encodeURIComponent(mailbox)}/messages?$filter=${encodeURIComponent(filter)}&$select=id&$top=1`);
  const data = await response.json() as { value?: { id?: string }[] };
  const id = data.value?.[0]?.id;
  if (!id) throw new Error("Microsoft Graph could not find the original email message for this ticket.");
  return id;
}

export const checksum = (value: Buffer) => createHash("sha256").update(value).digest("hex");
