"use strict"

const { z } = require("zod")

const { prisma } = require("../lib/prisma")
const { badRequest, conflict, notFound } = require("../utils/errors")
const { logger } = require("../utils/logger")

const SCRIPT_STATUSES = [
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
  const { status } = req.validatedQuery ?? {}

  const scripts = await prisma.script.findMany({
    where: status ? { status } : undefined,
    include: includeRelations,
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
  })

  res.json(scripts)
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

  // Edits are only safe before approval
  if (script.status !== "PENDING_REVIEW") {
    throw conflict(
      `Only scripts awaiting review can be edited (this one is ${script.status}).`
    )
  }

  const updated = await prisma.script.update({
    where: { id: script.id },
    data: req.body,
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

  if (!["PENDING_REVIEW", "REJECTED"].includes(script.status)) {
    throw conflict(`A ${script.status} script cannot be approved.`)
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

  res.json(updated)
}

/**
 * Re-queues a failed script. The HeyGen id and stored video are preserved, so
 * the orchestrator resumes at the publish phase rather than re-rendering and
 * re-spending credits.
 */
async function retryScript(req, res) {
  const script = await prisma.script.findUnique({
    where: { id: req.params.id },
  })
  if (!script) throw notFound("Script not found")

  if (script.status !== "FAILED") {
    throw conflict(`Only failed scripts can be retried (this one is ${script.status}).`)
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
