-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."Platform" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'X');

-- CreateEnum
CREATE TYPE "public"."PlatformPostStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."ScriptStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'PROCESSING', 'POSTED', 'FAILED', 'REJECTED', 'DRAFT', 'RENDERING');

-- CreateEnum
CREATE TYPE "public"."TopicStatus" AS ENUM ('IDLE', 'GENERATING', 'GENERATED', 'ERROR');

-- CreateTable
CREATE TABLE "public"."AppSettings" (
    "heygenAvatarLookId" TEXT,
    "heygenAvatarEngine" TEXT NOT NULL DEFAULT 'avatar_iv',
    "heygenVoiceSpeed" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "heygenVoiceLocale" TEXT NOT NULL DEFAULT 'en-US',
    "openaiModel" TEXT NOT NULL DEFAULT 'gpt-5.4-mini',
    "openaiReasoningEffort" TEXT,
    "openaiSendTemperature" BOOLEAN NOT NULL DEFAULT false,
    "openaiTemperature" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "targetWordsMin" INTEGER NOT NULL DEFAULT 75,
    "targetWordsMax" INTEGER NOT NULL DEFAULT 90,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "heygenAvatarGroupId" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "public"."HeygenConnection" (
    "userId" TEXT NOT NULL,
    "apiKeyCipher" TEXT NOT NULL,
    "apiKeyHint" TEXT NOT NULL,
    "accountEmail" TEXT,
    "accountUsername" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeygenConnection_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "public"."Insight" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "finding" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PlatformPost" (
    "id" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "platform" "public"."Platform" NOT NULL,
    "platformPostId" TEXT,
    "status" "public"."PlatformPostStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Script" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scriptText" TEXT NOT NULL,
    "facebookCaption" TEXT,
    "instagramCaption" TEXT,
    "youtubeCaption" TEXT,
    "tiktokCaption" TEXT,
    "xPostText" TEXT,
    "hashtags" TEXT[],
    "targetPlatforms" "public"."Platform"[],
    "status" "public"."ScriptStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "approvedBy" TEXT,
    "processingStartedAt" TIMESTAMP(3),
    "processingAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "heygenVideoId" TEXT,
    "heygenVideoUrl" TEXT,
    "videoStorageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "renderStartedAt" TIMESTAMP(3),
    "selectedAt" TIMESTAMP(3),
    "variantIndex" INTEGER NOT NULL DEFAULT 0,
    "variantLabel" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Script_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Topic" (
    "id" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "angle" TEXT NOT NULL,
    "status" "public"."TopicStatus" NOT NULL DEFAULT 'IDLE',
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "generateRequestedAt" TIMESTAMP(3),
    "generateError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VideoMetric" (
    "id" TEXT NOT NULL,
    "platformPostId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Insight_userId_createdAt_idx" ON "public"."Insight"("userId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformPost_scriptId_platform_key" ON "public"."PlatformPost"("scriptId" ASC, "platform" ASC);

-- CreateIndex
CREATE INDEX "PlatformPost_status_idx" ON "public"."PlatformPost"("status" ASC);

-- CreateIndex
CREATE INDEX "Script_status_scheduledAt_idx" ON "public"."Script"("status" ASC, "scheduledAt" ASC);

-- CreateIndex
CREATE INDEX "Script_topicId_idx" ON "public"."Script"("topicId" ASC);

-- CreateIndex
CREATE INDEX "Script_topicId_variantIndex_idx" ON "public"."Script"("topicId" ASC, "variantIndex" ASC);

-- CreateIndex
CREATE INDEX "Script_userId_status_idx" ON "public"."Script"("userId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "Topic_userId_createdAt_idx" ON "public"."Topic"("userId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "Topic_userId_status_idx" ON "public"."Topic"("userId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "VideoMetric_platformPostId_fetchedAt_idx" ON "public"."VideoMetric"("platformPostId" ASC, "fetchedAt" ASC);

-- AddForeignKey
ALTER TABLE "public"."PlatformPost" ADD CONSTRAINT "PlatformPost_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "public"."Script"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Script" ADD CONSTRAINT "Script_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "public"."Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VideoMetric" ADD CONSTRAINT "VideoMetric_platformPostId_fkey" FOREIGN KEY ("platformPostId") REFERENCES "public"."PlatformPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

