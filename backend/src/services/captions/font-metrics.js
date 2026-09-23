"use strict"

const fs = require("node:fs")

const opentype = require("opentype.js")

const { fontPath } = require("./caption-constants")
const { logger } = require("../../utils/logger")

const faceCache = new Map()

function loadFace(fontName, bold) {
  const key = `${fontName}\u0000${Boolean(bold)}`
  if (faceCache.has(key)) return faceCache.get(key)

  const file = fontPath(fontName, bold)
  let face = null

  if (file && fs.existsSync(file)) {
    try {
      face = opentype.loadSync(file)
    } catch (error) {
      logger.warn(`Could not parse font ${file}: ${error.message}`)
    }
  } else {
    logger.warn(
      `Font file for "${fontName}"${bold ? " (bold)" : ""} is missing. ` +
        "Falling back to estimated metrics; run `npm run fonts:check`."
    )
  }

  faceCache.set(key, face)
  return face
}

function getFontAscentDescent(fontName, bold, fontSizePx) {
  const face = loadFace(fontName, bold)

  if (!face) {
    return [Math.trunc(fontSizePx * 0.8), Math.trunc(fontSizePx * 0.2)]
  }

  const scale = fontSizePx / face.unitsPerEm
  return [
    Math.round(face.ascender * scale),
    Math.round(Math.abs(face.descender) * scale),
  ]
}

function measureTextWidth(text, fontName, bold, fontSizePx) {
  const face = loadFace(fontName, bold)

  if (!face) {
    return Math.trunc(text.length * fontSizePx * 0.58)
  }

  return Math.trunc(face.getAdvanceWidth(text, fontSizePx, { kerning: true }))
}

function isFontAvailable(fontName, bold) {
  const file = fontPath(fontName, bold)
  return Boolean(file && fs.existsSync(file))
}

module.exports = {
  getFontAscentDescent,
  isFontAvailable,
  measureTextWidth,
}
