"use strict"

const { prisma } = require("../../lib/prisma")

async function loadScriptGuidance(userId) {
  const latest = await prisma.stylePlaybook.findFirst({
    where: { userId, isActive: true },
    orderBy: { createdAt: "desc" },
    select: { guidance: true },
  })

  return latest?.guidance ?? ""
}

async function loadScriptContext(userId) {
  const [guidanceText, profile] = await Promise.all([
    loadScriptGuidance(userId),
    prisma.campaignProfile.findUnique({
      where: { userId },
      select: { candidateName: true, office: true, state: true },
    }),
  ])

  return {
    guidanceText,
    candidateName: profile?.candidateName ?? null,
    office: profile?.office ?? null,
    state: profile?.state ?? null,
  }
}

async function publishGeneratedGuidance({
  userId,
  guidance,
  sampleSize,
  runId,
  label,
}) {
  const [, entry] = await prisma.$transaction([
    prisma.stylePlaybook.updateMany({
      where: { userId, source: "GENERATED", isActive: true },
      data: { isActive: false },
    }),
    prisma.stylePlaybook.create({
      data: {
        userId,
        guidance,
        label: label ?? null,
        source: "GENERATED",
        sampleSize,
        runId,
        isActive: true,
      },
    }),
  ])

  return entry
}

module.exports = {
  loadScriptGuidance,
  loadScriptContext,
  publishGeneratedGuidance,
}
