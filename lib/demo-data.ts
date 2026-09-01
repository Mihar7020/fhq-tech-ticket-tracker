import type { Person, Site, Tech, Ticket, TimelineEvent } from "@/lib/types";

export const sites: Site[] = [
  { id: "mec", code: "MEC", name: "Muscowpetung School", color: "#256b73", address: "Muscowpetung Saulteaux Nation", timezone: "America/Regina", primaryTech: "Joe Gallenger", domain: "muscowpetung.edu", bellSchedule: "8:50-3:15" },
  { id: "ppk", code: "PPK", name: "Peepeekisis School", color: "#256b73", address: "Peepeekisis Cree Nation", timezone: "America/Regina", primaryTech: "Rodello Manalastas", domain: "peepeekisis.edu", bellSchedule: "9:00-3:25" },
  { id: "cps", code: "CPS", name: "Chief Payepot School", color: "#256b73", address: "Chief Payepot School", timezone: "America/Regina", primaryTech: "Joe Gallenger", domain: "chiefpayepot.edu", bellSchedule: "8:45-3:10" },
  { id: "sbec", code: "SBEC", name: "Standing Buffalo", color: "#256b73", address: "Standing Buffalo Dakota Nation", timezone: "America/Regina", primaryTech: "Mihar Kathiriya", domain: "standingbuffalo.edu", bellSchedule: "8:55-3:20" },
  { id: "ok", code: "OK", name: "Okanese School", color: "#256b73", address: "Okanese First Nation", timezone: "America/Regina", primaryTech: "Mihar Kathiriya", domain: "okanese.edu", bellSchedule: "9:05-3:30" },
  { id: "omec", code: "OMEC", name: "Ocean Man School", color: "#256b73", address: "Ocean Man First Nation", timezone: "America/Regina", primaryTech: "Rodello Manalastas", domain: "oceanman.edu", bellSchedule: "9:00-3:20" },
];

export const techs: Tech[] = [
  { id: "mihar", name: "Mihar Kathiriya", initials: "MK", color: "#256b73", open: 8, capacity: 12, sites: ["SBEC", "OK"], status: "On site" },
  { id: "rodello", name: "Rodello Manalastas", initials: "RM", color: "#256b73", open: 6, capacity: 12, sites: ["PPK", "OMEC"], status: "Available" },
  { id: "joe", name: "Joe Gallenger", initials: "JG", color: "#256b73", open: 10, capacity: 12, sites: ["MEC", "CPS"], status: "Focused" },
];

export const people: Person[] = [
  { id: "p1", name: "Tara Whitehorse", email: "tara.whitehorse@standingbuffalo.edu", aliases: ["twhitehorse@fhqtc.net"], role: "Grade 7 Teacher", department: "Middle Years", room: "204", phone: "306-555-0184", siteId: "sbec", active: true },
  { id: "p2", name: "Leanne Bird", email: "leanne.bird@peepeekisis.edu", aliases: [], role: "Principal", department: "Administration", room: "Office", phone: "306-555-0121", siteId: "ppk", active: true },
  { id: "p3", name: "Jonas Buffalo", email: "jonas.buffalo@muscowpetung.edu", aliases: ["jbuffalo@fhqtc.net"], role: "Teacher", department: "High School", room: "112", phone: "306-555-0177", siteId: "mec", active: true },
  { id: "p4", name: "Megan Okanese", email: "megan.okanese@okanese.edu", aliases: [], role: "Learning Support", department: "Student Services", room: "14", phone: "306-555-0192", siteId: "ok", active: true },
  { id: "p5", name: "Alexis Ocean", email: "alexis.ocean@oceanman.edu", aliases: [], role: "Administrative Assistant", department: "Administration", room: "Front Office", phone: "306-555-0108", siteId: "omec", active: true },
  { id: "p6", name: "Gordon Pasqua", email: "gordon.pasqua@chiefpaskwa.edu", aliases: [], role: "Grade 5 Teacher", department: "Elementary", room: "105", phone: "306-555-0168", siteId: "cps", active: true },
];

