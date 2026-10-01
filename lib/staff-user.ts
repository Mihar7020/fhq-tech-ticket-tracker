import { db } from "@/lib/db";
import type { Session } from "@/lib/auth";

/**
 * Finds the database User row for the signed-in tech (case-insensitive email match),
 * creating it on first use. Sign-in itself never depends on this: it is only used by
 * features that need to store something against a person (signatures, uploaded documents).
 */
export async function getOrCreateStaffUser(session: Pick<Session, "email" | "name">) {
  const email = session.email.trim().toLowerCase();
  const existing = await db.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  if (existing) return existing;
  const team = await db.team.findFirst({ select: { id: true } });
  return db.user.create({ data: { email, name: session.name || email, role: "ADMIN", active: true, teamId: team?.id } });
}
