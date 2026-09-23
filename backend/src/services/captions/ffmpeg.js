"use strict"

const { execFile } = require("node:child_process")
const { promisify } = require("node:util")

const ffmpegPath = require("ffmpeg-static")
const { path: ffprobePath } = require("@ffprobe-installer/ffprobe")

const { HttpError } = require("../../utils/errors")

const execFileAsync = promisify(execFile)

const FALLBACK_DIMENSIONS = { width: 1080, height: 1920 }

const STDERR_TAIL = 2000

const MAX_BUFFER = 8 * 1024 * 1024

function escapeFilterPath(value) {
  return value
    .replace(/\\/g, "/")
    .replace(/[:'[\],;]/g, (char) => `\\\\${char}`)
}

async function getVideoDimensions(videoPath) {
  try {
    const { stdout } = await execFileAsync(ffprobePath, [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=width,height",
      "-of", "csv=p=0",
      videoPath,
    ])

    const [width, height] = stdout.trim().split(",").map(Number)

    if (!Number.isFinite(width) || !Number.isFinite(height) || !width || !height) {
      return FALLBACK_DIMENSIONS
    }

    return { width, height }
  } catch {
    return FALLBACK_DIMENSIONS
  }
}

async function burnSubtitles({
  inputPath,
  assPath,
  outputPath,
  fontsDir,
  crf,
  preset,
}) {
  const filter =
    `ass=${escapeFilterPath(assPath)}` +
    (fontsDir ? `:fontsdir=${escapeFilterPath(fontsDir)}` : "")

  const args = [
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    "-i", inputPath,
    "-vf", filter,
    "-c:v", "libx264",
    "-crf", String(crf),
    "-preset", preset,
    "-c:a", "copy",
    "-movflags", "+faststart",
    outputPath,
  ]

  try {
    await execFileAsync(ffmpegPath, args, { maxBuffer: MAX_BUFFER })
  } catch (error) {
    const stderr = String(error.stderr ?? error.message ?? "").slice(-STDERR_TAIL)
    throw new HttpError(500, `ffmpeg failed: ${stderr.trim() || "unknown error"}`)
  }
}

let assFilterAvailable = null

async function hasAssFilter() {
  if (assFilterAvailable !== null) return assFilterAvailable

  try {
    const { stdout } = await execFileAsync(ffmpegPath, ["-hide_banner", "-filters"], {
      maxBuffer: MAX_BUFFER,
    })
    assFilterAvailable = /^\s*\S+\s+ass\s/m.test(stdout)
  } catch {
    assFilterAvailable = false
  }

  return assFilterAvailable
}

module.exports = {
  burnSubtitles,
  escapeFilterPath,
  ffmpegPath,
  ffprobePath,
  getVideoDimensions,
  hasAssFilter,
}
