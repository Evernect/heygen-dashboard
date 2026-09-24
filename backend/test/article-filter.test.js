"use strict"

const test = require("node:test")
const assert = require("node:assert/strict")

const {
  splitGoogleNewsTitle,
  matchesRelevance,
  flattenFeedItems,
  stripHtml,
} = require("../src/services/news/article-filter")

const NOW = Date.parse("2026-09-17T12:00:00Z")
const hoursAgo = (h) => new Date(NOW - h * 3600 * 1000).toUTCString()

const KEYWORD = {
  keywordId: "K01",
  topicLabel: "Gas tax",
  scope: "state",
  type: "issue",
  priority: 5,
  terms: ["gas tax", "fuel tax"],
  places: ["California", "Sacramento"],
}

function feedWith(items) {
  return { rss: { channel: { item: items } } }
}

test("a title splits on the last ' - ' into headline and outlet", () => {
  const { title, outlet } = splitGoogleNewsTitle(
    "California lawmakers move on the gas tax - Ventura County Star"
  )

  assert.equal(title, "California lawmakers move on the gas tax")
  assert.equal(outlet, "Ventura County Star")
})

test("a short headline keeps its dash rather than being cut in half", () => {
  const { title, outlet } = splitGoogleNewsTitle("Gas - tax", { _: "KTLA" })

  assert.equal(title, "Gas - tax")
  assert.equal(outlet, "KTLA")
})

test("the feed's own source element is the fallback outlet", () => {
  const { outlet } = splitGoogleNewsTitle("A headline with no outlet suffix", {
    _: "Los Angeles Times",
  })

  assert.equal(outlet, "Los Angeles Times")
})

test("relevance needs one term AND one place", () => {
  const terms = KEYWORD.terms
  const places = KEYWORD.places

  assert.equal(matchesRelevance("Gas tax rises in California", terms, places), true)
  assert.equal(matchesRelevance("Gas tax rises in Texas", terms, places), false)
  assert.equal(matchesRelevance("California housing bill", terms, places), false)
})

test("an empty list means that half is unconstrained", () => {
  assert.equal(matchesRelevance("anything at all", [], []), true)
  assert.equal(matchesRelevance("Gas tax in Texas", ["gas tax"], []), true)
})

test("tags are stripped before matching, so a URL cannot satisfy a place", () => {
  assert.equal(
    stripHtml('<a href="https://california.example.com/x">Texas budget</a>').includes(
      "california"
    ),
    false
  )
})

test("flatten keeps fresh, on-topic articles and counts the rest", () => {
  const { articles, found, stale, offTopic } = flattenFeedItems({
    feed: feedWith([
      {
        title: "California raises the gas tax again - Ventura County Star",
        description: "<p>Sacramento lawmakers voted Tuesday.</p>",
        link: "https://vcstar.com/a",
        pubDate: hoursAgo(3),
      },
      {
        title: "California gas tax debate opens - LA Times",
        description: "Sacramento.",
        link: "https://latimes.com/b",
        pubDate: hoursAgo(50),
      },
      {
        title: "California beach cleanup draws a crowd - KTLA",
        description: "Sacramento volunteers.",
        link: "https://ktla.com/c",
        pubDate: hoursAgo(2),
      },
    ]),
    keyword: KEYWORD,
    now: NOW,
  })

  assert.equal(found, 3)
  assert.equal(stale, 1)
  assert.equal(offTopic, 1)
  assert.equal(articles.length, 1)

  assert.deepEqual(
    {
      title: articles[0].title,
      outlet: articles[0].outlet,
      keywordId: articles[0].keywordId,
      priority: articles[0].priority,
    },
    {
      title: "California raises the gas tax again",
      outlet: "Ventura County Star",
      keywordId: "K01",
      priority: 5,
    }
  )
})

test("opinion pieces are dropped as off-topic", () => {
  const { articles, offTopic } = flattenFeedItems({
    feed: feedWith([
      {
        title: "Opinion: California's gas tax is too high - LA Times",
        description: "Sacramento",
        link: "https://latimes.com/op",
        pubDate: hoursAgo(1),
      },
      {
        title: "Op-ed: Sacramento must pause the gas tax - KCRA",
        description: "California",
        link: "https://kcra.com/op",
        pubDate: hoursAgo(1),
      },
    ]),
    keyword: KEYWORD,
    now: NOW,
  })

  assert.equal(articles.length, 0)
  assert.equal(offTopic, 2)
})

test("a single-item feed is not mistaken for an empty one", () => {
  const { articles } = flattenFeedItems({
    feed: feedWith({
      title: "Sacramento moves on the gas tax today - KCRA",
      description: "California",
      link: "https://kcra.com/a",
      pubDate: hoursAgo(1),
    }),
    keyword: KEYWORD,
    now: NOW,
  })

  assert.equal(articles.length, 1)
})

test("an empty feed produces nothing rather than throwing", () => {
  const { articles, found } = flattenFeedItems({
    feed: { rss: { channel: {} } },
    keyword: KEYWORD,
    now: NOW,
  })

  assert.equal(articles.length, 0)
  assert.equal(found, 0)
})
