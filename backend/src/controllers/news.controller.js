"use strict"

const { z } = require("zod")

const { prisma } = require("../lib/prisma")
const { notFound } = require("../utils/errors")
const {
  KEYWORD_TYPES,
  KEYWORD_SCOPES,
  DEFAULT_SCOPE,
  DEFAULT_PRIORITY,
  MIN_PRIORITY,
  MAX_PRIORITY,
  defaultType,
  defaultTopicLabel,
} = require("../services/news/keyword-rules")

const pipeList = z
  .union([z.array(z.string()), z.string()])
  .transform((value) =>
    (Array.isArray(value) ? value : value.split(/[|,]/))
      .map((entry) => entry.trim())
      .filter(Boolean)
  )

const sheetBoolean = z
  .union([z.boolean(), z.string()])
  .transform((value) =>
    typeof value === "boolean"
      ? value
      : ["y", "yes", "true", "1"].includes(value.trim().toLowerCase())
  )

function optional(schema) {
  return z.preprocess(
    (value) =>
      value === null || (typeof value === "string" && !value.trim())
        ? undefined
        : value,
    schema.optional()
  )
}

const lowercase = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : value

const createKeywordSchema = z.object({
  query: z.string().trim().min(1),
  keywordId: optional(z.string().trim().max(40)),
  topicLabel: optional(z.string().trim().max(120)),
  type: optional(z.preprocess(lowercase, z.enum(KEYWORD_TYPES))),
  scope: optional(z.preprocess(lowercase, z.enum(KEYWORD_SCOPES))),
  priority: optional(z.coerce.number().int().min(MIN_PRIORITY).max(MAX_PRIORITY)),
  terms: optional(pipeList),
  places: optional(pipeList),
  active: optional(sheetBoolean),
})

const updateKeywordSchema = z
  .object({
    query: z.string().trim().min(1),
    keywordId: z.string().trim().min(1).max(40),
    topicLabel: z.string().trim().max(120),
    type: z.union([z.literal(""), z.preprocess(lowercase, z.enum(KEYWORD_TYPES))]),
    scope: z.union([z.literal(""), z.preprocess(lowercase, z.enum(KEYWORD_SCOPES))]),
    priority: z.coerce.number().int().min(MIN_PRIORITY).max(MAX_PRIORITY),
    terms: pipeList,
    places: pipeList,
    active: sheetBoolean,
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  })

function withKeywordDefaults(keyword) {
  return {
    ...keyword,
    topicLabel: keyword.topicLabel || defaultTopicLabel(keyword.query),
    type: keyword.type || defaultType(keyword.query),
    scope: keyword.scope || DEFAULT_SCOPE,
    priority: keyword.priority ?? DEFAULT_PRIORITY,
    terms: keyword.terms ?? [],
    places: keyword.places ?? [],
    active: keyword.active ?? true,
  }
}

const MAX_BULK_KEYWORDS = 200

const bulkKeywordsSchema = z.object({
  keywords: z.array(createKeywordSchema).min(1).max(MAX_BULK_KEYWORDS),
})

function owned(req) {
  return { id: req.params.id, userId: req.user.id }
}

const AUTO_CODE = /^K(\d+)$/i

async function nextKeywordCodes(userId, count, reserved = []) {
  const existing = await prisma.newsKeyword.findMany({
    where: { userId },
    select: { keywordId: true },
  })

  let highest = 0
  for (const code of [...existing.map((row) => row.keywordId), ...reserved]) {
    const match = AUTO_CODE.exec(code ?? "")
    if (match) highest = Math.max(highest, Number(match[1]))
  }

  return Array.from(
    { length: count },
    (_, index) => `K${String(highest + index + 1).padStart(2, "0")}`
  )
}

async function listKeywords(req, res) {
  const keywords = await prisma.newsKeyword.findMany({
    where: { userId: req.user.id },
    orderBy: [{ active: "desc" }, { priority: "desc" }, { keywordId: "asc" }],
  })

  res.json({ keywords })
}

async function createKeyword(req, res) {
  const userId = req.user.id
  const keywordId =
    req.body.keywordId ?? (await nextKeywordCodes(userId, 1))[0]

  const keyword = await prisma.newsKeyword.create({
    data: { ...withKeywordDefaults(req.body), keywordId, userId },
  })

  res.status(201).json(keyword)
}

async function bulkUpsertKeywords(req, res) {
  const userId = req.user.id
  const { keywords } = req.body

  const provided = keywords.map((keyword) => keyword.keywordId).filter(Boolean)
  const generated = await nextKeywordCodes(
    userId,
    keywords.length - provided.length,
    provided
  )
  const withCodes = keywords.map((keyword) => ({
    ...withKeywordDefaults(keyword),
    keywordId: keyword.keywordId || generated.shift(),
  }))

  const saved = await prisma.$transaction(
    withCodes.map((keyword) =>
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

  const data = { ...req.body }
  const query = data.query ?? existing.query
  if (data.topicLabel === "") data.topicLabel = defaultTopicLabel(query)
  if (data.type === "") data.type = defaultType(query)
  if (data.scope === "") data.scope = DEFAULT_SCOPE

  res.json(
    await prisma.newsKeyword.update({
      where: { id: existing.id },
      data,
    })
  )
}

async function deleteKeyword(req, res) {
  const existing = await prisma.newsKeyword.findFirst({ where: owned(req) })
  if (!existing) throw notFound("Keyword not found")

  await prisma.newsKeyword.delete({ where: { id: existing.id } })
  res.status(204).send()
}

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

async function createPlaybookEntry(req, res) {
  const userId = req.user.id

  const [, entry] = await prisma.$transaction([
    prisma.stylePlaybook.updateMany({
      where: { userId, isActive: true, source: "MANUAL" },
      data: { isActive: false },
    }),
    prisma.stylePlaybook.create({
      data: { ...req.body, userId, source: "MANUAL", isActive: true },
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
