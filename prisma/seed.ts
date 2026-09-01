import { PrismaClient, Priority, TicketStatus } from "@prisma/client";

const prisma = new PrismaClient();
const siteSeeds = [
  ["Standing Buffalo School", "SB", "#DDAA22", "standingbuffalo.edu"],
  ["Peepeekisis Pesakastew School", "PVL", "#D57547", "peepeekisis.edu"],
  ["Muskowekwan School", "MUSK", "#78A88C", "muskowekwan.edu"],
  ["Okanese Learning Centre", "OLC", "#6D9FB5", "okanese.edu"],
  ["Little Star School", "LSS", "#9A87B8", "littlestar.edu"],
  ["Chief Paskwa School", "CPS", "#C56F72", "chiefpaskwa.edu"],
] as const;
const firstNames = ["Tara", "Leanne", "Jonas", "Megan", "Alexis", "Gordon", "Samantha", "Daniel", "Rena", "Calvin"];
const lastNames = ["Whitehorse", "Bird", "Buffalo", "Okanese", "Star", "Pasqua", "Keepness", "Cyr", "Desjarlais", "Kaye"];
const problems = [
  { subject: "Projector shows no signal before class", category: "AV & displays", service: "Classroom projector", body: "Morning, the projector in room 204 says NO SIGNAL again. I unplugged the laptop but it still won't work. My class is back at 10:40. Also two Chromebooks on the cart are not charging. Can someone help?", priority: Priority.HIGH },
  { subject: "Unable to sign in to PowerSchool", category: "Accounts", service: "PowerSchool", body: "I cannot sign into PowerSchool this morning. It says the account is locked. I need attendance done before first break.", priority: Priority.NORMAL },
  { subject: "Wi-Fi unavailable in east hallway", category: "Network", service: "Wireless network", body: "The internet is broken by the east hallway and a whole class of 30 students cannot connect. This started after announcements.", priority: Priority.CRITICAL },
  { subject: "Office printer leaving black streaks", category: "Printing", service: "Office printer", body: "The office printer has black streaks on every page. We tried another tray and it is the same. Could someone check it on the next site visit?", priority: Priority.NORMAL },
  { subject: "Forwarded: student cannot open shared drive", category: "Files & access", service: "Microsoft 365", body: "Forwarded message: A student says the class shared drive asks for access. Sixteen students need the worksheet today. I am forwarding from another school today.", priority: Priority.HIGH },
];

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Seed is disabled in production.");
  await prisma.$transaction([
    prisma.auditLog.deleteMany(), prisma.digestReview.deleteMany(), prisma.extractedField.deleteMany(), prisma.digestRevision.deleteMany(), prisma.digest.deleteMany(), prisma.attachment.deleteMany(), prisma.message.deleteMany(), prisma.emailThread.deleteMany(), prisma.routingDecision.deleteMany(), prisma.knowledgeArticle.deleteMany(), prisma.ticket.deleteMany(), prisma.incident.deleteMany(), prisma.personSnapshot.deleteMany(), prisma.personEmailAlias.deleteMany(), prisma.person.deleteMany(), prisma.slaPolicy.deleteMany(), prisma.site.deleteMany(), prisma.directoryImportSnapshot.deleteMany(), prisma.directoryImport.deleteMany(), prisma.user.deleteMany(), prisma.team.deleteMany(),
  ]);
  const team = await prisma.team.create({ data: { name: "FHQ Tech", slug: "fhq-tech" } });
  const users = await Promise.all([
    ["Mihar Kathiriya", "mihar@fhqtc.net", ["SB", "OLC"]],
    ["Rodello Racelis", "rodello@fhqtc.net", ["PVL", "LSS"]],
    ["Joe Daniels", "joe@fhqtc.net", ["MUSK", "CPS"]],
  ].map(async ([name, email], index) => prisma.user.create({ data: { name: name as string, email: email as string, role: index === 0 ? "ADMIN" : "TECH", teamId: team.id } })));
  const sites = await Promise.all(siteSeeds.map((seed, index) => prisma.site.create({ data: { name: seed[0], code: seed[1], color: seed[2], address: `${seed[0]} campus`, mailDomains: [seed[3]], primaryTechId: users[index % users.length].id, bellSchedule: { start: "09:00", lunch: "12:00", end: "15:20" } } })));
  const people = [];
  for (let index = 0; index < 60; index += 1) {
    const site = sites[index % sites.length]; const fullName = `${firstNames[index % firstNames.length]} ${lastNames[Math.floor(index / firstNames.length) % lastNames.length]}`; const email = `${fullName.toLowerCase().replace(/\s+/g, ".")}.${index}@${siteSeeds[index % sites.length][3]}`;
    people.push(await prisma.person.create({ data: { fullName, normalizedName: fullName.toLowerCase(), roleTitle: index % 8 === 0 ? "Principal" : `Grade ${(index % 8) + 1} Teacher`, department: index % 8 === 0 ? "Administration" : "Instruction", room: index % 8 === 0 ? "Office" : String(100 + index), phone: `306-555-${String(1000 + index)}`, siteId: site.id, metadata: { employeeId: `FHQ-${String(index + 1).padStart(4, "0")}` }, aliases: { create: [{ email, normalized: email, isPrimary: true }] } } }));
  }
  const statuses = [TicketStatus.NEW, TicketStatus.TRIAGE, TicketStatus.IN_PROGRESS, TicketStatus.WAITING_ON_STAFF, TicketStatus.WAITING_ON_IT, TicketStatus.RESOLVED, TicketStatus.CLOSED];
  for (let index = 0; index < 200; index += 1) {
    const problem = problems[index % problems.length]; const person = people[index % people.length]; const site = sites[index % sites.length]; const createdAt = new Date(Date.now() - index * 43 * 60_000); const publicId = `FHQ-${String(1000 + index)}`; const status = statuses[index % statuses.length]; const messageId = `<seed-${index}@fhqtc.example>`;
    await prisma.ticket.create({ data: { publicId, subject: problem.subject, status, priority: problem.priority, urgency: problem.priority === Priority.CRITICAL ? 4 : problem.priority === Priority.HIGH ? 3 : 2, impact: index % 5 === 0 ? 3 : 1, category: problem.category, affectedService: problem.service, affectedCount: index % 5 === 0 ? 30 : 1, roomAtIntake: person.room, siteNameAtIntake: site.name, siteCodeAtIntake: site.code, personNameAtIntake: person.fullName, requesterEmailAtIntake: `${person.fullName.toLowerCase().replace(/\s+/g, ".")}.${index % 60}@${siteSeeds[index % sites.length][3]}`, routingConfidence: index % 17 === 0 ? .45 : 1, frustrationScore: (index * 13) % 100, recurrenceFingerprint: `${site.code}:${problem.service.toLowerCase().replace(/\s+/g, "-")}`, predictedBreachRisk: ((index * 17) % 98) / 100, predictedBreachAt: new Date(createdAt.getTime() + (45 + (index % 8) * 30) * 60_000), teamId: team.id, siteId: index % 17 === 0 ? undefined : site.id, personId: index % 17 === 0 ? undefined : person.id, assigneeId: index % 4 === 0 ? undefined : users[index % users.length].id, createdAt, resolvedAt: status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED ? new Date(createdAt.getTime() + 52 * 60_000) : undefined, thread: { create: { normalizedSubject: problem.subject.toLowerCase(), lastMessageAt: createdAt, messages: { create: { internetMessageId: messageId, direction: "INBOUND", fromAddress: `${person.fullName.toLowerCase().replace(/\s+/g, ".")}@${siteSeeds[index % sites.length][3]}`, fromName: person.fullName, toAddresses: ["fhqtctech@example.org"], ccAddresses: [], subject: problem.subject, textBody: problem.body, sentAt: createdAt, ticket: { connect: { publicId } } } } } }, routingDecisions: { create: { outcome: index % 17 === 0 ? "UNKNOWN" : "EXACT", confidence: index % 17 === 0 ? 0 : 1, rationale: { text: index % 17 === 0 ? "No sender match" : "Exact directory email match" }, signals: { sender: "directory" }, siteId: index % 17 === 0 ? undefined : site.id } }, digests: { create: { revisions: { create: { revision: 1, problemStatement: problem.subject.split(" ").slice(0, 15).join(" "), asks: ["Restore service"], missingInfo: index % 3 === 0 ? ["Exact error message"] : [], suggestedFirstAction: "Check the last matching resolution before travelling.", confidence: .86 } } } }, auditEvents: { create: { entityType: "Ticket", entityId: publicId, action: "SEEDED_EMAIL_INGESTED", after: { messageId } } } } });
  }
  await prisma.incident.create({ data: { publicId: "FHQ-INC-12", title: "Wireless authentication instability", summary: "Cross-site 802.1X failures", rootSignature: "wifi-eap-tls-0x800B0109", scope: "DIVISION_WIDE", status: "INVESTIGATING", blastRadiusEstimate: 186, startedAt: new Date() } });
  await prisma.automation.create({ data: { name: "Waiting-on-staff nudge", description: "Escalating-politeness reminder ladder", trigger: { state: "WAITING_ON_STAFF", afterHours: 24 }, conditions: { requesterReplied: false }, actions: [{ type: "draftReply", tone: "human" }, { type: "warnBeforeClose", afterHours: 72 }] } });
  console.log(`Seeded ${sites.length} sites, ${people.length} people, and 200 tickets.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
