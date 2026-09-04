"use strict"

const { prisma } = require("../lib/prisma")
const heygen = require("./heygen.service")
const storage = require("./storage.service")
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

async function advanceRender(scriptId) {
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
    const result = await heygen.getVideoStatus(script.heygenVideoId)

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

    const buffer = await heygen.downloadVideo(result.videoUrl)
    const publicUrl = await storage.uploadVideo({
      scriptId: script.id,
      title: script.title,
      buffer,
    })

    logger.info(`Script ${script.id}: video ready for review`)

    return prisma.script.update({
      where: { id: script.id },
      data: {
        status: "PENDING_REVIEW",
        heygenVideoUrl: result.videoUrl,
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
