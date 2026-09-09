import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const fieldSchema = z.enum(["name", "email", "site", "role", "department", "room", "phone", "active", "metadata", "ignore"]);
const importSchema = z.object({
  rows: z.array(z.record(z.string(), z.unknown())).min(1).max(5000),
  mapping: z.record(z.string(), fieldSchema),
});

const schoolAliases = [
  { tokens: ["mec", "muscowpetung", "muscowpetungschool"], aliases: ["mec", "muscowpetung", "muscowpetungschool"] },
  { tokens: ["ppk", "pvl", "peepeekisis", "peepeekisisschool", "peepeekisispesakastew", "peepeekisispesakastewschool"], aliases: ["ppk", "pvl", "peepeekisis", "peepeekisisschool"] },
  { tokens: ["cps", "chiefpayepot", "chiefpayepotschool", "chiefpaskwa", "chiefpaskwaschool"], aliases: ["cps", "chiefpayepot", "chiefpayepotschool"] },
  { tokens: ["sb", "sbec", "standingbuffalo", "standingbuffaloschool"], aliases: ["sb", "sbec", "standingbuffalo"] },
  { tokens: ["olc", "ok", "okanese", "okaneselearningcenter", "okaneselearningcentre"], aliases: ["olc", "ok", "okanese", "okaneselearningcenter", "okaneselearningcentre"] },
  { tokens: ["omec", "ocenaman", "ocenamanschool", "oceanman", "oceanmanschool"], aliases: ["omec", "ocenaman", "ocenamanschool", "oceanman", "oceanmanschool"] },
];

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeLabel(value: string) {
  return normalizeName(value).replace(/[^a-z0-9]/g, "");
}

function activeValue(value: string) {
  return !["false", "no", "inactive", "0", "disabled"].includes(value.trim().toLowerCase());
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role === "READ_ONLY") return Response.json({ error: "forbidden" }, { status: 403 });
  const parsed = importSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_request", issues: parsed.error.issues.map((issue) => issue.message) }, { status: 400 });
  const rows = parsed.data.rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, String(value ?? "").trim()])));

  const headerFor = (field: z.infer<typeof fieldSchema>) => Object.entries(parsed.data.mapping).find(([, mapped]) => mapped === field)?.[0];
  const valueFor = (row: Record<string, string>, field: z.infer<typeof fieldSchema>) => {
    const header = headerFor(field);
    return header ? row[header]?.trim() ?? "" : "";
  };
  const sites = await db.site.findMany({ select: { id: true, code: true, name: true } });
  const siteByLabel = new Map<string, string>();
  for (const site of sites) {
    for (const value of [site.id, site.code, site.name]) {
      siteByLabel.set(normalizeLabel(value), site.id);
    }
    const siteLabels = [site.id, site.code, site.name].map(normalizeLabel);
    const aliasGroup = schoolAliases.find((group) => group.tokens.some((token) => siteLabels.includes(token)));
    for (const alias of aliasGroup?.aliases ?? []) {
      siteByLabel.set(alias, site.id);
    }
  }
  const prepared = rows.map((row) => {
    const fullName = valueFor(row, "name").replace(/\s+/g, " ");
    const email = valueFor(row, "email").toLowerCase();
    const siteLabel = valueFor(row, "site");
    const siteId = siteByLabel.get(normalizeLabel(siteLabel));
    const metadata = Object.fromEntries(Object.entries(parsed.data.mapping).filter(([, mapped]) => mapped === "metadata").map(([header]) => [header, row[header] ?? ""]));
    return { row, fullName, email, siteLabel, siteId, metadata };
  });
  if (prepared.some((item) => !item.fullName || !/^\S+@\S+\.\S+$/.test(item.email))) return Response.json({ error: "invalid_row" }, { status: 400 });
  const unknownSites = [...new Set(prepared.filter((item) => !item.siteId).map((item) => item.siteLabel).filter(Boolean))];
  if (unknownSites.length) return Response.json({ error: "unknown_site", unknownSites }, { status: 400 });

  try {
    const result = await db.$transaction(async (tx) => {
      let added = 0;
      let updated = 0;
      for (const item of prepared) {
        const alias = await tx.personEmailAlias.findUnique({ where: { normalized: item.email }, select: { personId: true } });
        const personData = {
          fullName: item.fullName,
          normalizedName: normalizeName(item.fullName),
          roleTitle: valueFor(item.row, "role") || null,
          department: valueFor(item.row, "department") || null,
          room: valueFor(item.row, "room") || null,
          phone: valueFor(item.row, "phone") || null,
          active: activeValue(valueFor(item.row, "active")),
          siteId: item.siteId!,
          metadata: Object.keys(item.metadata).length ? item.metadata : undefined,
        };
        if (alias) {
          await tx.person.update({ where: { id: alias.personId }, data: personData });
          updated += 1;
        } else {
          await tx.person.create({ data: { ...personData, aliases: { create: { email: item.email, normalized: item.email, isPrimary: true, source: "directory_import" } } } });
          added += 1;
        }
      }
      return { added, updated };
    });

    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("[directory-import] failed", error);
    return Response.json({ error: "import_failed" }, { status: 500 });
  }
}
