"use strict"

const { XMLParser } = require("fast-xml-parser")

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "_",
  trimValues: true,
  parseTagValue: false,
  parseAttributeValue: false,
  processEntities: true,
})

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
