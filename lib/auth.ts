import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type Session = { userId: string; email: string; name: string; role: "ADMIN" | "TECH" | "READ_ONLY"; expiresAt: number };
const COOKIE = "fhq_session";
const secret = () => process.env.AUTH_SECRET ?? (process.env.NODE_ENV === "production" ? "" : "local-development-secret-change-me");
const encode = (value: string) => Buffer.from(value).toString("base64url");
const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function createSessionToken(session: Session) {
  if (!secret()) throw new Error("AUTH_SECRET is required in production.");
  const payload = encode(JSON.stringify(session));
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token?: string): Session | null {
  if (!token || !secret()) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try { const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Session; return session.expiresAt > Date.now() ? session : null; } catch { return null; }
}

export async function getSession() { const store = await cookies(); return verifySessionToken(store.get(COOKIE)?.value); }
export async function requireSession(roles?: Session["role"][]) { const session = await getSession(); if (!session) redirect("/login"); if (roles && !roles.includes(session.role)) redirect("/forbidden"); return session; }
export const sessionCookie = { name: COOKIE, options: { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 10 } };
