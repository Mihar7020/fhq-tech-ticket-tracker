export async function GET() { return Response.json({ ok: true, service: "fhq-tech", time: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } }); }