const ticket = (partial: Partial<Ticket> & Pick<Ticket, "id" | "number" | "subject" | "siteId" | "requester" | "status" | "priority" | "doomMinutes">): Ticket => ({
  digest: partial.subject,
  requesterEmail: "staff@fhqtc.net",
  requesterRole: "Teacher",
  assignee: undefined,
  category: "Classroom technology",
  service: "End-user computing",
  createdAt: "Today, 8:42 AM",
  updatedAt: "4m ago",
  doomRisk: Math.max(8, Math.min(98, 100 - partial.doomMinutes / 4)),
  frustration: 18,
  affected: 1,
  asks: ["Restore the affected classroom service"],
  missing: ["Exact error message"],
  suggestedAction: "Confirm power and input source, then reseat the classroom adapter.",
  originalEmail: "Hi Tech team,\n\nThe classroom equipment stopped working this morning. I have a class coming in shortly and I am not sure what changed. Could someone please take a look?\n\nThank you,\nSchool staff",
  fields: [],
  routingReason: "Matched sender email to the staff directory.",
  ...partial,
});

export const tickets: Ticket[] = [
  ticket({ id: "1048", number: "FHQ-1048", subject: "Projector shows 'No signal' before period three", digest: "Classroom projector has no signal before a 10:40 class.", requester: "Tara Whitehorse", requesterEmail: "tara.whitehorse@standingbuffalo.edu", requesterRole: "Grade 7 Teacher", siteId: "sbec", room: "204", status: "New", priority: "High", assignee: undefined, category: "AV & displays", service: "Classroom projector", createdAt: "Today, 8:42 AM", updatedAt: "4m ago", doomMinutes: 38, doomRisk: 92, frustration: 46, affected: 28, asks: ["Restore the projector before period three", "Check why the teacher laptop no longer detects HDMI"], missing: ["Whether another laptop works on this cable"], suggestedAction: "Reseat the HDMI wall plate, then test input 2 - this fixed 4 of 6 matching SBEC incidents.", originalEmail: "Morning,\n\nI'm in room 204 at Standing Buffalo. The projector says NO SIGNAL again. The kids were trying it during homeroom and it worked yesterday. I unplugged the laptop and put it back but nothing. I've got my grade 7s back in here at 10:40 and the lesson is all on the slides. Also the cart by the window has two Chromebooks that won't charge - might be separate.\n\nCan someone help before then?\n\nTara Whitehorse\nGrade 7 - Room 204", fields: [
    { label: "Requester", value: "Tara Whitehorse · Grade 7", confidence: 100, source: "Directory record imported Aug 12" },
    { label: "Site", value: "Standing Buffalo", confidence: 100, source: "Exact match: tara.whitehorse@standingbuffalo.edu" },
    { label: "Location", value: "Room 204", confidence: 100, source: "Request body and directory agree" },
    { label: "Device", value: "Classroom projector", confidence: 97, source: "Request mentions projector no signal" },
    { label: "Needed by", value: "10:40 AM - Period 3", confidence: 98, source: "Request mentions 10:40 class" },
    { label: "Impact", value: "28 students", confidence: 72, source: "Grade 7 class roster estimate", inferred: true },
  ], routingReason: "Exact email match - Tara Whitehorse - Standing Buffalo (directory snapshot, Aug 12).", flags: ["Two asks detected", "Recurring issue"], recurrence: { count: 7, median: "12m", fixes: ["Reseated HDMI wall plate", "Changed projector input", "Replaced USB-C adapter"] } }),
  ticket({ id: "1047", number: "FHQ-1047", subject: "Unable to sign in to PowerSchool", requester: "Leanne Bird", siteId: "ppk", status: "Triage", priority: "Normal", assignee: "Rodello Manalastas", category: "Accounts", service: "PowerSchool", doomMinutes: 184, doomRisk: 58, updatedAt: "11m ago" }),
  ticket({ id: "1046", number: "FHQ-1046", subject: "Office printer leaves black streaks", requester: "Alexis Ocean", siteId: "omec", status: "In progress", priority: "Normal", assignee: "Rodello Manalastas", category: "Printing", service: "Office printer", doomMinutes: 310, doomRisk: 35, updatedAt: "19m ago", flags: ["On-site likely"] }),
  ticket({ id: "1045", number: "FHQ-1045", subject: "Wi-Fi unavailable in east hallway", requester: "Jonas Buffalo", siteId: "mec", status: "In progress", priority: "Critical", assignee: "Joe Gallenger", category: "Network", service: "Wireless network", doomMinutes: 22, doomRisk: 96, affected: 74, flags: ["Incident FHQ-INC-12", "Frustration rising"] }),
  ticket({ id: "1044", number: "FHQ-1044", subject: "SMART Board touch is offset", requester: "Megan Okanese", siteId: "ok", status: "Waiting on staff", priority: "Low", assignee: "Mihar Kathiriya", category: "AV & displays", service: "SMART Board", doomMinutes: 780, doomRisk: 14, updatedAt: "2h ago" }),
  ticket({ id: "1043", number: "FHQ-1043", subject: "Forwarded: students cannot open shared drive", requester: "Gordon Pasqua", siteId: "cps", status: "New", priority: "High", category: "Files & access", service: "Microsoft 365", doomMinutes: 64, doomRisk: 81, affected: 16, flags: ["Forwarded chain", "Affected person resolved"] }),
  ticket({ id: "1042", number: "FHQ-1042", subject: "Unknown sender: gym scoreboard tablet", requester: "Unknown sender", siteId: undefined, status: "Triage", priority: "Normal", category: "Other", service: "Unknown", doomMinutes: 145, doomRisk: 68, flags: ["Unrouted", "Directory attention"] }),
  ticket({ id: "1041", number: "FHQ-1041", subject: "Chromebook cart 3 has six dead devices", requester: "Tara Whitehorse", siteId: "sbec", status: "Waiting on IT", priority: "High", assignee: "Mihar Kathiriya", category: "Student devices", service: "Chromebook", doomMinutes: 95, doomRisk: 75, affected: 6, flags: ["School visit candidate"] }),
  ticket({ id: "1040", number: "FHQ-1040", subject: "Teams camera not detected for parent meeting", requester: "Megan Okanese", siteId: "ok", status: "Resolved", priority: "High", assignee: "Mihar Kathiriya", category: "Meetings", service: "Microsoft Teams", doomMinutes: 999, doomRisk: 0, updatedAt: "Yesterday" }),
];

