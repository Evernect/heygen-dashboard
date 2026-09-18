"use strict"

const test = require("node:test")
const assert = require("node:assert/strict")

const {
  MIN_DAYS_LIVE,
  daysLive,
  engagementRate,
  meanStd,
  zscore,
  computeComposite,
  assignTiers,
  scoreRows,
} = require("../src/services/insights/scoring.service")

const NOW = new Date("2026-09-18T12:00:00Z")
const daysAgo = (d) => new Date(NOW.getTime() - d * 24 * 3600 * 1000)

function row(id, days, platforms) {
  return { scriptId: id, postedAt: daysAgo(days), platforms }
}

function fb(views, likes, comments = 0, shares = 0) {
  return { platform: "FACEBOOK", views, likes, comments, shares }
}

function ig(views, likes, comments = 0, shares = 0) {
  return { platform: "INSTAGRAM", views, likes, comments, shares }
}

test("daysLive measures from the posting time", () => {
  assert.equal(daysLive(daysAgo(5), NOW), 5)
  assert.equal(daysLive(daysAgo(0.5), NOW), 0.5)
})

test("a missing or unparseable posted date counts as brand new", () => {
  assert.equal(daysLive(null, NOW), 0)
  assert.equal(daysLive("not a date", NOW), 0)
})

test("exactly three days live is eligible, a hair under is not", () => {
  const rows = [
    row("just-eligible", MIN_DAYS_LIVE, [fb(1000, 50)]),
    row("just-too-new", MIN_DAYS_LIVE - 0.01, [fb(1000, 50)]),
  ]

  const { scored, tooNew } = computeComposite(rows, NOW)

  assert.deepEqual(
    scored.map((r) => r.scriptId),
    ["just-eligible"]
  )
  assert.deepEqual(
    tooNew.map((r) => r.scriptId),
    ["just-too-new"]
  )
})

test("engagement rate sums the three interactions over views", () => {
  assert.equal(engagementRate({ views: 200, likes: 10, comments: 6, shares: 4 }), 0.1)
})

test("zero views is a zero rate, not a division by zero", () => {
  assert.equal(engagementRate({ views: 0, likes: 9, comments: 9, shares: 9 }), 0)
})

test("meanStd returns the population standard deviation", () => {
  const { mean, std } = meanStd([2, 4, 4, 4, 5, 5, 7, 9])
  assert.equal(mean, 5)
  assert.equal(std, 2)
})

test("meanStd of nothing is zero rather than NaN", () => {
  assert.deepEqual(meanStd([]), { mean: 0, std: 0 })
})

test("zscore is zero when every value is identical", () => {
  assert.equal(zscore(0.05, { mean: 0.05, std: 0 }), 0)
})

test("a too-new row keeps a null score and never moves the baseline", () => {
  const rows = [
    row("old-low", 10, [fb(1000, 10)]),
    row("old-high", 10, [fb(1000, 90)]),
    row("fresh-huge", 1, [fb(1000, 5000)]),
  ]

  const { scored, tooNew, statsByPlatform } = computeComposite(rows, NOW)

  assert.equal(tooNew[0].compositeScore, null)
  assert.ok(Math.abs(statsByPlatform.get("FACEBOOK").mean - 0.05) < 1e-9)
  assert.equal(scored.find((r) => r.scriptId === "old-high").compositeScore > 0, true)
  assert.equal(scored.find((r) => r.scriptId === "old-low").compositeScore < 0, true)
})

test("a video is z-scored against its own platform, not a pooled average", () => {
  const rows = [
    row("fb-leader", 10, [fb(1000, 30)]),
    row("fb-laggard", 10, [fb(1000, 10)]),
    row("ig-leader", 10, [ig(1000, 300)]),
    row("ig-laggard", 10, [ig(1000, 100)]),
  ]

  const { scored } = computeComposite(rows, NOW)
  const byId = new Map(scored.map((r) => [r.scriptId, r.compositeScore]))

  assert.equal(byId.get("fb-leader") > 0, true)
  assert.equal(byId.get("fb-leader"), byId.get("ig-leader"))
})

test("a single-platform video scores off that platform alone", () => {
  const rows = [
    row("both", 10, [fb(1000, 30), ig(1000, 30)]),
    row("fb-only", 10, [fb(1000, 10)]),
    row("ig-only", 10, [ig(1000, 10)]),
  ]

  const { scored } = computeComposite(rows, NOW)
  const byId = new Map(scored.map((r) => [r.scriptId, r.compositeScore]))

  assert.equal(byId.get("fb-only"), byId.get("ig-only"))
  assert.equal(byId.get("both") > byId.get("fb-only"), true)
})

test("tiers split the ranking into thirds", () => {
  const scored = Array.from({ length: 99 }, (_, index) => ({
    scriptId: `s${index}`,
    compositeScore: index,
  }))

  const tiered = assignTiers(scored)
  const counts = tiered.reduce((acc, r) => {
    acc[r.performanceTier] = (acc[r.performanceTier] ?? 0) + 1
    return acc
  }, {})

  assert.equal(tiered[0].scriptId, "s98")
  assert.equal(tiered[0].performanceTier, "TOP")
  assert.equal(tiered.at(-1).performanceTier, "BOTTOM")
  assert.equal(counts.TOP + counts.MID + counts.BOTTOM, 99)
  assert.equal(counts.MID > 0, true)
})

test("tiering degenerates gracefully at one and two rows", () => {
  const one = assignTiers([{ scriptId: "a", compositeScore: 0 }])
  assert.deepEqual(one.map((r) => r.performanceTier), ["TOP"])

  const two = assignTiers([
    { scriptId: "a", compositeScore: 1 },
    { scriptId: "b", compositeScore: 0 },
  ])
  assert.deepEqual(two.map((r) => r.performanceTier), ["TOP", "BOTTOM"])
})

test("scoreRows returns every row and counts only the scored ones", () => {
  const rows = [
    row("a", 10, [fb(1000, 10)]),
    row("b", 10, [fb(1000, 90)]),
    row("c", 1, [fb(1000, 50)]),
  ]

  const { rows: out, sampleSize } = scoreRows(rows, NOW)

  assert.equal(out.length, 3)
  assert.equal(sampleSize, 2)
  assert.equal(out.find((r) => r.scriptId === "c").performanceTier, "TOO_NEW")
})
