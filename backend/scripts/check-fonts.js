"use strict"

const fs = require("node:fs")
const path = require("node:path")

const {
  DEFAULT_CAPTION_STYLE,
  FONTS_DIR,
  FONT_FILES,
  FONT_LIBRARY,
} = require("../src/services/captions/caption-constants")

const [defaultFamily] = FONT_LIBRARY[DEFAULT_CAPTION_STYLE.font] ?? []

const wanted = [...new Set(FONT_FILES.values())].sort()
const present = wanted.filter((file) => fs.existsSync(path.join(FONTS_DIR, file)))
const missing = wanted.filter((file) => !present.includes(file))

const required = FONT_FILES.get(`${defaultFamily}\u0000false`)

console.log(`Fonts directory: ${FONTS_DIR}`)
console.log(`Present: ${present.length}/${wanted.length}`)

if (missing.length) {
  console.log("\nMissing:")
  for (const file of missing) console.log(`  - ${file}`)

  console.log(
    "\nFetch them with:\n  npm run fonts:install\n" +
      "\nOnly the fonts a style actually names are needed; the rest are optional."
  )
}

if (required && missing.includes(required)) {
  console.error(
    `\nThe configured default style uses "${defaultFamily}" (${required}), which is missing. ` +
      "Renders will fail until it is in place."
  )
  process.exit(1)
}

console.log(`\nThe default caption style ("${defaultFamily}") is ready.`)
