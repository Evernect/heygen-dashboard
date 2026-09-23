"use strict"

const { prisma } = require("../lib/prisma")
const heygen = require("./heygen.service")
const storage = require("./storage.service")
const { burnCaptions } = require("./captions/caption-burner.service")
const { selectHighlights } = require("./captions/highlight-colour.service")
const { conflict } = require("../utils/errors")
const { logger } = require("../utils/logger")

const RENDER_TIMEOUT_MS = 30 * 60 * 1000

const OCCUPYING_STATUSES = [
  "RENDERING",
  "PENDING_REVIEW",
  "APPROVED",
  "PROCESSING",
]

const RENDERABLE_STATUSES = ["DRAFT", "FAILED", "REJECTED"]

const inFlight = new Map()

async function markRenderFailed(scriptId, error) {
  const message = error instanceof Error ? error.message : String(error)

  await prisma.script.update({
    where: { id: scriptId },
    data: { status: "FAILED", lastError: message.slice(0, 1000) },
  })

  logger.error(`Script ${scriptId} render failed: ${message}`)
}

async function startRender(scriptId) {
  const script = await prisma.script.findUnique({ where: { id: scriptId } })
  if (!script) return null

  if (!RENDERABLE_STATUSES.includes(script.status)) {
    throw conflict(
      `A ${script.status} script cannot be rendered. Only unpicked options and failed or disapproved scripts can.`
    )
  }

  const busySibling = await prisma.script.findFirst({
    where: {
      topicId: script.topicId,
      id: { not: script.id },
      status: { in: OCCUPYING_STATUSES },
    },
  })

  if (busySibling) {
    throw conflict(
      `Another script for this topic is already ${busySibling.status.toLowerCase()}. Disapprove it before rendering a different option.`
    )
  }

  await prisma.script.update({
    where: { id: script.id },
    data: {
      status: "RENDERING",
      selectedAt: script.selectedAt ?? new Date(),
      renderStartedAt: new Date(),
      heygenVideoId: null,
      heygenVideoUrl: null,
      heygenSubtitleUrl: null,
      captionHighlights: null,
      videoStorageUrl: null,
      lastError: null,
      rejectedAt: null,
      rejectionReason: null,
    },
  })

  try {
    const videoId = await heygen.createVideo({
      title: script.title,
      scriptText: script.scriptText,
      userId: script.userId,
    })

    logger.info(`Script ${script.id}: render submitted (${videoId})`)

    return prisma.script.update({
      where: { id: script.id },
      data: { heygenVideoId: videoId },
    })
  } catch (error) {
    await markRenderFailed(script.id, error)
    throw error
  }
}

async function storeStyledVideo(script, result) {
  const buffer = await heygen.downloadVideo(result.videoUrl)

  if (!result.subtitleUrl) {
    throw new Error(
      "HeyGen returned the video without a caption file, so captions cannot be " +
        "burned. Retry the render."
    )
  }

  const srtText = await heygen.downloadSubtitles(result.subtitleUrl)
  const highlights = await selectHighlights({
    userId: script.userId,
    scriptText: script.scriptText,
  })

  const burned = await burnCaptions({
    videoBuffer: buffer,
    srtText,
    highlights,
  })

  return { buffer: burned, highlights }
}

async function advanceRender(scriptId) {
  const existing = inFlight.get(scriptId)
  if (existing) return existing

  const run = advanceRenderOnce(scriptId).finally(() => inFlight.delete(scriptId))
  inFlight.set(scriptId, run)
  return run
}

async function advanceRenderOnce(scriptId) {
  const script = await prisma.script.findUnique({ where: { id: scriptId } })
  if (!script || script.status !== "RENDERING") return script

  if (!script.heygenVideoId) {
    await markRenderFailed(
      script.id,
      new Error("Render was never submitted to HeyGen. Try generating again.")
    )
    return prisma.script.findUnique({ where: { id: scriptId } })
  }

  try {
    const result = await heygen.getVideoStatus(script.heygenVideoId, {
      userId: script.userId,
    })

    if (result.status === "processing") {
      const startedAt = script.renderStartedAt?.getTime() ?? 0
      if (Date.now() - startedAt > RENDER_TIMEOUT_MS) {
        throw new Error(
          "HeyGen has not returned a video after 30 minutes. Try generating it again."
        )
      }
      return script
    }

    if (result.status === "failed") {
      throw new Error(result.error ?? "HeyGen render failed")
    }

    const { buffer, highlights } = await storeStyledVideo(script, result)

    const publicUrl = await storage.uploadVideo({
      scriptId: script.id,
      title: script.title,
      buffer,
    })

    logger.info(`Script ${script.id}: styled video ready for review`)

    return prisma.script.update({
      where: { id: script.id },
      data: {
        status: "PENDING_REVIEW",
        heygenVideoUrl: result.videoUrl,
        heygenSubtitleUrl: result.subtitleUrl ?? null,
        captionHighlights: highlights,
        videoStorageUrl: publicUrl,
        lastError: null,
      },
    })
  } catch (error) {
    await markRenderFailed(script.id, error)
    return prisma.script.findUnique({ where: { id: scriptId } })
  }
}

async function runInFlightRenders() {
  const scripts = await prisma.script.findMany({
    where: { status: "RENDERING" },
    select: { id: true },
    orderBy: { renderStartedAt: "asc" },
    take: 10,
  })

  for (const { id } of scripts) {
    await advanceRender(id)
  }

  return { polled: scripts.length }
}

module.exports = { startRender, advanceRender, runInFlightRenders }
