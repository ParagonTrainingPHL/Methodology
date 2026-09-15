-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'COACH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "goals" TEXT,
    "medicalNotes" TEXT,
    "notes" TEXT,
    "startedOn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "defaultOrder" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockAlias" (
    "id" TEXT NOT NULL,
    "raw" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,

    CONSTRAINT "BlockAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "equipment" TEXT,
    "cues" TEXT,
    "notes" TEXT,
    "isBodyweight" BOOLEAN NOT NULL DEFAULT false,
    "isOpenChoice" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "primaryBlockId" TEXT,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dayType" TEXT NOT NULL DEFAULT 'STRENGTH',
    "description" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "blockId" TEXT NOT NULL,
    "exerciseId" TEXT,
    "groupLabel" TEXT,
    "prescribedSets" TEXT,
    "prescribedReps" TEXT,
    "prescribedLoad" TEXT,
    "tempo" TEXT,
    "cues" TEXT,
    "target" TEXT,

    CONSTRAINT "TemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "dayType" TEXT NOT NULL DEFAULT 'STRENGTH',
    "title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "templateId" TEXT,
    "bpPreSystolic" INTEGER,
    "bpPreDiastolic" INTEGER,
    "bpPostSystolic" INTEGER,
    "bpPostDiastolic" INTEGER,
    "hrResting" INTEGER,
    "hrPeak" INTEGER,
    "hrRecovery" TEXT,
    "bodyweight" DOUBLE PRECISION,
    "sessionRpe" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionItem" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "blockId" TEXT NOT NULL,
    "rawBlock" TEXT,
    "exerciseId" TEXT,
    "exerciseLabel" TEXT,
    "groupLabel" TEXT,
    "prescribedSets" TEXT,
    "prescribedReps" TEXT,
    "prescribedLoad" TEXT,
    "tempo" TEXT,
    "cues" TEXT,
    "target" TEXT,
    "performedRaw" TEXT,
    "notes" TEXT,

    CONSTRAINT "SessionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformedSet" (
    "id" TEXT NOT NULL,
    "sessionItemId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "load" DOUBLE PRECISION,
    "loadRaw" TEXT,
    "loadUnit" TEXT DEFAULT 'lb',
    "reps" INTEGER,
    "repsRaw" TEXT,
    "rpe" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "PerformedSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentMetric" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT,
    "valueType" TEXT NOT NULL DEFAULT 'NUMBER',
    "defaultOrder" INTEGER NOT NULL,
    "higherIsBetter" BOOLEAN,
    "description" TEXT,

    CONSTRAINT "AssessmentMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "label" TEXT,
    "isInitial" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentValue" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "rawValue" TEXT,
    "numericValue" DOUBLE PRECISION,
    "secondaryValue" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "AssessmentValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Client_userId_key" ON "Client"("userId");

-- CreateIndex
CREATE INDEX "Client_status_idx" ON "Client"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Block_key_key" ON "Block"("key");

-- CreateIndex
CREATE INDEX "Block_category_defaultOrder_idx" ON "Block"("category", "defaultOrder");

-- CreateIndex
CREATE UNIQUE INDEX "BlockAlias_raw_key" ON "BlockAlias"("raw");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_normalizedName_key" ON "Exercise"("normalizedName");

-- CreateIndex
CREATE INDEX "Exercise_primaryBlockId_idx" ON "Exercise"("primaryBlockId");

-- CreateIndex
CREATE INDEX "Exercise_usageCount_idx" ON "Exercise"("usageCount");

-- CreateIndex
CREATE INDEX "TemplateItem_templateId_order_idx" ON "TemplateItem"("templateId", "order");

-- CreateIndex
CREATE INDEX "Session_clientId_date_idx" ON "Session"("clientId", "date");

-- CreateIndex
CREATE INDEX "Session_date_idx" ON "Session"("date");

-- CreateIndex
CREATE INDEX "SessionItem_sessionId_order_idx" ON "SessionItem"("sessionId", "order");

-- CreateIndex
CREATE INDEX "SessionItem_exerciseId_idx" ON "SessionItem"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "PerformedSet_sessionItemId_setNumber_key" ON "PerformedSet"("sessionItemId", "setNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentMetric_key_key" ON "AssessmentMetric"("key");

-- CreateIndex
CREATE INDEX "AssessmentMetric_category_defaultOrder_idx" ON "AssessmentMetric"("category", "defaultOrder");

-- CreateIndex
CREATE INDEX "Assessment_clientId_date_idx" ON "Assessment"("clientId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentValue_assessmentId_metricId_key" ON "AssessmentValue"("assessmentId", "metricId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockAlias" ADD CONSTRAINT "BlockAlias_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "Block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_primaryBlockId_fkey" FOREIGN KEY ("primaryBlockId") REFERENCES "Block"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateItem" ADD CONSTRAINT "TemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SessionTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateItem" ADD CONSTRAINT "TemplateItem_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "Block"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateItem" ADD CONSTRAINT "TemplateItem_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SessionTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionItem" ADD CONSTRAINT "SessionItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionItem" ADD CONSTRAINT "SessionItem_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "Block"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionItem" ADD CONSTRAINT "SessionItem_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformedSet" ADD CONSTRAINT "PerformedSet_sessionItemId_fkey" FOREIGN KEY ("sessionItemId") REFERENCES "SessionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentValue" ADD CONSTRAINT "AssessmentValue_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentValue" ADD CONSTRAINT "AssessmentValue_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "AssessmentMetric"("id") ON DELETE CASCADE ON UPDATE CASCADE;
