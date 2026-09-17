"use strict"

const test = require("node:test")
const assert = require("node:assert/strict")

const {
  tokenize,
  jaccard,
  dedupeByLink,
  clusterByHeadline,
  recencyPoints,
  orderUrls,
  capPerLabel,
  clusterAndScore,
} = require("../src/services/news/cluster-scoring")
const constants = require("../src/services/news/scoring-constants")

const NOW = Date.parse("2026-09-17T12:00:00Z")
const hoursAgo = (h) => new Date(NOW - h * 3600 * 1000).toISOString()

function article(overrides = {}) {
  return {
    keywordId: "K01",
    topicLabel: "Gas tax",
    scope: "state",
    type: "issue",
    priority: 5,
    title: "California raises the gas tax again",
    outlet: "Ventura County Star",
    description: "",
    link: `https://example.com/${Math.random()}`,
    publishedAt: hoursAgo(2),
    ...overrides,
  }
}

test("tokenize drops stopwords and short words", () => {
  assert.deepEqual(tokenize("The gas tax is in California"), [
    "gas",
    "tax",
    "california",
  ])
})

test("jaccard is 1 for identical sets and 0 when disjoint", () => {
  const a = new Set(["gas", "tax"])
  assert.equal(jaccard(a, new Set(["gas", "tax"])), 1)
  assert.equal(jaccard(a, new Set(["housing", "bill"])), 0)
  assert.equal(jaccard(a, new Set()), 0)
})

test("duplicate links collapse to one article", () => {
  const unique = dedupeByLink([
    article({ link: "https://a.com/1" }),
    article({ link: "https://a.com/1" }),
    article({ link: "https://a.com/2" }),
  ])

  assert.equal(unique.length, 2)
})

test("near-identical headlines land in one cluster, a different story does not", () => {
  const clusters = clusterByHeadline([
    article({ title: "California raises the gas tax again" }),
    article({ title: "California raises the gas tax again, lawmakers say" }),
    article({ title: "Ventura County housing permits stall" }),
  ])

  assert.equal(clusters.length, 2)
  assert.equal(clusters[0].articles.length, 2)
})

test("recency buckets are inclusive at their edges", () => {
  assert.equal(recencyPoints(6), 8)
  assert.equal(recencyPoints(6.1), 6)
  assert.equal(recencyPoints(12), 6)
  assert.equal(recencyPoints(24), 4)
  assert.equal(recencyPoints(25), 1)
})

test("publisher links sort ahead of Google News wrappers", () => {
  const urls = orderUrls([
    { link: "https://news.google.com/rss/articles/ABC" },
    { link: "https://vcstar.com/real-article" },
  ])

  assert.equal(urls[0], "https://vcstar.com/real-article")
})

test("breadth, district and named all raise the score", () => {
  const plain = clusterAndScore({
    articles: [article({ outlet: "A" }), article({ outlet: "B" })],
    now: NOW,
  }).clusters[0]

  const local = clusterAndScore({
    articles: [
      article({ outlet: "A", scope: "district" }),
      article({ outlet: "B" }),
    ],
    now: NOW,
  }).clusters[0]

  assert.equal(local.isDistrict, true)
  assert.equal(plain.isDistrict, false)
  assert.equal(local.score - plain.score, constants.WEIGHTS.geo)
})

test("a district term in the text marks a story local even without a district keyword", () => {
  const { clusters } = clusterAndScore({
    articles: [
      article({ description: "The Thousand Oaks council said so.", outlet: "A" }),
      article({ outlet: "B" }),
    ],
    signals: { districtTerms: ["Thousand Oaks", "Simi Valley"] },
    now: NOW,
  })

  assert.equal(clusters[0].isDistrict, true)
})

test("the candidate's name marks a story as named", () => {
  const { clusters } = clusterAndScore({
    articles: [article({ description: "Ted Nordblum responded." })],
    signals: { candidateName: "Ted Nordblum" },
    now: NOW,
  })

  assert.equal(clusters[0].isNamed, true)
})

test("a story only one outlet ran is penalised", () => {
  const solo = clusterAndScore({
    articles: [article({ outlet: "A" })],
    now: NOW,
  }).clusters[0]

  const pair = clusterAndScore({
    articles: [article({ outlet: "A" }), article({ outlet: "B" })],
    now: NOW,
  }).clusters[0]

  assert.equal(
    pair.score - solo.score,
    constants.WEIGHTS.breadth - constants.WEIGHTS.solo
  )
})

test("a story already covered this week is flagged and penalised", () => {
  const articles = [article({ outlet: "A" }), article({ outlet: "B" })]

  const fresh = clusterAndScore({ articles, now: NOW }).clusters[0]
  const repeated = clusterAndScore({
    articles,
    history: [{ tokens: tokenize("California raises the gas tax again") }],
    now: NOW,
  }).clusters[0]

  assert.equal(fresh.isRepeat, false)
  assert.equal(repeated.isRepeat, true)
  assert.equal(repeated.score, Math.max(0, fresh.score + constants.REPEAT_PENALTY))
})

test("repeats come back when there are too few fresh stories to fill the pool", () => {
  const { clusters } = clusterAndScore({
    articles: [article({ title: "California raises the gas tax again" })],
    history: [{ tokens: tokenize("California raises the gas tax again") }],
    now: NOW,
  })

  assert.equal(clusters.length, 1)
  assert.equal(clusters[0].isRepeat, true)
})

test("no more than two clusters carry the same topic label", () => {
  const capped = capPerLabel(
    [
      { topicLabels: "Gas tax", score: 90 },
      { topicLabels: "Gas tax", score: 80 },
      { topicLabels: "Gas tax", score: 70 },
      { topicLabels: "Prop 13", score: 60 },
    ],
    constants
  )

  assert.equal(capped.length, 3)
  assert.equal(capped.filter((c) => c.topicLabels === "Gas tax").length, 2)
})

test("clusters come back highest score first with run-local ids", () => {
  const { clusters, stats } = clusterAndScore({
    articles: [
      article({ title: "Ventura County housing permits stall", outlet: "A" }),
      article({
        title: "California raises the gas tax again",
        outlet: "B",
        scope: "district",
      }),
      article({ title: "California raises the gas tax again", outlet: "C" }),
    ],
    now: NOW,
  })

  assert.deepEqual(
    clusters.map((c) => c.clusterId),
    ["1", "2"]
  )
  assert.ok(clusters[0].score >= clusters[1].score)
  assert.equal(clusters[0].outletCount, 2)
  assert.equal(stats.articles, 3)
  assert.equal(stats.clustered, 2)
})

test("scores stay inside 0 and 100", () => {
  const many = Array.from({ length: 30 }, (_, i) =>
    article({ outlet: `Outlet ${i}`, scope: "district", type: "name" })
  )

  const { clusters } = clusterAndScore({ articles: many, now: NOW })
  assert.ok(clusters[0].score <= 100)
  assert.ok(clusters[0].score >= 0)
})

test("no articles is an empty result, not a throw", () => {
  const { clusters, stats } = clusterAndScore({ articles: [], now: NOW })

  assert.deepEqual(clusters, [])
  assert.equal(stats.articles, 0)
})
