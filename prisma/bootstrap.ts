import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

const technicians = [
  { id: "mihar", name: "Mihar Kathiriya", email: "mihar@fhqtc.net", role: UserRole.ADMIN },
  { id: "joe", name: "Joe Gallenger", email: "joseph.gallenger@fhqtc.net", role: UserRole.TECH },
  { id: "rodello", name: "Rodello Manalastas", email: "rodello.manalastas@fhqtc.net", role: UserRole.TECH },
] as const;

const schools = [
  { id: "mec", code: "MEC", name: "Muscowpetung School", address: "Muscowpetung Saulteaux Nation", primaryTechId: "joe" },
  { id: "ppk", code: "PPK", name: "Peepeekisis School", address: "Peepeekisis Cree Nation", primaryTechId: "rodello" },
  { id: "cps", code: "CPS", name: "Chief Payepot School", address: "Chief Payepot School", primaryTechId: "joe" },
  { id: "sbec", code: "SBEC", name: "Standing Buffalo", address: "Standing Buffalo Dakota Nation", primaryTechId: "mihar" },
  { id: "ok", code: "OK", name: "Okanese School", address: "Okanese First Nation", primaryTechId: "mihar" },
  { id: "omec", code: "OMEC", name: "Ocean Man School", address: "Ocean Man First Nation", primaryTechId: "rodello" },
] as const;

async function main() {
  const team = await prisma.team.upsert({
    where: { slug: "fhq-tech" },
    update: { name: "FHQ Tech" },
    create: { id: "fhq-tech", name: "FHQ Tech", slug: "fhq-tech" },
  });

  for (const technician of technicians) {
    await prisma.user.upsert({
      where: { email: technician.email },
      update: { name: technician.name, role: technician.role, active: true, teamId: team.id },
      create: { ...technician, active: true, teamId: team.id },
    });
  }

  for (const school of schools) {
    await prisma.site.upsert({
      where: { code: school.code },
      update: { name: school.name, address: school.address, color: "#256b73", primaryTechId: school.primaryTechId },
      create: { ...school, color: "#256b73", mailDomains: [], timezone: "America/Regina" },
    });
  }
}

main()
  .finally(() => prisma.$disconnect());
