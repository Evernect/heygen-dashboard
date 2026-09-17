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

test("anything else becomes an encoded keyword search", () => {
  const url = buildFeedUrl({ query: '(gas tax OR "fuel tax") California when:1d' })

  assert.ok(url.startsWith("https://news.google.com/rss/search?q="))
  assert.ok(url.includes("%22fuel%20tax%22"))
  assert.ok(url.includes("when%3A1d"))
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
