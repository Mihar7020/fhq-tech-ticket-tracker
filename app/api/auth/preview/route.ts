import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, sessionCookie } from "@/lib/auth";

const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);

export function GET(request: NextRequest) {
  if (!localHosts.has(request.nextUrl.hostname)) {
    return NextResponse.json({ error: "Preview access is available only on this computer." }, { status: 403 });
  }

  const token = createSessionToken({
    userId: "demo-admin",
    email: "mihar@fhqtc.net",
    name: "Mihar Kathiriya",
    role: "ADMIN",
    expiresAt: Date.now() + sessionCookie.options.maxAge * 1000,
  });
  const host = request.headers.get("host") ?? "127.0.0.1:3100";
  const response = NextResponse.redirect(new URL("/dashboard", `http://${host}`));
  response.cookies.set(sessionCookie.name, token, { ...sessionCookie.options, secure: false });
  return response;
}
