"use strict"

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
    localDate,
    localTime,
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

function issueCode(localDate, index) {
  return `LN-${localDate.replace(/-/g, "")}-${index + 1}`
}

module.exports = { localDateParts, isValidTimeZone, issueCode }
