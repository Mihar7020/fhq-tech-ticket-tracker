ALTER TABLE "User" ADD COLUMN "signatureHtml" TEXT;

CREATE TABLE "SignatureAsset" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SignatureAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KnowledgeDocument" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "articleId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KnowledgeDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SignatureAsset_userId_createdAt_idx" ON "SignatureAsset"("userId", "createdAt" DESC);
CREATE INDEX "KnowledgeDocument_articleId_createdAt_idx" ON "KnowledgeDocument"("articleId", "createdAt" DESC);
CREATE INDEX "KnowledgeDocument_uploadedById_createdAt_idx" ON "KnowledgeDocument"("uploadedById", "createdAt" DESC);

ALTER TABLE "SignatureAsset" ADD CONSTRAINT "SignatureAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "KnowledgeArticle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
