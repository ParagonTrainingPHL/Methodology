-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'COACH',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "dateOfBirth" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "goals" TEXT,
    "medicalNotes" TEXT,
    "notes" TEXT,
    "startedOn" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT,
    CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "defaultOrder" INTEGER NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "BlockAlias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "raw" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    CONSTRAINT "BlockAlias_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "Block" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "equipment" TEXT,
    "cues" TEXT,
    "notes" TEXT,
    "isBodyweight" BOOLEAN NOT NULL DEFAULT false,
    "isOpenChoice" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "primaryBlockId" TEXT,
    CONSTRAINT "Exercise_primaryBlockId_fkey" FOREIGN KEY ("primaryBlockId") REFERENCES "Block" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "dayType" TEXT NOT NULL DEFAULT 'STRENGTH',
    "description" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TemplateItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "TemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SessionTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TemplateItem_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "Block" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TemplateItem_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
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
    "bodyweight" REAL,
    "sessionRpe" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Session_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Session_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "SessionTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "SessionItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SessionItem_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "Block" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SessionItem_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PerformedSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionItemId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "load" REAL,
    "loadRaw" TEXT,
    "loadUnit" TEXT DEFAULT 'lb',
    "reps" INTEGER,
    "repsRaw" TEXT,
    "rpe" REAL,
    "notes" TEXT,
    CONSTRAINT "PerformedSet_sessionItemId_fkey" FOREIGN KEY ("sessionItemId") REFERENCES "SessionItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssessmentMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT,
    "valueType" TEXT NOT NULL DEFAULT 'NUMBER',
    "defaultOrder" INTEGER NOT NULL,
    "higherIsBetter" BOOLEAN,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "label" TEXT,
    "isInitial" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Assessment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssessmentValue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentId" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "rawValue" TEXT,
    "numericValue" REAL,
    "secondaryValue" REAL,
    "notes" TEXT,
    CONSTRAINT "AssessmentValue_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AssessmentValue_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "AssessmentMetric" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
