import { sessionCookie } from "@/lib/auth";
export async function POST() { return Response.json({ ok: true }, { headers: { "Set-Cookie": `${sessionCookie.name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` } }); }
