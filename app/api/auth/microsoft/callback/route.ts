import { NextRequest, NextResponse } from "next/server";

import { createSessionToken, sessionCookie } from "@/lib/auth";
import {
  createSessionFromMicrosoft,
  exchangeMicrosoftCode,
  getAppUrl,
  getMicrosoftConfig,
  getMicrosoftProfile,
  isAllowedStaffEmail,
  microsoftOAuthCookieNames,
} from "@/lib/microsoft-sso";

export async function GET(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  const dashboardUrl = new URL("/dashboard", request.url);
  const config = getMicrosoftConfig();
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(microsoftOAuthCookieNames.state)?.value;
  const verifier = request.cookies.get(microsoftOAuthCookieNames.verifier)?.value;

  const fail = (reason: string) => {
    loginUrl.searchParams.set("error", reason);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(microsoftOAuthCookieNames.state);
    response.cookies.delete(microsoftOAuthCookieNames.verifier);
    return response;
  };

  if (!config.isConfigured || !config.clientId || !config.clientSecret || !config.tenantId) {
    return fail("microsoft_setup_needed");
  }

  if (!code || !state || !expectedState || !verifier || state !== expectedState) {
    return fail("microsoft_signin_failed");
  }

  try {
    const appUrl = getAppUrl(request.url);
    const accessToken = await exchangeMicrosoftCode({
      appUrl,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      code,
      tenantId: config.tenantId,
      verifier,
    });
    const profile = await getMicrosoftProfile(accessToken);

    if (!isAllowedStaffEmail(profile.email)) return fail("not_allowed");

    const response = NextResponse.redirect(dashboardUrl);
    response.cookies.set(sessionCookie.name, createSessionToken(createSessionFromMicrosoft(profile)), sessionCookie.options);
    response.cookies.delete(microsoftOAuthCookieNames.state);
    response.cookies.delete(microsoftOAuthCookieNames.verifier);
    return response;
  } catch {
    return fail("microsoft_signin_failed");
  }
}
