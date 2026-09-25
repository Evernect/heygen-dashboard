"use strict"

const crypto = require("node:crypto")
const fs = require("node:fs/promises")
const os = require("node:os")
const path = require("node:path")

const { buildAss } = require("./ass-builder")
const {
  DEFAULT_CAPTION_STYLE,
  DEFAULT_CRF,
  DEFAULT_FFMPEG_PRESET,
  DEFAULT_PRESET,
  FONTS_DIR,
} = require("./caption-constants")
const { resolveStyle } = require("./caption-style")
const { burnSubtitles, getVideoDimensions, hasAssFilter } = require("./ffmpeg")
const { isFontAvailable } = require("./font-metrics")
const { parseSrt } = require("./srt")
const { HttpError } = require("../../utils/errors")
const { logger } = require("../../utils/logger")

const JOB_ROOT = path.join(os.tmpdir(), "reelflow-captions")

let queue = Promise.resolve()

function enqueue(task) {
  const result = queue.then(task, task)

  queue = result.then(
    () => undefined,
    () => undefined
  )
  return result
}

async function assertPrerequisites(style) {
  if (!(await hasAssFilter())) {
    throw new HttpError(
      500,
      "The bundled ffmpeg has no `ass` filter, so captions cannot be burned. " +
        "Reinstall ffmpeg-static, or point the pipeline at an ffmpeg build with libass."
    )
  }

  if (!isFontAvailable(style.fontName, style.bold)) {
    throw new HttpError(
      500,
      `The font "${style.fontName}" is not installed in backend/assets/fonts. ` +
        "Run `npm run fonts:check` to see what is missing."
    )
  }
}

async function createJobDir() {
  const jobDir = path.join(JOB_ROOT, crypto.randomUUID())
  await fs.mkdir(jobDir, { recursive: true })
  return jobDir
}

async function removeJobDir(jobDir) {
  await fs.rm(jobDir, { recursive: true, force: true })
}

async function clearJobRoot() {
  await fs.rm(JOB_ROOT, { recursive: true, force: true })
}

async function burnCaptions({
  inputPath,
  outputPath,
  srtText,
  highlights = [],
  preset = DEFAULT_PRESET,
  style: overrides = DEFAULT_CAPTION_STYLE,
  crf = DEFAULT_CRF,
  ffmpegPreset = DEFAULT_FFMPEG_PRESET,
}) {
  const style = resolveStyle(preset, { ...overrides, highlights })

  const cues = parseSrt(srtText)
  if (!cues.length) {
    throw new HttpError(
      422,
      "No cues could be parsed from the subtitle file, so there is nothing to burn."
    )
  }

  await assertPrerequisites(style)

  return enqueue(async () => {
    const assPath = path.join(path.dirname(outputPath), "captions.ass")

    const { width, height } = await getVideoDimensions(inputPath)
    await fs.writeFile(assPath, buildAss(cues, style, width, height), "utf8")

    const startedAt = Date.now()
    await burnSubtitles({
      inputPath,
      assPath,
      outputPath,
      fontsDir: FONTS_DIR,
      crf,
      preset: ffmpegPreset,
    })

    logger.info(
      `Burned ${cues.length} caption cues at ${width}x${height} ` +
        `(${highlights.length} highlighted) in ${Math.round((Date.now() - startedAt) / 1000)}s`
    )
  })
}

module.exports = { burnCaptions, clearJobRoot, createJobDir, removeJobDir }
