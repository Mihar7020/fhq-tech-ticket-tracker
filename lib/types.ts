export type TicketStatus = "New" | "Triage" | "In progress" | "Waiting on requester" | "Waiting on IT" | "Resolved" | "Voided";
export type Priority = "Critical" | "High" | "Normal" | "Low";
export type Site = {
  id: string;
  code: string;
  name: string;
  color: string;
  address: string;
  timezone: string;
  primaryTech: string;
  domain?: string;
  bellSchedule?: string;
};
export type Person = {
  id: string;
  name: string;
  email: string;
  aliases: string[];
  role: string;
  department: string;
  room: string;
  phone: string;
  siteId?: string;
  active: boolean;
  metadata?: Record<string, string>;
};
export type Tech = {
  id: string;
  name: string;
  initials: string;
  color: string;
  open: number;
  capacity: number;
  sites: string[];
  status: "Available" | "On site" | "Focused";
};
export type ExtractedField = {
  label: string;
  value: string;
  confidence: number;
  source: string;
  inferred?: boolean;
};
export type AttachmentInfo = { id: string; filename: string; contentType: string; sizeBytes: number; contentId?: string };

export type Ticket = {
  id: string;
  number: string;
  subject: string;
  digest: string;
  requester: string;
  requesterEmail: string;
  requesterTo: string[];
  requesterCc: string[];
  requesterRole: string;
  siteId?: string;
  room?: string;
  status: TicketStatus;
  priority: Priority;
  assignee?: string;
  category: string;
  service: string;
  createdAt: string;
  updatedAt: string;
  doomMinutes: number;
  doomRisk: number;
  frustration: number;
  affected: number;
  asks: string[];
  missing: string[];
  suggestedAction: string;
  originalEmail: string;
  originalAttachments: AttachmentInfo[];
  fields: ExtractedField[];
  routingReason: string;
  flags?: string[];
  mergedIntoNumber?: string;
  recurrence?: { count: number; median: string; fixes: string[] };
  /** Set while a requester reply has reopened the ticket and nobody has answered yet. */
  reopenedBy?: { name: string; at: string; replyId?: string };
  /** The requester replied after the team's last public reply. */
  awaitingReply?: boolean;
  /** The assigned school as stored in the database, for display. */
  siteCode?: string;
  siteName?: string;
};
export type TimelineEvent = {
  id: string;
  kind: "email" | "note" | "status" | "routing" | "digest" | "sla";
  actor: string;
  title: string;
  body: string;
  at: string;
  internal?: boolean;
  attachments?: AttachmentInfo[];
  /** ISO timestamp, used for ordering and day grouping. */
  sentAt?: string;
  role?: "requester" | "team" | "note" | "system";
};
