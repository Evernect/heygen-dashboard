"use strict"

/**
 * Calendar date and clock time in a named zone.
 *
 * `toISOString().slice(0, 10)` is UTC, which is a different calendar day from
 * roughly 4pm Pacific onwards. A 7am Pacific run stamped that way would file
 * itself under tomorrow's date for part of the year and defeat the
 * one-run-per-day key, so every local date in the pipeline comes from here.
 */
function localDateParts(date = new Date(), timeZone = "UTC") {
  const zone = isValidTimeZone(timeZone) ? timeZone : "UTC"

  const localDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)

  const localTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)

  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hour: "numeric",
      hour12: false,
    }).format(date)
  )

  return {
    // en-CA renders as YYYY-MM-DD, which is what the run key wants.
    localDate,
    localTime,
    // 24 is what en-US gives for midnight; the pipeline wants 0.
    hour: hour === 24 ? 0 : hour,
    timeZone: zone,
  }
}

function isValidTimeZone(timeZone) {
  if (!timeZone) return false
  try {
    new Intl.DateTimeFormat("en-US", { timeZone })
    return true
  } catch {
    return false
  }
}

/** "LN-20260917-1" — the human-facing id for one of a day's picks. */
function issueCode(localDate, index) {
  return `LN-${localDate.replace(/-/g, "")}-${index + 1}`
}

module.exports = { localDateParts, isValidTimeZone, issueCode }
