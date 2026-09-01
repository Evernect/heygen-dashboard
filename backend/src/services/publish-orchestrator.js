"use strict"

const { prisma } = require("../lib/prisma")
const heygen = require("./heygen.service")
const meta = require("./meta-graph.service")
const storage = require("./storage.service")
const { logger } = require("../utils/logger")

const BATCH_SIZE = 5


const RESUME_STALE_AFTER = "3 minutes"

// After this many attempts a script stops retrying and waits for a human
const MAX_ATTEMPTS = 5

const CAPTION_FIELD = {
  FACEBOOK: "facebookCaption",
  INSTAGRAM: "instagramCaption",
  YOUTUBE: "youtubeCaption",
  TIKTOK: "tiktokCaption",
  X: "xPostText",
}

async function claimDueScripts() {
  const rows = await prisma.$queryRaw`
    UPDATE "Script"
    SET status = 'PROCESSING'::"ScriptStatus",
        "processingStartedAt" = NOW(),
        "processingAttempts" = "processingAttempts" + 1,
        "updatedAt" = NOW()
    WHERE id IN (
      SELECT id FROM "Script"
      WHERE (
        (status = 'APPROVED'::"ScriptStatus" AND "scheduledAt" <= NOW())
        OR (
          status = 'PROCESSING'::"ScriptStatus"
          AND "processingStartedAt" < NOW() - ${RESUME_STALE_AFTER}::interval
        )
      )
      AND "processingAttempts" < ${MAX_ATTEMPTS}
      ORDER BY "scheduledAt" ASC NULLS LAST
      FOR UPDATE SKIP LOCKED
      LIMIT ${BATCH_SIZE}
    )
    RETURNING id
  `

  return rows.map((row) => row.id)
}

async function failExhaustedScripts() {
  const { count } = await prisma.script.updateMany({
    where: {
      status: "PROCESSING",
      processingAttempts: { gte: MAX_ATTEMPTS },
    },
    data: {
      status: "FAILED",
      lastError: `Gave up after ${MAX_ATTEMPTS} attempts. Fix the underlying issue and retry.`,
    },
  })

  if (count > 0) logger.warn(`Marked ${count} script(s) FAILED after retries`)
  return count
}

async function markFailed(scriptId, error) {
  const message = error instanceof Error ? error.message : String(error)

  await prisma.script.update({
    where: { id: scriptId },
    data: { status: "FAILED", lastError: message.slice(0, 1000) },
  })

  logger.error(`Script ${scriptId} failed: ${message}`)
}

// Phase 1 - submit the render
async function submitRender(script) {
  const videoId = await heygen.createVideo({
    title: script.title,
    scriptText: script.scriptText,
  })

  await prisma.script.update({
    where: { id: script.id },
    data: { heygenVideoId: videoId },
  })

  logger.info(`Script ${script.id}: render submitted (${videoId})`)
}

// Phase 2 - poll, then re-host the finished file
async function collectRender(script) {
  const result = await heygen.getVideoStatus(script.heygenVideoId)

  if (result.status === "processing") {
    logger.debug(`Script ${script.id}: still rendering`)
    return false
  }

  if (result.status === "failed") {
    throw new Error(result.error ?? "HeyGen render failed")
  }

  const buffer = await heygen.downloadVideo(result.videoUrl)
  const publicUrl = await storage.uploadVideo({
    scriptId: script.id,
    title: script.title,
    buffer,
  })

  await prisma.script.update({
    where: { id: script.id },
    data: { heygenVideoUrl: result.videoUrl, videoStorageUrl: publicUrl },
  })

  logger.info(`Script ${script.id}: video ready`)
  return true
}

// Phase 3 - publish to each target platform that doesn't already have a successful post
async function publishToPlatforms(script) {
  const existing = await prisma.platformPost.findMany({
    where: { scriptId: script.id },
  })
  const byPlatform = new Map(existing.map((post) => [post.platform, post]))

  const supported = script.targetPlatforms.filter(meta.isSupported)
  const unsupported = script.targetPlatforms.filter(
    (platform) => !meta.isSupported(platform)
  )

  for (const platform of unsupported) {
    if (byPlatform.get(platform)) continue

    await prisma.platformPost.create({
      data: {
        scriptId: script.id,
        platform,
        status: "FAILED",
        error: "Publishing to this platform is not implemented yet.",
      },
    })
  }

  let failures = 0

  for (const platform of supported) {
    if (byPlatform.get(platform)?.status === "SUCCESS") continue

    const caption = script[CAPTION_FIELD[platform]] ?? null

    try {
      const publish = meta.PUBLISHERS[platform]
      const platformPostId = await publish({
        videoUrl: script.videoStorageUrl,
        title: script.title,
        caption,
      })

      await prisma.platformPost.upsert({
        where: { scriptId_platform: { scriptId: script.id, platform } },
        create: {
          scriptId: script.id,
          platform,
          platformPostId,
          status: "SUCCESS",
          publishedAt: new Date(),
        },
        update: {
          platformPostId,
          status: "SUCCESS",
          error: null,
          publishedAt: new Date(),
        },
      })

      logger.info(`Script ${script.id}: published to ${platform}`)
    } catch (error) {
      failures += 1
      const message = error instanceof Error ? error.message : String(error)

      await prisma.platformPost.upsert({
        where: { scriptId_platform: { scriptId: script.id, platform } },
        create: {
          scriptId: script.id,
          platform,
          status: "FAILED",
          error: message.slice(0, 1000),
        },
        update: { status: "FAILED", error: message.slice(0, 1000) },
      })

      logger.error(`Script ${script.id}: ${platform} publish failed`, error)
    }
  }

  if (supported.length === 0) {
    throw new Error(
      "None of the selected platforms can be published to yet. Pick Facebook or Instagram."
    )
  }

  if (failures > 0) {
    throw new Error(`${failures} platform publish(es) failed. See publish results.`)
  }

  await prisma.script.update({
    where: { id: script.id },
    data: { status: "POSTED", lastError: null },
  })

  logger.info(`Script ${script.id}: POSTED`)
}

async function processScript(scriptId) {
  const script = await prisma.script.findUnique({ where: { id: scriptId } })
  if (!script || script.status !== "PROCESSING") return

  try {
    if (!script.heygenVideoId) {
      await submitRender(script)
      return
    }

    if (!script.videoStorageUrl) {
      const ready = await collectRender(script)
      if (!ready) return

      const refreshed = await prisma.script.findUnique({
        where: { id: scriptId },
      })
      await publishToPlatforms(refreshed)
      return
    }

    await publishToPlatforms(script)
  } catch (error) {
    await markFailed(scriptId, error)
  }
}

async function runDuePublishing() {
  await failExhaustedScripts()

  const scriptIds = await claimDueScripts()
  if (scriptIds.length === 0) return { claimed: 0 }

  logger.info(`Claimed ${scriptIds.length} script(s) for publishing`)

  for (const scriptId of scriptIds) {
    await processScript(scriptId)
  }

  return { claimed: scriptIds.length }
}

module.exports = { runDuePublishing, processScript }
