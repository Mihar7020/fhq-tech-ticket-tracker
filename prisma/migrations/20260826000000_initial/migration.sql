-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TECH', 'READ_ONLY');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('NEW', 'TRIAGE', 'IN_PROGRESS', 'WAITING_ON_STAFF', 'WAITING_ON_IT', 'RESOLVED', 'CLOSED', 'MERGED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('CRITICAL', 'HIGH', 'NORMAL', 'LOW');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND', 'INTERNAL');

-- CreateEnum
CREATE TYPE "IncidentScope" AS ENUM ('LOCAL', 'DIVISION_WIDE');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PARSED', 'VALIDATED', 'APPLIED', 'ROLLED_BACK', 'FAILED');

-- CreateEnum
CREATE TYPE "RoutingOutcome" AS ENUM ('EXACT', 'DOMAIN', 'SUGGESTED', 'BODY_SIGNAL', 'CONFLICT', 'UNKNOWN', 'MANUAL');

-- CreateEnum
CREATE TYPE "DigestFeedback" AS ENUM ('UP', 'DOWN');

-- CreateEnum
CREATE TYPE "KbStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AutomationStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'TECH',
    "imageUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "teamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "address" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Regina',
    "bellSchedule" JSONB,
    "mailDomains" TEXT[],
    "primaryTechId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "roleTitle" TEXT,
    "department" TEXT,
    "room" TEXT,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "external" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "siteId" TEXT,
    "mergedIntoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonEmailAlias" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "source" TEXT,
    "personId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonEmailAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonSnapshot" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMP(3),

    CONSTRAINT "PersonSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DirectoryImport" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "status" "ImportStatus" NOT NULL,
    "mapping" JSONB NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "addedCount" INTEGER NOT NULL DEFAULT 0,
    "updatedCount" INTEGER NOT NULL DEFAULT 0,
    "inactiveCount" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),
    "rolledBackAt" TIMESTAMP(3),

    CONSTRAINT "DirectoryImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DirectoryImportSnapshot" (
    "id" TEXT NOT NULL,
    "directoryImportId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DirectoryImportSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "publicId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'NEW',
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "urgency" INTEGER NOT NULL DEFAULT 2,
    "impact" INTEGER NOT NULL DEFAULT 1,
    "category" TEXT,
    "subcategory" TEXT,
    "affectedService" TEXT,
    "affectedCount" INTEGER,
    "roomAtIntake" TEXT,
    "siteNameAtIntake" TEXT,
    "siteCodeAtIntake" TEXT,
    "personNameAtIntake" TEXT,
    "requesterEmailAtIntake" TEXT NOT NULL,
    "routingConfidence" DOUBLE PRECISION,
    "frustrationScore" DOUBLE PRECISION,
    "recurrenceFingerprint" TEXT,
    "predictedBreachAt" TIMESTAMP(3),
    "predictedBreachRisk" DOUBLE PRECISION,
    "slaPausedAt" TIMESTAMP(3),
    "waitingOn" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "teamId" TEXT,
    "siteId" TEXT,
    "personId" TEXT,
    "personSnapshotId" TEXT,
    "assigneeId" TEXT,
    "incidentId" TEXT,
    "mergedIntoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailThread" (
    "id" TEXT NOT NULL,
    "externalThreadId" TEXT,
    "normalizedSubject" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3),
    "weldedMessageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "internetMessageId" TEXT NOT NULL,
    "inReplyTo" TEXT,
    "references" TEXT[],
    "direction" "MessageDirection" NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "fromName" TEXT,
    "toAddresses" TEXT[],
    "ccAddresses" TEXT[],
    "subject" TEXT NOT NULL,
    "textBody" TEXT,
    "htmlBodySanitized" TEXT,
    "rawStorageKey" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autoSubmitted" TEXT,
    "bounce" BOOLEAN NOT NULL DEFAULT false,
    "spoofRisk" DOUBLE PRECISION,
    "threadId" TEXT,
    "ticketId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "inline" BOOLEAN NOT NULL DEFAULT false,
    "contentId" TEXT,
    "ocrText" TEXT,
    "extractedIds" JSONB,
    "quarantined" BOOLEAN NOT NULL DEFAULT false,
    "messageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Digest" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "currentRevision" INTEGER NOT NULL DEFAULT 1,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Digest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigestRevision" (
    "id" TEXT NOT NULL,
    "digestId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "problemStatement" TEXT NOT NULL,
    "asks" JSONB NOT NULL,
    "missingInfo" JSONB NOT NULL,
    "suggestedFirstAction" TEXT,
    "threadSummary" TEXT,
    "model" TEXT,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DigestRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractedField" (
    "id" TEXT NOT NULL,
    "digestRevisionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "inferred" BOOLEAN NOT NULL DEFAULT false,
    "sourceType" TEXT NOT NULL,
    "sourceMessageId" TEXT,
    "sourceQuote" TEXT,
    "sourceStart" INTEGER,
    "sourceEnd" INTEGER,
    "directoryRef" TEXT,

    CONSTRAINT "ExtractedField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DigestReview" (
    "id" TEXT NOT NULL,
    "digestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feedback" "DigestFeedback" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DigestReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutingDecision" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "outcome" "RoutingOutcome" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "rationale" JSONB NOT NULL,
    "signals" JSONB NOT NULL,
    "siteId" TEXT,
    "accepted" BOOLEAN,
    "correctedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoutingDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "rootSignature" TEXT NOT NULL,
    "scope" "IncidentScope" NOT NULL,
    "status" "IncidentStatus" NOT NULL DEFAULT 'INVESTIGATING',
    "blastRadiusEstimate" INTEGER,
    "siteId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlaPolicy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority" "Priority" NOT NULL,
    "responseMinutes" INTEGER NOT NULL,
    "resolutionMinutes" INTEGER NOT NULL,
    "pauseOnWaitingStaff" BOOLEAN NOT NULL DEFAULT true,
    "travelWeight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "businessHours" JSONB NOT NULL,
    "siteId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlaPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeArticle" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "KbStatus" NOT NULL DEFAULT 'DRAFT',
    "category" TEXT,
    "siteCodes" TEXT[],
    "fingerprint" TEXT,
    "sourceTicketId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Automation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" JSONB NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "status" "AutomationStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Automation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "ticketId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_teamId_active_idx" ON "User"("teamId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Site_name_key" ON "Site"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Site_code_key" ON "Site"("code");

-- CreateIndex
CREATE INDEX "Site_primaryTechId_idx" ON "Site"("primaryTechId");

-- CreateIndex
CREATE INDEX "Person_siteId_active_idx" ON "Person"("siteId", "active");

-- CreateIndex
CREATE INDEX "Person_normalizedName_idx" ON "Person"("normalizedName");

-- CreateIndex
CREATE INDEX "Person_mergedIntoId_idx" ON "Person"("mergedIntoId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonEmailAlias_email_key" ON "PersonEmailAlias"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PersonEmailAlias_normalized_key" ON "PersonEmailAlias"("normalized");

-- CreateIndex
CREATE INDEX "PersonEmailAlias_personId_isPrimary_idx" ON "PersonEmailAlias"("personId", "isPrimary");

-- CreateIndex
CREATE INDEX "PersonSnapshot_personId_validFrom_idx" ON "PersonSnapshot"("personId", "validFrom");

-- CreateIndex
CREATE INDEX "DirectoryImport_createdAt_idx" ON "DirectoryImport"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "DirectoryImport_uploadedById_status_idx" ON "DirectoryImport"("uploadedById", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DirectoryImportSnapshot_directoryImportId_sequence_key" ON "DirectoryImportSnapshot"("directoryImportId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_number_key" ON "Ticket"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_publicId_key" ON "Ticket"("publicId");

-- CreateIndex
CREATE INDEX "Ticket_status_predictedBreachRisk_idx" ON "Ticket"("status", "predictedBreachRisk" DESC);

-- CreateIndex
CREATE INDEX "Ticket_siteId_status_createdAt_idx" ON "Ticket"("siteId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Ticket_assigneeId_status_predictedBreachAt_idx" ON "Ticket"("assigneeId", "status", "predictedBreachAt");

-- CreateIndex
CREATE INDEX "Ticket_personId_createdAt_idx" ON "Ticket"("personId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Ticket_recurrenceFingerprint_idx" ON "Ticket"("recurrenceFingerprint");

-- CreateIndex
CREATE INDEX "Ticket_incidentId_idx" ON "Ticket"("incidentId");

-- CreateIndex
CREATE INDEX "Ticket_mergedIntoId_idx" ON "Ticket"("mergedIntoId");

-- CreateIndex
CREATE INDEX "Ticket_teamId_createdAt_idx" ON "Ticket"("teamId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "EmailThread_externalThreadId_key" ON "EmailThread"("externalThreadId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailThread_ticketId_key" ON "EmailThread"("ticketId");

-- CreateIndex
CREATE INDEX "EmailThread_normalizedSubject_lastMessageAt_idx" ON "EmailThread"("normalizedSubject", "lastMessageAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Message_internetMessageId_key" ON "Message"("internetMessageId");

-- CreateIndex
CREATE INDEX "Message_ticketId_sentAt_idx" ON "Message"("ticketId", "sentAt");

-- CreateIndex
CREATE INDEX "Message_threadId_sentAt_idx" ON "Message"("threadId", "sentAt");

-- CreateIndex
CREATE INDEX "Message_fromAddress_sentAt_idx" ON "Message"("fromAddress", "sentAt" DESC);

-- CreateIndex
CREATE INDEX "Message_inReplyTo_idx" ON "Message"("inReplyTo");

-- CreateIndex
CREATE INDEX "Attachment_checksum_idx" ON "Attachment"("checksum");

-- CreateIndex
CREATE INDEX "Attachment_messageId_idx" ON "Attachment"("messageId");

-- CreateIndex
CREATE INDEX "Digest_ticketId_updatedAt_idx" ON "Digest"("ticketId", "updatedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "DigestRevision_digestId_revision_key" ON "DigestRevision"("digestId", "revision");

-- CreateIndex
CREATE INDEX "ExtractedField_digestRevisionId_key_idx" ON "ExtractedField"("digestRevisionId", "key");

-- CreateIndex
CREATE INDEX "DigestReview_digestId_createdAt_idx" ON "DigestReview"("digestId", "createdAt");

-- CreateIndex
CREATE INDEX "DigestReview_userId_idx" ON "DigestReview"("userId");

-- CreateIndex
CREATE INDEX "RoutingDecision_ticketId_createdAt_idx" ON "RoutingDecision"("ticketId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "RoutingDecision_outcome_createdAt_idx" ON "RoutingDecision"("outcome", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "RoutingDecision_siteId_outcome_idx" ON "RoutingDecision"("siteId", "outcome");

-- CreateIndex
CREATE UNIQUE INDEX "Incident_publicId_key" ON "Incident"("publicId");

-- CreateIndex
CREATE INDEX "Incident_status_scope_startedAt_idx" ON "Incident"("status", "scope", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "Incident_rootSignature_idx" ON "Incident"("rootSignature");

-- CreateIndex
CREATE INDEX "Incident_siteId_idx" ON "Incident"("siteId");

-- CreateIndex
CREATE INDEX "SlaPolicy_siteId_priority_active_idx" ON "SlaPolicy"("siteId", "priority", "active");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeArticle_slug_key" ON "KnowledgeArticle"("slug");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_status_updatedAt_idx" ON "KnowledgeArticle"("status", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "KnowledgeArticle_fingerprint_idx" ON "KnowledgeArticle"("fingerprint");

-- CreateIndex
CREATE INDEX "Automation_status_lastRunAt_idx" ON "Automation"("status", "lastRunAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_ticketId_createdAt_idx" ON "AuditLog"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_primaryTechId_fkey" FOREIGN KEY ("primaryTechId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_mergedIntoId_fkey" FOREIGN KEY ("mergedIntoId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonEmailAlias" ADD CONSTRAINT "PersonEmailAlias_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonSnapshot" ADD CONSTRAINT "PersonSnapshot_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectoryImport" ADD CONSTRAINT "DirectoryImport_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectoryImportSnapshot" ADD CONSTRAINT "DirectoryImportSnapshot_directoryImportId_fkey" FOREIGN KEY ("directoryImportId") REFERENCES "DirectoryImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_personSnapshotId_fkey" FOREIGN KEY ("personSnapshotId") REFERENCES "PersonSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_mergedIntoId_fkey" FOREIGN KEY ("mergedIntoId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailThread" ADD CONSTRAINT "EmailThread_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "EmailThread"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Digest" ADD CONSTRAINT "Digest_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigestRevision" ADD CONSTRAINT "DigestRevision_digestId_fkey" FOREIGN KEY ("digestId") REFERENCES "Digest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractedField" ADD CONSTRAINT "ExtractedField_digestRevisionId_fkey" FOREIGN KEY ("digestRevisionId") REFERENCES "DigestRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigestReview" ADD CONSTRAINT "DigestReview_digestId_fkey" FOREIGN KEY ("digestId") REFERENCES "Digest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigestReview" ADD CONSTRAINT "DigestReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutingDecision" ADD CONSTRAINT "RoutingDecision_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutingDecision" ADD CONSTRAINT "RoutingDecision_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlaPolicy" ADD CONSTRAINT "SlaPolicy_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeArticle" ADD CONSTRAINT "KnowledgeArticle_sourceTicketId_fkey" FOREIGN KEY ("sourceTicketId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
