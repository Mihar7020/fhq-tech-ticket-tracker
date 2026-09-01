import { NextRequest, NextResponse } from "next/server";

import {
  buildMicrosoftAuthorizeUrl,
  createCodeVerifier,
  createState,
  getAppUrl,
  getMicrosoftConfig,
  microsoftOAuthCookieNames,
} from "@/lib/microsoft-sso";

export function GET(request: NextRequest) {
  const config = getMicrosoftConfig();
  const loginUrl = new URL("/login", request.url);

  if (!config.isConfigured || !config.clientId || !config.tenantId) {
    loginUrl.searchParams.set("error", "microsoft_setup_needed");
    return NextResponse.redirect(loginUrl);
  }

  const appUrl = getAppUrl(request.url);
  const state = createState();
  const verifier = createCodeVerifier();
  const response = NextResponse.redirect(
    buildMicrosoftAuthorizeUrl({
      appUrl,
      clientId: config.clientId,
      state,
      tenantId: config.tenantId,
      verifier,
    }),
  );

  response.cookies.set(microsoftOAuthCookieNames.state, state, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  response.cookies.set(microsoftOAuthCookieNames.verifier, verifier, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
