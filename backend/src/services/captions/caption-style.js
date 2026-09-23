"use strict"

const { z } = require("zod")

const {
  ASS_COLOUR_RE,
  FONT_LIBRARY,
  PRESETS,
  VALID_FONT_FAMILIES,
} = require("./caption-constants")
const { HttpError } = require("../../utils/errors")

const FALLBACK_HIGHLIGHT_COLOUR = "&H000000FF"

const assColour = (fallback) =>
  z
    .string()
    .transform((value) => (ASS_COLOUR_RE.test(value) ? value : fallback))

const wordHighlightSchema = z.object({
  word: z
    .string()
    .transform((value) => value.trim())
    .refine(
      (value) => value.length > 0 && value.length <= 60,
      "word must be non-empty and reasonably short"
    ),
  colour: assColour(FALLBACK_HIGHLIGHT_COLOUR).default(FALLBACK_HIGHLIGHT_COLOUR),
})

const captionStyleSchema = z.object({
  font: z.string().nullish().default(null),

  fontName: z
    .string()
    .default("Montserrat Black")
    .refine((value) => VALID_FONT_FAMILIES.has(value), (value) => ({
      message:
        `'${value}' is not an installed font family. Use one of: ` +
        [...VALID_FONT_FAMILIES].sort().join(", "),
    })),
  fontSize: z.number().int().default(26),
  fontSizePct: z.number().nullish().default(null),
  bold: z.boolean().default(false),
  primaryColour: assColour("&H00FFFFFF").default("&H00FFFFFF"),
  outlineColour: assColour("&H00000000").default("&H00000000"),
  outlineWidth: z.number().int().default(2),
  marginV: z.number().int().default(70),
  marginVPct: z.number().nullish().default(null),

  position: z.enum(["top", "middle", "bottom"]).default("bottom"),
  alignment: z.number().int().nullish().default(null),

  textCase: z.enum(["upper", "title", "none"]).default("upper"),
  maxWordsPerLine: z.number().int().default(3),
  fadeMs: z.number().int().default(120),

  lineSpacingPx: z.number().int().nullish().default(null),

  backgroundBox: z.boolean().default(false),
  backgroundColour: assColour("&HB0000000").default("&HB0000000"),

  highlights: z.array(z.unknown()).default([]),
  highlightWords: z.array(z.string()).default([]),
  highlightColour: assColour(FALLBACK_HIGHLIGHT_COLOUR).default(FALLBACK_HIGHLIGHT_COLOUR),
  useDefaultNegations: z.boolean().default(false),

  randomHighlightColour: z.boolean().default(false),
  highlightGlow: z.number().int().default(0),
  highlightScalePct: z.number().int().default(130),
  highlightNoOutline: z.boolean().default(true),
  highlightStyle: z.enum(["text_colour", "pill"]).default("text_colour"),
  pillPaddingX: z.number().int().default(12),
  pillPaddingY: z.number().int().default(6),
  pillTextColour: assColour("&H00FFFFFF").default("&H00FFFFFF"),
})

function resolveStyle(preset, overrides = {}) {
  const merged = { ...(PRESETS[preset] ?? {}), ...overrides }

  if (merged.font) {
    const entry = FONT_LIBRARY[merged.font]
    if (!entry) {
      throw new HttpError(
        422,
        `'${merged.font}' is not a known font key. Valid options: ` +
          Object.keys(FONT_LIBRARY).sort().join(", ")
      )
    }
    const [family, bold] = entry
    merged.fontName = family
    merged.bold = bold
  }

  const parsed = captionStyleSchema.safeParse(merged)
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "style"}: ${issue.message}`)
      .join("; ")
    throw new HttpError(422, `Invalid caption style: ${detail}`)
  }

  return parsed.data
}

module.exports = {
  FALLBACK_HIGHLIGHT_COLOUR,
  captionStyleSchema,
  resolveStyle,
  wordHighlightSchema,
}
