"use strict"

const SRT_CUE_RE =
  /(\d+)\s*\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})\s*\n(.*?)(?=\n\s*\n|$)/gs

function normaliseSrt(srtText) {
  return srtText.replace(/^﻿/, "").replace(/\r\n?/g, "\n")
}

function parseSrt(srtText) {
  const cues = []

  for (const match of normaliseSrt(srtText).matchAll(SRT_CUE_RE)) {
    const [, idx, start, end, text] = match
    cues.push({ idx, start, end, text: text.trim() })
  }

  return cues
}

function srtTimeToAss(timestamp) {
  const [h, m, rest] = timestamp.split(":")
  const [s, ms] = rest.split(",")
  const cs = Math.floor(Number(ms) / 10)
  return `${Number(h)}:${m}:${s}.${String(cs).padStart(2, "0")}`
}

function rewrap(text, maxWords) {
  if (!maxWords || maxWords <= 0) return text

  const words = text.trim() ? text.trim().split(/\s+/) : []
  const lines = []
  for (let i = 0; i < words.length; i += maxWords) {
    lines.push(words.slice(i, i + maxWords).join(" "))
  }

  return lines.join("\\N")
}

function applyCase(text, mode) {
  if (mode === "upper") return text.toUpperCase()

  if (mode === "title") {
    let previousIsLetter = false
    let out = ""

    for (const char of text) {
      const isLetter = /\p{L}/u.test(char)
      out += previousIsLetter ? char.toLowerCase() : char.toUpperCase()
      previousIsLetter = isLetter
    }

    return out
  }

  return text
}

module.exports = { applyCase, normaliseSrt, parseSrt, rewrap, srtTimeToAss }
