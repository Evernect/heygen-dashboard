"use strict"

const test = require("node:test")
const assert = require("node:assert/strict")

const {
  defaultType,
  defaultTopicLabel,
} = require("../src/services/news/keyword-rules")

test("the default type follows the query's prefix", () => {
  assert.equal(defaultType("RSS:https://calmatters.org/feed/"), "feed")
  assert.equal(defaultType("GEO:Thousand Oaks"), "geo")
  assert.equal(defaultType('"gas tax" California'), "issue")
})

test("the default label is the query without its prefix or commas", () => {
  assert.equal(defaultTopicLabel("Gas, Tax, California"), "Gas Tax California")
  assert.equal(defaultTopicLabel("GEO:Thousand Oaks"), "Thousand Oaks")
  assert.equal(
    defaultTopicLabel("RSS:https://calmatters.org/feed/"),
    "https://calmatters.org/feed/"
  )
  assert.equal(defaultTopicLabel("x".repeat(80)).length, 60)
})
