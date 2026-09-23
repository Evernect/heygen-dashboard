"use strict"

const fs = require("node:fs/promises")
const path = require("node:path")

const { FONTS_DIR } = require("../src/services/captions/caption-constants")

const GOOGLE = "https://github.com/google/fonts/raw/main/ofl"
const MONTSERRAT = "https://github.com/JulietaUla/Montserrat/raw/master/fonts/ttf"
const NOTO = "https://github.com/notofonts/notofonts.github.io/raw/main/fonts"

const MONTSERRAT_WEIGHTS = [
  "Thin", "ExtraLight", "Light", "Regular",
  "Medium", "SemiBold", "Bold", "ExtraBold", "Black",
]

const ALTERNATES_WEIGHTS = ["Regular", "SemiBold", "Bold", "ExtraBold", "Black"]

const SOURCES = {
  "Poppins-ExtraBold.ttf": `${GOOGLE}/poppins/Poppins-ExtraBold.ttf`,

  ...Object.fromEntries(
    MONTSERRAT_WEIGHTS.map((weight) => [
      `Montserrat-${weight}.ttf`,
      `${MONTSERRAT}/Montserrat-${weight}.ttf`,
    ])
  ),

  ...Object.fromEntries(
    ALTERNATES_WEIGHTS.map((weight) => [
      `MontserratAlternates-${weight}.ttf`,
      `${GOOGLE}/montserratalternates/MontserratAlternates-${weight}.ttf`,
    ])
  ),

  "NotoSans-Regular.ttf": `${NOTO}/NotoSans/hinted/ttf/NotoSans-Regular.ttf`,
  "NotoSans-Bold.ttf": `${NOTO}/NotoSans/hinted/ttf/NotoSans-Bold.ttf`,
  "NotoSerif-Regular.ttf": `${NOTO}/NotoSerif/hinted/ttf/NotoSerif-Regular.ttf`,
  "NotoSerif-Bold.ttf": `${NOTO}/NotoSerif/hinted/ttf/NotoSerif-Bold.ttf`,
}

const LICENCES = {
  "OFL-Poppins.txt": `${GOOGLE}/poppins/OFL.txt`,
  "OFL-Montserrat.txt": `${GOOGLE}/montserrat/OFL.txt`,
  "OFL-MontserratAlternates.txt": `${GOOGLE}/montserratalternates/OFL.txt`,
  "OFL-Noto.txt": `${GOOGLE}/notosans/OFL.txt`,
}

const TTF_MAGIC = [0x00010000, 0x74727565] // "sfnt" and "true"

function looksLikeTtf(buffer) {
  return buffer.length > 4 && TTF_MAGIC.includes(buffer.readUInt32BE(0))
}

async function exists(file) {
  try {
    await fs.access(file)
    return true
  } catch {
    return false
  }
}

async function download(name, url, { force, verify }) {
  const dest = path.join(FONTS_DIR, name)

  if (!force && (await exists(dest))) {
    return { name, status: "skipped" }
  }

  try {
    const response = await fetch(url, { redirect: "follow" })
    if (!response.ok) {
      return { name, status: "failed", detail: `HTTP ${response.status}` }
    }

    const buffer = Buffer.from(await response.arrayBuffer())

    if (verify && !looksLikeTtf(buffer)) {
      return { name, status: "failed", detail: "not a TrueType file" }
    }

    await fs.writeFile(dest, buffer)
    return { name, status: "installed", detail: `${Math.round(buffer.length / 1024)} KB` }
  } catch (error) {
    return { name, status: "failed", detail: error.message }
  }
}

async function main() {
  const force = process.argv.includes("--force")

  await fs.mkdir(FONTS_DIR, { recursive: true })
  console.log(`Installing caption fonts into ${FONTS_DIR}\n`)

  const results = []
  
  for (const [name, url] of Object.entries(SOURCES)) {
    const result = await download(name, url, { force, verify: true })
    results.push(result)
    console.log(
      `  ${result.status.padEnd(10)} ${name}${result.detail ? `  (${result.detail})` : ""}`
    )
  }

  for (const [name, url] of Object.entries(LICENCES)) {
    await download(name, url, { force, verify: false })
  }

  const failed = results.filter((r) => r.status === "failed")
  const installed = results.filter((r) => r.status === "installed").length
  const skipped = results.filter((r) => r.status === "skipped").length

  console.log(
    `\n${installed} installed, ${skipped} already present, ${failed.length} failed.`
  )

  if (failed.length) {
    console.error(
      "\nThese could not be fetched. They are also in the caption-burner " +
        "container, if it is easier to copy them out:\n" +
        "  docker cp <container>:/usr/share/fonts/truetype/montserrat/. backend/assets/fonts/\n" +
        "  docker cp <container>:/usr/share/fonts/truetype/noto/. backend/assets/fonts/"
    )
    process.exit(1)
  }

  console.log("Run `npm run fonts:check` to confirm the configured style is ready.")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
