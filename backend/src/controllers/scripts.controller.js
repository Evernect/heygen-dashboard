"use strict"

const { z } = require("zod")

const { prisma } = require("../lib/prisma")
const render = require("../services/video-render.service")
const { badRequest, conflict, notFound } = require("../utils/errors")
const { logger } = require("../utils/logger")

const SCRIPT_STATUSES = [
  "DRAFT",
  "RENDERING",
  "PENDING_REVIEW",
  "APPROVED",
  "PROCESSING",
  "POSTED",
  "FAILED",
  "REJECTED",
]
const PLATFORMS = ["FACEBOOK", "INSTAGRAM", "YOUTUBE", "TIKTOK", "X"]

const listScriptsQuerySchema = z.object({
  status: z.enum(SCRIPT_STATUSES).optional(),
  topicId: z.string().trim().min(1).optional(),
  // Also return the other options of every topic that matched, so the UI can
  // show which one was already picked next to the ones still on the table.
  includeSiblings: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
})

const updateScriptSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    scriptText: z.string().trim().min(1).optional(),
    facebookCaption: z.string().nullable().optional(),
    instagramCaption: z.string().nullable().optional(),
    youtubeCaption: z.string().nullable().optional(),
    tiktokCaption: z.string().nullable().optional(),
    xPostText: z.string().nullable().optional(),
    hashtags: z.array(z.string()).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  })

const approveScriptSchema = z.object({
  scheduledAt: z.coerce.date(),
  targetPlatforms: z
    .array(z.enum(PLATFORMS))
    .min(1, "Select at least one platform"),
})

const rejectScriptSchema = z.object({
  reason: z.string().trim().min(1, "A reason is required").max(500),
})

const includeRelations = {
  topic: { select: { id: true, issue: true, angle: true } },
  posts: true,
}

async function listScripts(req, res) {
  const { status, topicId, includeSiblings } = req.validatedQuery ?? {}

  const orderBy = [
    { scheduledAt: "asc" },
    { createdAt: "desc" },
    { variantIndex: "asc" },
  ]

  const scripts = await prisma.script.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(topicId ? { topicId } : {}),
    },
    include: includeRelations,
    orderBy,
  })

  if (!includeSiblings || !status || scripts.length === 0) {
    return res.json(scripts)
  }

  const topicIds = [...new Set(scripts.map((script) => script.topicId))]

  const withSiblings = await prisma.script.findMany({
    where: { topicId: { in: topicIds } },
    include: includeRelations,
    orderBy,
  })

  res.json(withSiblings)
}

async function getScript(req, res) {
  const script = await prisma.script.findUnique({
    where: { id: req.params.id },
    include: includeRelations,
  })
  if (!script) throw notFound("Script not found")

  res.json(script)
}

async function updateScript(req, res) {
  const script = await prisma.script.findUnique({
    where: { id: req.params.id },
  })
  if (!script) throw notFound("Script not found")

  if (script.status !== "DRAFT") {
    throw conflict(
      `Only scripts that have not been rendered yet can be edited (this one is ${script.status}).`
    )
  }

  const updated = await prisma.script.update({
    where: { id: script.id },
    data: req.body,
    include: includeRelations,
  })

  res.json(updated)
}

async function renderScript(req, res) {
  const script = await prisma.script.findUnique({
    where: { id: req.params.id },
  })
  if (!script) throw notFound("Script not found")

  await render.startRender(script.id)

  const updated = await prisma.script.findUnique({
    where: { id: script.id },
    include: includeRelations,
  })

  logger.info(`Script ${script.id} selected; video render started`)
  res.status(202).json(updated)
}

async function getRenderStatus(req, res) {
  const script = await prisma.script.findUnique({
    where: { id: req.params.id },
  })
  if (!script) throw notFound("Script not found")

  if (script.status === "RENDERING") {
    await render.advanceRender(script.id)
  }

  const updated = await prisma.script.findUnique({
    where: { id: script.id },
    include: includeRelations,
  })

  res.json(updated)
}

async function approveScript(req, res) {
  const { scheduledAt, targetPlatforms } = req.body

  const script = await prisma.script.findUnique({
    where: { id: req.params.id },
  })
  if (!script) throw notFound("Script not found")

  if (script.status !== "PENDING_REVIEW") {
    throw conflict(
      `Only a script whose video is rendered and awaiting review can be approved (this one is ${script.status}).`
    )
  }

  if (!script.videoStorageUrl) {
    throw conflict(
      "This script has no rendered video to preview. Generate the video first."
    )
  }

  if (scheduledAt.getTime() <= Date.now()) {
    throw badRequest("Scheduled time must be in the future")
  }

  const updated = await prisma.script.update({
    where: { id: script.id },
    data: {
      status: "APPROVED",
      scheduledAt,
      targetPlatforms,
      approvedAt: new Date(),
      rejectedAt: null,
      rejectionReason: null,
      lastError: null,
    },
    include: includeRelations,
  })

  logger.info(
    `Script ${script.id} approved for ${scheduledAt.toISOString()} on ${targetPlatforms.join(", ")}`
  )
  res.json(updated)
}

async function rejectScript(req, res) {
  const script = await prisma.script.findUnique({
    where: { id: req.params.id },
  })
  if (!script) throw notFound("Script not found")

  if (["PROCESSING", "POSTED"].includes(script.status)) {
    throw conflict(`A ${script.status} script cannot be disapproved.`)
  }

  const updated = await prisma.script.update({
    where: { id: script.id },
    data: {
      status: "REJECTED",
      rejectedAt: new Date(),
      rejectionReason: req.body.reason,
      scheduledAt: null,
    },
    include: includeRelations,
  })

  const alternatives = await prisma.script.count({
    where: { topicId: script.topicId, status: "DRAFT" },
  })

  logger.info(
    `Script ${script.id} disapproved; ${alternatives} other option(s) available for this topic`
  )
  res.json(updated)
}

async function retryScript(req, res) {
  const script = await prisma.script.findUnique({
    where: { id: req.params.id },
  })
  if (!script) throw notFound("Script not found")

  if (script.status !== "FAILED") {
    throw conflict(`Only failed scripts can be retried (this one is ${script.status}).`)
  }

  if (!script.videoStorageUrl) {
    await render.startRender(script.id)

    const rendering = await prisma.script.findUnique({
      where: { id: script.id },
      include: includeRelations,
    })

    logger.info(`Script ${script.id} re-queued for rendering`)
    return res.status(202).json(rendering)
  }

  const updated = await prisma.script.update({
    where: { id: script.id },
    data: {
      status: "APPROVED",
      scheduledAt: new Date(Date.now() - 1000),
      processingAttempts: 0,
      processingStartedAt: null,
      lastError: null,
    },
    include: includeRelations,
  })

  logger.info(`Script ${script.id} re-queued for publishing`)
  res.json(updated)
}

module.exports = {
  listScripts,
  getScript,
  updateScript,
  renderScript,
  getRenderStatus,
  approveScript,
  rejectScript,
  retryScript,
  schemas: {
    listScriptsQuerySchema,
    updateScriptSchema,
    approveScriptSchema,
    rejectScriptSchema,
  },
}
