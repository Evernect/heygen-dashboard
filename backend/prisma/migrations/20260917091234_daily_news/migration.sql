-- CreateEnum
CREATE TYPE "TopicSource" AS ENUM ('MANUAL', 'DAILY_NEWS');

-- CreateEnum
CREATE TYPE "NewsRunTrigger" AS ENUM ('CRON', 'MANUAL');

-- CreateEnum
CREATE TYPE "NewsRunStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "DailyNewsStatus" AS ENUM ('NEW', 'GENERATING', 'GENERATED', 'ERROR', 'DISMISSED');

-- AlterTable
ALTER TABLE "Topic" ADD COLUMN     "source" "TopicSource" NOT NULL DEFAULT 'MANUAL';

-- CreateTable
CREATE TABLE "NewsKeyword" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "keywordId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'issue',
    "topicLabel" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "terms" TEXT[],
    "places" TEXT[],
    "scope" TEXT NOT NULL DEFAULT 'state',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignProfile" (
    "userId" TEXT NOT NULL,
    "candidateName" TEXT NOT NULL,
    "party" TEXT,
    "office" TEXT,
    "district" TEXT,
    "districtDescription" TEXT,
    "districtTerms" TEXT[],
    "state" TEXT,
    "electionDate" TIMESTAMP(3),
    "personaSummary" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Los_Angeles',
    "newsRunHour" INTEGER NOT NULL DEFAULT 7,
    "topicsPerRun" INTEGER NOT NULL DEFAULT 3,
    "newsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "CandidatePosition" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "stance" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidatePosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StylePlaybook" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT,
    "guidance" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StylePlaybook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsClusterHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "clusterId" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "topicLabels" TEXT,
    "tokens" TEXT[],
    "articleCount" INTEGER NOT NULL DEFAULT 0,
    "outletCount" INTEGER NOT NULL DEFAULT 0,
    "score" INTEGER NOT NULL DEFAULT 0,
    "isDistrict" BOOLEAN NOT NULL DEFAULT false,
    "isNamed" BOOLEAN NOT NULL DEFAULT false,
    "topUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsClusterHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "localDate" TEXT NOT NULL,
    "trigger" "NewsRunTrigger" NOT NULL DEFAULT 'CRON',
    "status" "NewsRunStatus" NOT NULL DEFAULT 'RUNNING',
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "keywordsUsed" INTEGER NOT NULL DEFAULT 0,
    "feedsFetched" INTEGER NOT NULL DEFAULT 0,
    "feedsFailed" INTEGER NOT NULL DEFAULT 0,
    "articlesFound" INTEGER NOT NULL DEFAULT 0,
    "articlesKept" INTEGER NOT NULL DEFAULT 0,
    "clustersScored" INTEGER NOT NULL DEFAULT 0,
    "articleTextsFetched" INTEGER NOT NULL DEFAULT 0,
    "itemsCreated" INTEGER NOT NULL DEFAULT 0,
    "warnings" TEXT[],
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyNewsItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "runId" TEXT,
    "issueCode" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "angle" TEXT NOT NULL,
    "whyNow" TEXT NOT NULL,
    "importance" TEXT NOT NULL DEFAULT 'Medium',
    "importanceScore" INTEGER NOT NULL DEFAULT 0,
    "sourceSummary" TEXT NOT NULL,
    "headlinesOnly" BOOLEAN NOT NULL DEFAULT false,
    "conflictFlag" TEXT,
    "clusterId" TEXT,
    "unmatched" BOOLEAN NOT NULL DEFAULT false,
    "headline" TEXT,
    "outlet" TEXT,
    "sourceUrls" TEXT[],
    "outletCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "localDate" TEXT NOT NULL,
    "localTime" TEXT,
    "status" "DailyNewsStatus" NOT NULL DEFAULT 'NEW',
    "generateRequestedAt" TIMESTAMP(3),
    "generateError" TEXT,
    "topicId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyNewsItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewsKeyword_userId_active_idx" ON "NewsKeyword"("userId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "NewsKeyword_userId_keywordId_key" ON "NewsKeyword"("userId", "keywordId");

-- CreateIndex
CREATE INDEX "CandidatePosition_userId_active_idx" ON "CandidatePosition"("userId", "active");

-- CreateIndex
CREATE INDEX "StylePlaybook_userId_createdAt_idx" ON "StylePlaybook"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "NewsClusterHistory_userId_createdAt_idx" ON "NewsClusterHistory"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "NewsClusterHistory_runId_idx" ON "NewsClusterHistory"("runId");

-- CreateIndex
CREATE INDEX "NewsRun_userId_startedAt_idx" ON "NewsRun"("userId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewsRun_userId_localDate_key" ON "NewsRun"("userId", "localDate");

-- CreateIndex
CREATE UNIQUE INDEX "DailyNewsItem_topicId_key" ON "DailyNewsItem"("topicId");

-- CreateIndex
CREATE INDEX "DailyNewsItem_userId_status_idx" ON "DailyNewsItem"("userId", "status");

-- CreateIndex
CREATE INDEX "DailyNewsItem_userId_createdAt_idx" ON "DailyNewsItem"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "DailyNewsItem_runId_idx" ON "DailyNewsItem"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyNewsItem_userId_issueCode_key" ON "DailyNewsItem"("userId", "issueCode");

-- CreateIndex
CREATE INDEX "Topic_userId_source_createdAt_idx" ON "Topic"("userId", "source", "createdAt");

-- AddForeignKey
ALTER TABLE "DailyNewsItem" ADD CONSTRAINT "DailyNewsItem_runId_fkey" FOREIGN KEY ("runId") REFERENCES "NewsRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyNewsItem" ADD CONSTRAINT "DailyNewsItem_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
