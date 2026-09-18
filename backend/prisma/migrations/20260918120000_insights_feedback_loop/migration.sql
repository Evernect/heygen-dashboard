-- CreateEnum
CREATE TYPE "PerformanceTier" AS ENUM ('TOP', 'MID', 'BOTTOM', 'TOO_NEW');

-- CreateEnum
CREATE TYPE "HookType" AS ENUM ('RHETORICAL_QUESTION', 'BLUNT_CLAIM', 'CONTRAST', 'DIRECT_ADDRESS');

-- CreateEnum
CREATE TYPE "InsightsRunKind" AS ENUM ('METRICS', 'ANALYSIS');

-- CreateEnum
CREATE TYPE "InsightsRunStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "StylePlaybookSource" AS ENUM ('MANUAL', 'GENERATED');

-- AlterTable
ALTER TABLE "Insight" ADD COLUMN     "runId" TEXT;

-- AlterTable
ALTER TABLE "CampaignProfile" ADD COLUMN     "insightsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "metricsRunHour" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "analysisWeekday" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "analysisRunHour" INTEGER NOT NULL DEFAULT 8;

-- AlterTable
ALTER TABLE "StylePlaybook" ADD COLUMN     "source" "StylePlaybookSource" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "sampleSize" INTEGER,
ADD COLUMN     "runId" TEXT;

-- CreateTable
CREATE TABLE "ScriptPerformance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3),
    "platformsPosted" "Platform"[],
    "hookType" "HookType",
    "hookFirstWords" TEXT,
    "hookWordCount" INTEGER,
    "outroLeadIn" TEXT,
    "breakCount" INTEGER,
    "avgBreakDuration" DOUBLE PRECISION,
    "sentenceVarietyScore" DOUBLE PRECISION,
    "styleTaggedAt" TIMESTAMP(3),
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "totalEngagement" INTEGER NOT NULL DEFAULT 0,
    "compositeScore" DOUBLE PRECISION,
    "performanceTier" "PerformanceTier" NOT NULL DEFAULT 'TOO_NEW',
    "lastComputedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScriptPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsightsRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "localDate" TEXT NOT NULL,
    "kind" "InsightsRunKind" NOT NULL,
    "trigger" "NewsRunTrigger" NOT NULL DEFAULT 'CRON',
    "status" "InsightsRunStatus" NOT NULL DEFAULT 'RUNNING',
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "postsPolled" INTEGER NOT NULL DEFAULT 0,
    "postsFailed" INTEGER NOT NULL DEFAULT 0,
    "metricsWritten" INTEGER NOT NULL DEFAULT 0,
    "scriptsTagged" INTEGER NOT NULL DEFAULT 0,
    "scriptsScored" INTEGER NOT NULL DEFAULT 0,
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "playbookId" TEXT,
    "warnings" TEXT[],
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsightsRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScriptPerformance_scriptId_key" ON "ScriptPerformance"("scriptId");

-- CreateIndex
CREATE INDEX "ScriptPerformance_userId_performanceTier_idx" ON "ScriptPerformance"("userId", "performanceTier");

-- CreateIndex
CREATE INDEX "ScriptPerformance_userId_postedAt_idx" ON "ScriptPerformance"("userId", "postedAt");

-- CreateIndex
CREATE INDEX "InsightsRun_userId_startedAt_idx" ON "InsightsRun"("userId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "InsightsRun_userId_localDate_kind_key" ON "InsightsRun"("userId", "localDate", "kind");

-- CreateIndex
CREATE INDEX "StylePlaybook_userId_source_isActive_idx" ON "StylePlaybook"("userId", "source", "isActive");

-- AddForeignKey
ALTER TABLE "ScriptPerformance" ADD CONSTRAINT "ScriptPerformance_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script"("id") ON DELETE CASCADE ON UPDATE CASCADE;
