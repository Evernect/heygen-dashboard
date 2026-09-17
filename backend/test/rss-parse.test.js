"use strict"

const test = require("node:test")
const assert = require("node:assert/strict")

const { parseFeed } = require("../src/services/news/rss-parse")
const { flattenFeedItems } = require("../src/services/news/article-filter")

const GOOGLE_NEWS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Gas tax - Google News</title>
    <item>
      <title>California raises the gas tax again - Ventura County Star</title>
      <link>https://news.google.com/rss/articles/CBMiqwFBVV95cUx</link>
      <pubDate>Tue, 16 Sep 2026 14:30:00 GMT</pubDate>
      <description>&lt;a href="https://vcstar.com/x"&gt;Sacramento lawmakers voted&lt;/a&gt;</description>
      <source url="https://vcstar.com">Ventura County Star</source>
    </item>
    <item>
      <title>Fuel tax hearing set in Sacramento - KCRA</title>
      <link>https://kcra.com/story</link>
      <pubDate>Tue, 16 Sep 2026 16:00:00 GMT</pubDate>
      <description>California hearing</description>
      <source url="https://kcra.com">KCRA</source>
    </item>
  </channel>
</rss>`

const SINGLE_ITEM_XML = `<?xml version="1.0"?>
<rss version="2.0"><channel>
  <item>
    <title>Only one story about the gas tax here - KTLA</title>
    <link>https://ktla.com/a</link>
    <pubDate>Tue, 16 Sep 2026 15:00:00 GMT</pubDate>
    <description>California</description>
  </item>
</channel></rss>`

test("a Google News feed parses into items", () => {
  const feed = parseFeed(GOOGLE_NEWS_XML)
  const items = feed.rss.channel.item

  assert.equal(items.length, 2)
  assert.equal(
    items[0].title,
    "California raises the gas tax again - Ventura County Star"
  )
})

test("an element with attributes keeps its text on `_`", () => {
  const feed = parseFeed(GOOGLE_NEWS_XML)
  const source = feed.rss.channel.item[0].source

  assert.equal(source._, "Ventura County Star")
  assert.equal(source.url, "https://vcstar.com")
})

test("escaped HTML in a description is decoded, then stripped downstream", () => {
  const feed = parseFeed(GOOGLE_NEWS_XML)
  const description = feed.rss.channel.item[0].description

  assert.ok(description.includes("<a href="))

  const { articles } = flattenFeedItems({
    feed,
    keyword: {
      keywordId: "K01",
      topicLabel: "Gas tax",
      terms: ["gas tax"],
      places: ["vcstar"],
    },
    now: Date.parse("2026-09-16T18:00:00Z"),
  })

  assert.equal(articles.length, 0)
})

test("a one-item feed parses to an object and still flattens", () => {
  const feed = parseFeed(SINGLE_ITEM_XML)
  assert.equal(Array.isArray(feed.rss.channel.item), false)

  const { articles } = flattenFeedItems({
    feed,
    keyword: { keywordId: "K01", topicLabel: "Gas tax", terms: [], places: [] },
    now: Date.parse("2026-09-16T18:00:00Z"),
  })

  assert.equal(articles.length, 1)
  assert.equal(articles[0].outlet, "KTLA")
})

test("junk and empty input return null rather than throwing", () => {
  assert.equal(parseFeed(""), null)
  assert.equal(parseFeed(null), null)
  assert.equal(parseFeed("<html><body>not a feed</body></html>"), null)
})
