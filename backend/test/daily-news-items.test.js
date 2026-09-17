"use strict"

const test = require("node:test")
const assert = require("node:assert/strict")

const {
  buildItemsFromPicks,
} = require("../src/services/news/daily-news.service")

const CLUSTERS = [
  {
    clusterId: "1",
    clusterTitle: "California raises the gas tax again",
    outlet: "Ventura County Star",
    outletCount: 4,
    score: 71,
    urls: ["https://vcstar.com/a", "https://news.google.com/rss/articles/X"],
    publishedAt: "2026-09-17T10:00:00.000Z",
  },
  {
    clusterId: "2",
    clusterTitle: "Prop 13 challenge filed",
    outlet: "LA Times",
    outletCount: 2,
    score: 55,
    urls: ["https://latimes.com/b"],
    publishedAt: "2026-09-17T09:00:00.000Z",
  },
]

function angle(overrides = {}) {
  return {
    id: "1",
    topic: "Gas tax rises again",
    angle: "I would repeal it.",
    why_now: "The vote is Tuesday.",
    importance: "High",
    importance_score: 71,
    source_summary: "Lawmakers voted to raise the tax.",
    conflict_flag: "",
    ...overrides,
  }
}

test("a pick is joined to its cluster and carries the sources through", () => {
  const [item] = buildItemsFromPicks({
    angles: [angle()],
    clusters: CLUSTERS,
    localDate: "2026-09-17",
    localTime: "07:03",
  })

  assert.equal(item.issueCode, "LN-20260917-1")
  assert.equal(item.unmatched, false)
  assert.equal(item.clusterId, "1")
  assert.equal(item.outletCount, 4)
  assert.equal(item.headline, "California raises the gas tax again")
  assert.deepEqual(item.sourceUrls, [
    "https://vcstar.com/a",
    "https://news.google.com/rss/articles/X",
  ])
  assert.equal(item.conflictFlag, null)
})

test("the cluster's own score wins over whatever the model echoed back", () => {
  const [item] = buildItemsFromPicks({
    angles: [angle({ importance_score: 9999 })],
    clusters: CLUSTERS,
    localDate: "2026-09-17",
    localTime: "07:03",
  })

  assert.equal(item.importanceScore, 71)
})

test("an id matching no cluster is kept, flagged, and left without sources", () => {
  const [item] = buildItemsFromPicks({
    angles: [angle({ id: "47" })],
    clusters: CLUSTERS,
    localDate: "2026-09-17",
    localTime: "07:03",
  })

  assert.equal(item.unmatched, true)
  assert.equal(item.clusterId, null)
  assert.deepEqual(item.sourceUrls, [])
  assert.match(item.conflictFlag, /UNMATCHED: no story matched id 47/)
  // The topic itself still survives — it is usually still worth making.
  assert.equal(item.topic, "Gas tax rises again")
})

test("a real conflict and an unmatched id are both reported", () => {
  const [item] = buildItemsFromPicks({
    angles: [angle({ id: "47", conflict_flag: "No stated position covers this." })],
    clusters: CLUSTERS,
    localDate: "2026-09-17",
    localTime: "07:03",
  })

  assert.match(item.conflictFlag, /No stated position covers this/)
  assert.match(item.conflictFlag, /UNMATCHED/)
})

test("a headlines-only summary is detected and flagged", () => {
  const [plain, thin] = buildItemsFromPicks({
    angles: [
      angle(),
      angle({ id: "2", source_summary: "HEADLINES ONLY: two outlets ran this." }),
    ],
    clusters: CLUSTERS,
    localDate: "2026-09-17",
    localTime: "07:03",
  })

  assert.equal(plain.headlinesOnly, false)
  assert.equal(thin.headlinesOnly, true)
})

test("issue codes number a day's picks in order", () => {
  const items = buildItemsFromPicks({
    angles: [angle(), angle({ id: "2" })],
    clusters: CLUSTERS,
    localDate: "2026-09-17",
    localTime: "07:03",
  })

  assert.deepEqual(
    items.map((item) => item.issueCode),
    ["LN-20260917-1", "LN-20260917-2"]
  )
})

test("a topic whose angle failed to write is still kept", () => {
  const [item] = buildItemsFromPicks({
    angles: [angle({ angle: "" })],
    clusters: CLUSTERS,
    localDate: "2026-09-17",
    localTime: "07:03",
  })

  assert.equal(item.angle, "")
  assert.equal(item.topic, "Gas tax rises again")
})
