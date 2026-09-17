"use strict"

const { XMLParser } = require("fast-xml-parser")

/**
 * Parser tuned for Google News RSS.
 *
 * `textNodeName: "_"` matters: `<source url="…">Ventura County Star</source>`
 * has both attributes and text, and the outlet fallback reads that text off
 * `_`. `parseTagValue: false` keeps everything a string, so a pubDate or a
 * numeric-looking headline is never silently coerced.
 */
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "_",
  trimValues: true,
  parseTagValue: false,
  parseAttributeValue: false,
  processEntities: true,
})

/**
 * XML string → `{ rss: { channel: { item } } }`.
 *
 * `item` is an object rather than an array when the feed held exactly one
 * entry; callers flatten through `toArray` for that reason.
 *
 * Returns null for anything unparseable, because one broken feed should cost
 * that feed and not the run.
 */
function parseFeed(xml) {
  const text = String(xml ?? "").trim()
  if (!text) return null

  try {
    const parsed = parser.parse(text)
    return parsed?.rss ? parsed : null
  } catch {
    return null
  }
}

module.exports = { parseFeed }
