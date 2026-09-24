"use strict"

const test = require("node:test")
const assert = require("node:assert/strict")

const {
  buildFeedUrl,
  buildFeedRequests,
} = require("../src/services/news/feed-url.builder")

test("RSS: prefix is used verbatim", () => {
  const url = buildFeedUrl({ query: "RSS:https://vcstar.com/feed/rss" })
  assert.equal(url, "https://vcstar.com/feed/rss")
})

test("GEO: prefix builds a Google News place feed", () => {
  const url = buildFeedUrl({ query: "GEO:Thousand Oaks" })
  assert.equal(
    url,
    "https://news.google.com/rss/headlines/section/geo/Thousand%20Oaks?hl=en-US&gl=US&ceid=US:en"
  )
})

function searchOf(url) {
  return new URL(url).searchParams.get("q")
}

test("anything else becomes an encoded keyword search", () => {
  const url = buildFeedUrl({ query: '"gas tax" OR "fuel tax" California when:3d' })

  assert.ok(url.startsWith("https://news.google.com/rss/search?q="))
  assert.equal(searchOf(url), '"gas tax" OR "fuel tax" California when:3d')
})

test("commas are dropped, so a comma list is one all-words search", () => {
  assert.equal(
    searchOf(buildFeedUrl({ query: "Gas, Tax, California" })),
    "Gas Tax California when:1d"
  )
  assert.equal(
    searchOf(buildFeedUrl({ query: "Gas Tax California" })),
    "Gas Tax California when:1d"
  )
})

test("the last 24 hours is the default window unless one is written", () => {
  assert.equal(
    searchOf(buildFeedUrl({ query: '"FAIR Plan" when:12h' })),
    '"FAIR Plan" when:12h'
  )
  assert.equal(
    searchOf(buildFeedUrl({ query: '"Klein Lopez" WHEN:7d' })),
    '"Klein Lopez" WHEN:7d'
  )
  assert.equal(
    searchOf(buildFeedUrl({ query: "intitle:Nordblum" })),
    "intitle:Nordblum when:1d"
  )
})

test("prefixes are case-insensitive and X rows are never fetched", () => {
  assert.equal(buildFeedUrl({ query: "rss: https://calmatters.org/feed/" }), "https://calmatters.org/feed/")
  assert.ok(buildFeedUrl({ query: "geo:Malibu" }).includes("/section/geo/Malibu?"))
  assert.equal(buildFeedUrl({ query: 'X:"FAIR Plan" California' }), null)
})

test("an empty or prefix-only query yields nothing to fetch", () => {
  assert.equal(buildFeedUrl({ query: "" }), null)
  assert.equal(buildFeedUrl({ query: "   " }), null)
  assert.equal(buildFeedUrl({ query: "RSS:" }), null)
  assert.equal(buildFeedUrl({ query: "GEO:  " }), null)
  assert.equal(buildFeedUrl({}), null)
})

test("buildFeedRequests skips inactive and unusable rows", () => {
  const requests = buildFeedRequests([
    { keywordId: "K01", query: "gas tax", active: true },
    { keywordId: "K02", query: "prop 13", active: false },
    { keywordId: "K03", query: "", active: true },
  ])

  assert.equal(requests.length, 1)
  assert.equal(requests[0].keyword.keywordId, "K01")
})
