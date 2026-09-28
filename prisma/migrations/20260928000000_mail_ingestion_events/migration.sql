CREATE TABLE "MailIngestionEvent" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "graphMessageId" TEXT,
    "internetMessageId" TEXT,
    "outcome" TEXT NOT NULL,
    "reason" TEXT,
    "error" TEXT,
    "ticketId" TEXT,
    "publicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MailIngestionEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MailIngestionEvent_createdAt_idx" ON "MailIngestionEvent"("createdAt" DESC);
CREATE INDEX "MailIngestionEvent_graphMessageId_idx" ON "MailIngestionEvent"("graphMessageId");
CREATE INDEX "MailIngestionEvent_outcome_createdAt_idx" ON "MailIngestionEvent"("outcome", "createdAt" DESC);