export const timeline: TimelineEvent[] = [
  { id: "t1", kind: "email", actor: "Tara Whitehorse", title: "Request received", body: "Projector reports no signal before the 10:40 class. Two Chromebook charging issues were also mentioned.", at: "8:42 AM" },
  { id: "t2", kind: "routing", actor: "Routing engine", title: "Routed to Standing Buffalo", body: "Exact sender match with the Aug 12 directory snapshot. Body and room signals agree.", at: "8:42 AM" },
  { id: "t3", kind: "digest", actor: "FHQ Assist", title: "Digest generated · revision 2", body: "Two asks found. Projector issue classified high priority because 28 learners are affected within one bell period.", at: "8:43 AM", internal: true },
  { id: "t4", kind: "sla", actor: "Time to Doom", title: "Breach risk increased to 92%", body: "Class begins in 38 minutes; current travel estimate to Standing Buffalo is 16 minutes.", at: "9:57 AM", internal: true },
];

export const siteMetrics = sites.map((site, index) => ({
  ...site,
  open: [7, 5, 8, 4, 3, 6][index],
  atRisk: [2, 1, 3, 0, 0, 2][index],
  median: [42, 58, 71, 36, 49, 63][index],
  trend: [18, -8, 24, -12, 2, 15][index],
}));
