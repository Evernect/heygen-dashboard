"use strict"

const { z } = require("zod")

const { prisma } = require("../lib/prisma")
const { notFound } = require("../utils/errors")

/**
 * Accepts either a real array or the pipe-joined string the original Google
 * Sheet used, so a column pasted straight out of that sheet still imports.
 */
const pipeList = z
  .union([z.array(z.string()), z.string()])
  .transform((value) =>
    (Array.isArray(value) ? value : value.split("|"))
      .map((entry) => entry.trim())
      .filter(Boolean)
  )

/** A yes/no that also understands the sheet's "Y"/"N". */
const sheetBoolean = z
  .union([z.boolean(), z.string()])
  .transform((value) =>
    typeof value === "boolean"
      ? value
      : ["y", "yes", "true", "1"].includes(value.trim().toLowerCase())
  )

// --- Keywords --------------------------------------------------------------

/**
 * The field shapes, without defaults.
 *
 * Defaults are added only to the create schema. `.partial()` does not suppress
 * a `.default()`, so a shared schema would turn `PATCH { priority: 5 }` into a
 * write that also blanked `terms` and `places` and reset `type`, `scope` and
 * `active` — a partial update that quietly destroys the rest of the row.
 */
const keywordShape = {
  keywordId: z.string().trim().min(1).max(40),
  type: z.string().trim().min(1).max(40),
  topicLabel: z.string().trim().min(1).max(120),
  query: z.string().trim().min(1),
  terms: pipeList,
  places: pipeList,
  scope: z.string().trim().min(1).max(40),
  priority: z.coerce.number().int().min(1).max(10),
  active: sheetBoolean,
}

const createKeywordSchema = z.object({
  ...keywordShape,
  type: keywordShape.type.default("issue"),
  terms: keywordShape.terms.default([]),
  places: keywordShape.places.default([]),
  scope: keywordShape.scope.default("state"),
  priority: keywordShape.priority.default(3),
  active: keywordShape.active.default(true),
})

const updateKeywordSchema = z
  .object(keywordShape)
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  })

const MAX_BULK_KEYWORDS = 200

const bulkKeywordsSchema = z.object({
  keywords: z.array(createKeywordSchema).min(1).max(MAX_BULK_KEYWORDS),
})

function owned(req) {
  return { id: req.params.id, userId: req.user.id }
}

async function listKeywords(req, res) {
  const keywords = await prisma.newsKeyword.findMany({
    where: { userId: req.user.id },
    orderBy: [{ active: "desc" }, { priority: "desc" }, { keywordId: "asc" }],
  })

  res.json({ keywords })
}

async function createKeyword(req, res) {
  const keyword = await prisma.newsKeyword.create({
    data: { ...req.body, userId: req.user.id },
  })

  res.status(201).json(keyword)
}

/**
 * Upserts on (userId, keywordId) rather than inserting, so re-importing a sheet
 * that has been edited updates the existing rows instead of colliding.
 */
async function bulkUpsertKeywords(req, res) {
  const userId = req.user.id

  const saved = await prisma.$transaction(
    req.body.keywords.map((keyword) =>
      prisma.newsKeyword.upsert({
        where: {
          userId_keywordId: { userId, keywordId: keyword.keywordId },
        },
        create: { ...keyword, userId },
        update: keyword,
      })
    )
  )

  res.status(201).json({ keywords: saved, count: saved.length })
}

async function updateKeyword(req, res) {
  const existing = await prisma.newsKeyword.findFirst({ where: owned(req) })
  if (!existing) throw notFound("Keyword not found")

  res.json(
    await prisma.newsKeyword.update({
      where: { id: existing.id },
      data: req.body,
    })
  )
}

async function deleteKeyword(req, res) {
  const existing = await prisma.newsKeyword.findFirst({ where: owned(req) })
  if (!existing) throw notFound("Keyword not found")

  await prisma.newsKeyword.delete({ where: { id: existing.id } })
  res.status(204).send()
}

// --- Campaign profile ------------------------------------------------------

const campaignProfileSchema = z
  .object({
    candidateName: z.string().trim().min(1).max(160),
    party: z.string().trim().max(80).nullable(),
    office: z.string().trim().max(160).nullable(),
    district: z.string().trim().max(120).nullable(),
    districtDescription: z.string().trim().max(2000).nullable(),
    districtTerms: pipeList,
    state: z.string().trim().max(80).nullable(),
    electionDate: z.coerce.date().nullable(),
    personaSummary: z.string().trim().max(4000).nullable(),
    timezone: z.string().trim().min(1).max(64),
    newsRunHour: z.coerce.number().int().min(0).max(23),
    topicsPerRun: z.coerce.number().int().min(1).max(5),
    newsEnabled: z.boolean(),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  })

async function readCampaignProfile(req, res) {
  const profile = await prisma.campaignProfile.findUnique({
    where: { userId: req.user.id },
  })

  res.json({ profile, timezones: Intl.supportedValuesOf("timeZone") })
}

