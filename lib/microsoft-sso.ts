import { createHash, randomBytes } from "node:crypto";

import type { Session } from "@/lib/auth";

export const microsoftOAuthCookieNames = {
  state: "fhq_ms_state",
  verifier: "fhq_ms_verifier",
};

export type MicrosoftProfile = {
  email: string;
  id: string;
  name: string;
};

export function getMicrosoftConfig() {
  const tenantId = process.env.MICROSOFT_TENANT_ID || process.env.GRAPH_TENANT_ID;
  const clientId = process.env.MICROSOFT_CLIENT_ID || process.env.GRAPH_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || process.env.GRAPH_CLIENT_SECRET;

  return {
    tenantId,
    clientId,
    clientSecret,
    isConfigured: Boolean(tenantId && clientId && clientSecret),
  };
}

export function getAppUrl(requestUrl: string) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  return new URL(requestUrl).origin;
}

export function createCodeVerifier() {
  return randomBytes(48).toString("base64url");
}

export function createState() {
  return randomBytes(32).toString("base64url");
}

export function createCodeChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function buildMicrosoftAuthorizeUrl(options: {
  appUrl: string;
  clientId: string;
  state: string;
  tenantId: string;
  verifier: string;
}) {
  const url = new URL(`https://login.microsoftonline.com/${options.tenantId}/oauth2/v2.0/authorize`);
  url.searchParams.set("client_id", options.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", `${options.appUrl}/api/auth/microsoft/callback`);
  url.searchParams.set("response_mode", "query");
  url.searchParams.set("scope", "openid profile email User.Read");
  url.searchParams.set("state", options.state);
  url.searchParams.set("code_challenge", createCodeChallenge(options.verifier));
  url.searchParams.set("code_challenge_method", "S256");
  return url;
}

export async function exchangeMicrosoftCode(options: {
  appUrl: string;
  clientId: string;
  clientSecret: string;
  code: string;
  tenantId: string;
  verifier: string;
}) {
  const response = await fetch(`https://login.microsoftonline.com/${options.tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: options.clientId,
      client_secret: options.clientSecret,
      code: options.code,
      code_verifier: options.verifier,
      grant_type: "authorization_code",
      redirect_uri: `${options.appUrl}/api/auth/microsoft/callback`,
      scope: "openid profile email User.Read",
    }),
  });

  if (!response.ok) throw new Error(`Microsoft token exchange failed with status ${response.status}`);

  const token = (await response.json()) as { access_token?: string };
  if (!token.access_token) throw new Error("Microsoft did not return an access token.");
  return token.access_token;
}

export async function getMicrosoftProfile(accessToken: string): Promise<MicrosoftProfile> {
  const response = await fetch("https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) throw new Error(`Microsoft profile lookup failed with status ${response.status}`);

  const profile = (await response.json()) as {
    displayName?: string;
    id?: string;
    mail?: string | null;
    userPrincipalName?: string;
  };
  const email = (profile.mail || profile.userPrincipalName || "").toLowerCase();
  if (!email) throw new Error("Microsoft profile did not include an email address.");

  return {
    email,
    id: profile.id || email,
    name: profile.displayName || email.split("@")[0],
  };
}

export function isAllowedStaffEmail(email: string) {
  const normalized = email.toLowerCase();
  const allowedEmails = (process.env.AUTH_ALLOWED_EMAILS || process.env.IT_ALLOWED_EMAILS || "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (allowedEmails.length > 0) return allowedEmails.includes(normalized);
  return normalized.endsWith("@fhqtc.net");
}

export function createSessionFromMicrosoft(profile: MicrosoftProfile): Session {
  return {
    email: profile.email,
    expiresAt: Date.now() + 10 * 60 * 60 * 1000,
    name: profile.name,
    role: "ADMIN",
    userId: `microsoft:${profile.id}`,
  };
}
