"use strict"

const test = require("node:test")
const assert = require("node:assert/strict")

const { localDateParts, issueCode } = require("../src/utils/timezone")

const PT = "America/Los_Angeles"

test("7am Pacific in summer is 14:00 UTC", () => {
  const { localDate, localTime, hour } = localDateParts(
    new Date("2026-09-17T14:00:00Z"),
    PT
  )

  assert.equal(localDate, "2026-09-17")
  assert.equal(localTime, "07:00")
  assert.equal(hour, 7)
})

test("7am Pacific in winter is 15:00 UTC", () => {
  const { localDate, hour } = localDateParts(
    new Date("2026-12-17T15:00:00Z"),
    PT
  )

  assert.equal(localDate, "2026-12-17")
  assert.equal(hour, 7)
})

test("the winter UTC hour is not 7am Pacific in summer", () => {
  const { hour } = localDateParts(new Date("2026-09-17T15:00:00Z"), PT)
  assert.equal(hour, 8)
})

test("late evening Pacific is still the same local day", () => {
  const utc = new Date("2026-09-18T00:30:00Z")

  assert.equal(localDateParts(utc, PT).localDate, "2026-09-17")
  assert.equal(utc.toISOString().slice(0, 10), "2026-09-18")
})

test("midnight reports hour 0, not 24", () => {
  const { hour } = localDateParts(new Date("2026-09-17T07:00:00Z"), PT)
  assert.equal(hour, 0)
})

test("an unknown zone falls back to UTC instead of throwing", () => {
  const { localDate, timeZone } = localDateParts(
    new Date("2026-09-17T14:00:00Z"),
    "Mars/Olympus_Mons"
  )

  assert.equal(timeZone, "UTC")
  assert.equal(localDate, "2026-09-17")
})

test("issue codes are stable and one-based", () => {
  assert.equal(issueCode("2026-09-17", 0), "LN-20260917-1")
  assert.equal(issueCode("2026-09-17", 2), "LN-20260917-3")
})