async function writeCampaignProfile(req, res) {
  // A profile is required before the pipeline can run at all, so the first
  // save has to be able to create the row; candidateName is the only field
  // without a sensible default.
  const profile = await prisma.campaignProfile.upsert({
    where: { userId: req.user.id },
    create: {
      userId: req.user.id,
      candidateName: req.body.candidateName ?? "",
      ...req.body,
    },
    update: req.body,
  })

  res.json({ profile })
}

// --- Positions -------------------------------------------------------------

// Same split as the keyword schemas, and for the same reason.
const positionShape = {
  issue: z.string().trim().min(1).max(160),
  stance: z.string().trim().min(1).max(2000),
  sourceUrl: z.string().trim().url().nullable(),
  lastVerifiedAt: z.coerce.date().nullable(),
  sortOrder: z.coerce.number().int().min(0),
  active: sheetBoolean,
}

const createPositionSchema = z.object({
  ...positionShape,
  sourceUrl: positionShape.sourceUrl.optional(),
  lastVerifiedAt: positionShape.lastVerifiedAt.optional(),
  sortOrder: positionShape.sortOrder.default(0),
  active: positionShape.active.default(true),
})

const updatePositionSchema = z
  .object(positionShape)
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  })

const MAX_BULK_POSITIONS = 200

const bulkPositionsSchema = z.object({
  positions: z.array(createPositionSchema).min(1).max(MAX_BULK_POSITIONS),
})

async function listPositions(req, res) {
  const positions = await prisma.candidatePosition.findMany({
    where: { userId: req.user.id },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  })

  res.json({ positions })
}

async function createPosition(req, res) {
  res.status(201).json(
    await prisma.candidatePosition.create({
      data: { ...req.body, userId: req.user.id },
    })
  )
}

/**
 * Imports positions, matching an existing row on its issue.
 *
 * There is no unique key on (userId, issue) — nothing stops someone recording
 * two positions on one issue by hand — so the match is done per row rather than
 * with an upsert. Re-importing a corrected sheet then updates the stance in
 * place instead of leaving two contradictory rows for the angle writer to read.
 */
async function bulkUpsertPositions(req, res) {
  const userId = req.user.id
  const rows = req.body.positions

  const existing = await prisma.candidatePosition.findMany({
    where: { userId, issue: { in: rows.map((row) => row.issue) } },
    select: { id: true, issue: true },
  })

  const byIssue = new Map(existing.map((row) => [row.issue, row.id]))
  const offset = await prisma.candidatePosition.count({ where: { userId } })

  const saved = await prisma.$transaction(
    rows.map((row, index) => {
      const id = byIssue.get(row.issue)

      return id
        ? prisma.candidatePosition.update({ where: { id }, data: row })
        : prisma.candidatePosition.create({
            data: {
              ...row,
              userId,
              sortOrder: row.sortOrder || offset + index,
            },
          })
    })
  )

  res.status(201).json({ positions: saved, count: saved.length })
}

async function updatePosition(req, res) {
  const existing = await prisma.candidatePosition.findFirst({
    where: owned(req),
  })
  if (!existing) throw notFound("Position not found")

  res.json(
    await prisma.candidatePosition.update({
      where: { id: existing.id },
      data: req.body,
    })
  )
}

async function deletePosition(req, res) {
  const existing = await prisma.candidatePosition.findFirst({
    where: owned(req),
  })
  if (!existing) throw notFound("Position not found")

  await prisma.candidatePosition.delete({ where: { id: existing.id } })
  res.status(204).send()
}

// --- Style playbook --------------------------------------------------------

const createPlaybookSchema = z.object({
  label: z.string().trim().max(120).nullable().optional(),
  guidance: z.string().trim().min(1).max(8000),
})

async function listPlaybook(req, res) {
  const entries = await prisma.stylePlaybook.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
  })

  res.json({ entries })
}

/** A new entry supersedes the last, which is what "latest guidance" meant. */
async function createPlaybookEntry(req, res) {
  const userId = req.user.id

  const [, entry] = await prisma.$transaction([
    prisma.stylePlaybook.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    }),
    prisma.stylePlaybook.create({
      data: { ...req.body, userId, isActive: true },
    }),
  ])

  res.status(201).json(entry)
}

async function deletePlaybookEntry(req, res) {
  const existing = await prisma.stylePlaybook.findFirst({ where: owned(req) })
  if (!existing) throw notFound("Guidance entry not found")

  await prisma.stylePlaybook.delete({ where: { id: existing.id } })
  res.status(204).send()
}

module.exports = {
  listKeywords,
  createKeyword,
  bulkUpsertKeywords,
  updateKeyword,
  deleteKeyword,
  readCampaignProfile,
  writeCampaignProfile,
  listPositions,
  createPosition,
  bulkUpsertPositions,
  updatePosition,
  deletePosition,
  listPlaybook,
  createPlaybookEntry,
  deletePlaybookEntry,
  schemas: {
    createKeywordSchema,
    updateKeywordSchema,
    bulkKeywordsSchema,
    campaignProfileSchema,
    createPositionSchema,
    updatePositionSchema,
    bulkPositionsSchema,
    createPlaybookSchema,
  },
}
