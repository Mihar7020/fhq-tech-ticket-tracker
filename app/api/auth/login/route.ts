import { z } from "zod";
import { createSessionToken, sessionCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.email().max(254), password: z.string().min(8).max(128) });
export async function POST(request: Request) {
  const limiter = rateLimit(`login:${request.headers.get("x-forwarded-for") ?? "local"}`, 8, 15 * 60_000);
  if (!limiter.allowed) return Response.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter a valid work email and password." }, { status: 400 });
  const allowedDemo = (process.env.NODE_ENV !== "production" || process.env.ALLOW_DEMO_AUTH === "true") && parsed.data.password === "fhqtechdemo";
  if (!allowedDemo) return Response.json({ error: "Microsoft identity is required in production." }, { status: 401 });
  const name = parsed.data.email.split("@")[0].split(/[._-]/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  const token = createSessionToken({ userId: "demo-admin", email: parsed.data.email.toLowerCase(), name, role: "ADMIN", expiresAt: Date.now() + 10 * 60 * 60 * 1000 });
  return Response.json({ ok: true }, { headers: { "Set-Cookie": `${sessionCookie.name}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionCookie.options.maxAge}${sessionCookie.options.secure ? "; Secure" : ""}` } });
}
