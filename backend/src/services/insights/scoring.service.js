"use strict"

const MIN_DAYS_LIVE = 3

const MIN_SAMPLE_SIZE = 15

const METRICS_WINDOW_DAYS = 30

const MS_PER_DAY = 24 * 60 * 60 * 1000

function daysLive(postedAt, now = new Date()) {
  if (!postedAt) return 0

  const posted = postedAt instanceof Date ? postedAt : new Date(postedAt)
  if (Number.isNaN(posted.getTime())) return 0

  return (now.getTime() - posted.getTime()) / MS_PER_DAY
}

function engagementRate({ views, likes, comments, shares }) {
  const total = (likes ?? 0) + (comments ?? 0) + (shares ?? 0)
  return views > 0 ? total / views : 0
}

function meanStd(values) {
  const count = values.length
  if (count === 0) return { mean: 0, std: 0 }

  const mean = values.reduce((sum, value) => sum + value, 0) / count
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / count

  return { mean, std: Math.sqrt(variance) }
}

function zscore(value, stats) {
  if (!stats || stats.std === 0) return 0
  return (value - stats.mean) / stats.std
}

function computeComposite(rows, now = new Date()) {
  const eligible = []
  const tooNew = []

  for (const row of rows) {
    ;(daysLive(row.postedAt, now) >= MIN_DAYS_LIVE ? eligible : tooNew).push(row)
  }

  const statsByPlatform = new Map()
  const ratesByPlatform = new Map()

  for (const row of eligible) {
    for (const entry of row.platforms) {
      const rates = ratesByPlatform.get(entry.platform) ?? []
      rates.push(engagementRate(entry))
      ratesByPlatform.set(entry.platform, rates)
    }
  }

  for (const [platform, rates] of ratesByPlatform) {
    statsByPlatform.set(platform, meanStd(rates))
  }

  const scored = eligible.map((row) => {
    const zScores = row.platforms.map((entry) =>
      zscore(engagementRate(entry), statsByPlatform.get(entry.platform))
    )

    const composite = zScores.length
      ? zScores.reduce((sum, value) => sum + value, 0) / zScores.length
      : 0

    return { ...row, compositeScore: Number(composite.toFixed(3)) }
  })

  return {
    scored,
    tooNew: tooNew.map((row) => ({ ...row, compositeScore: null })),
    statsByPlatform,
  }
}

function assignTiers(scored) {
  const ranked = [...scored].sort((a, b) => b.compositeScore - a.compositeScore)
  const count = ranked.length

  return ranked.map((row, index) => {
    const percentile = count > 1 ? index / (count - 1) : 0
    const performanceTier =
      percentile <= 0.33 ? "TOP" : percentile >= 0.67 ? "BOTTOM" : "MID"

    return { ...row, performanceTier }
  })
}

function scoreRows(rows, now = new Date()) {
  const { scored, tooNew } = computeComposite(rows, now)

  const tiered = assignTiers(scored)
  const held = tooNew.map((row) => ({ ...row, performanceTier: "TOO_NEW" }))

  return { rows: [...tiered, ...held], sampleSize: tiered.length }
}

module.exports = {
  MIN_DAYS_LIVE,
  MIN_SAMPLE_SIZE,
  METRICS_WINDOW_DAYS,
  daysLive,
  engagementRate,
  meanStd,
  zscore,
  computeComposite,
  assignTiers,
  scoreRows,
}
