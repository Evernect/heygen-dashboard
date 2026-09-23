"use strict"

const path = require("node:path")

const FONTS_DIR = path.join(__dirname, "..", "..", "..", "assets", "fonts")

const ASS_COLOUR_RE = /^&H[0-9A-Fa-f]{8}$/

const POSITION_MAP = { top: 8, middle: 5, bottom: 2 }

const DEFAULT_NEGATION_WORDS = [
  "not", "never", "no", "none", "nothing", "nobody", "nowhere", "neither",
  "nor", "without", "cannot", "can't", "won't", "don't", "doesn't",
  "didn't", "isn't", "aren't", "wasn't", "weren't", "haven't", "hasn't",
  "hadn't", "shouldn't", "wouldn't", "couldn't",
]

const HIGHLIGHT_COLOUR_PALETTE = [
  "&H000000FF", // pure red
  "&H000078FF", // electric orange
  "&H0000D7FF", // bright gold-yellow
  "&H009314FF", // hot pink / magenta
  "&H00FFFF00", // electric cyan
  "&H0032FF32", // vivid lime green
  "&H00FF32B4", // vivid violet
]

const FONT_LIBRARY = {
  "montserrat-thin": ["Montserrat Thin", false],
  "montserrat-extralight": ["Montserrat ExtraLight", false],
  "montserrat-light": ["Montserrat Light", false],
  "montserrat-regular": ["Montserrat", false],
  "montserrat-medium": ["Montserrat Medium", false],
  "montserrat-semibold": ["Montserrat SemiBold", false],
  "montserrat-bold": ["Montserrat", true],
  "montserrat-extrabold": ["Montserrat ExtraBold", false],
  "montserrat-black": ["Montserrat Black", false],
  "montserrat-alternates-regular": ["Montserrat Alternates", false],
  "montserrat-alternates-bold": ["Montserrat Alternates", true],
  "montserrat-alternates-semibold": ["Montserrat Alternates SemiBold", false],
  "montserrat-alternates-extrabold": ["Montserrat Alternates ExtraBold", false],
  "montserrat-alternates-black": ["Montserrat Alternates Black", false],
  "poppins-extrabold": ["Poppins ExtraBold", false],
  "noto-sans": ["Noto Sans", false],
  "noto-sans-bold": ["Noto Sans", true],
  "noto-serif": ["Noto Serif", false],
  "noto-serif-bold": ["Noto Serif", true],
}

const VALID_FONT_FAMILIES = new Set(
  Object.values(FONT_LIBRARY).map(([family]) => family)
)

const FONT_FILES = new Map([
  ["Montserrat Thin\u0000false", "Montserrat-Thin.ttf"],
  ["Montserrat ExtraLight\u0000false", "Montserrat-ExtraLight.ttf"],
  ["Montserrat Light\u0000false", "Montserrat-Light.ttf"],
  ["Montserrat\u0000false", "Montserrat-Regular.ttf"],
  ["Montserrat Medium\u0000false", "Montserrat-Medium.ttf"],
  ["Montserrat SemiBold\u0000false", "Montserrat-SemiBold.ttf"],
  ["Montserrat\u0000true", "Montserrat-Bold.ttf"],
  ["Montserrat ExtraBold\u0000false", "Montserrat-ExtraBold.ttf"],
  ["Montserrat Black\u0000false", "Montserrat-Black.ttf"],
  ["Montserrat Alternates\u0000false", "MontserratAlternates-Regular.ttf"],
  ["Montserrat Alternates\u0000true", "MontserratAlternates-Bold.ttf"],
  ["Montserrat Alternates SemiBold\u0000false", "MontserratAlternates-SemiBold.ttf"],
  ["Montserrat Alternates ExtraBold\u0000false", "MontserratAlternates-ExtraBold.ttf"],
  ["Montserrat Alternates Black\u0000false", "MontserratAlternates-Black.ttf"],
  ["Poppins ExtraBold\u0000false", "Poppins-ExtraBold.ttf"],
  ["Noto Sans\u0000false", "NotoSans-Regular.ttf"],
  ["Noto Sans\u0000true", "NotoSans-Bold.ttf"],
  ["Noto Serif\u0000false", "NotoSerif-Regular.ttf"],
  ["Noto Serif\u0000true", "NotoSerif-Bold.ttf"],
])

function fontPath(fontName, bold) {
  const file = FONT_FILES.get(`${fontName}\u0000${Boolean(bold)}`)
  return file ? path.join(FONTS_DIR, file) : null
}

const PRESETS = {
  ramsey: {
    fontName: "Montserrat Black", fontSize: 26,
    primaryColour: "&H00FFFFFF", outlineColour: "&H00000000",
    outlineWidth: 3, bold: false, position: "bottom",
    marginV: 90, textCase: "upper", maxWordsPerLine: 3,
    fadeMs: 120, backgroundBox: false,
  },
  capcut: {
    fontName: "Montserrat Black", fontSize: 24,
    primaryColour: "&H00FFFFFF", outlineColour: "&H00000000",
    outlineWidth: 2, bold: false, position: "middle",
    marginV: 0, textCase: "upper", maxWordsPerLine: 3,
    fadeMs: 150, backgroundBox: false,
  },
  clean: {
    fontName: "Montserrat", fontSize: 22,
    primaryColour: "&H00FFFFFF", outlineColour: "&H00000000",
    outlineWidth: 2, bold: false, position: "bottom",
    marginV: 70, textCase: "title", maxWordsPerLine: 6,
    fadeMs: 0, backgroundBox: false,
  },
  boxed: {
    fontName: "Montserrat Black", fontSize: 24,
    primaryColour: "&H00FFFFFF", outlineColour: "&H00000000",
    outlineWidth: 0, bold: false, position: "bottom",
    marginV: 80, textCase: "upper", maxWordsPerLine: 4,
    fadeMs: 100, backgroundBox: true, backgroundColour: "&HB0000000",
  },
  soft: {
    fontName: "Montserrat SemiBold", fontSize: 26,
    primaryColour: "&H00FFFFFF", outlineColour: "&H00000000",
    outlineWidth: 1, bold: false, position: "bottom",
    marginV: 90, textCase: "upper", maxWordsPerLine: 3,
    fadeMs: 120, backgroundBox: false,
  },
}

const PRESET_NAMES = Object.keys(PRESETS)

const DEFAULT_PRESET = "ramsey"

const DEFAULT_CAPTION_STYLE = {
  font: "poppins-extrabold",
  fontSizePct: 6.0,
  outlineWidth: 5,
  lineSpacingPx: 45,
  position: "bottom",
  marginVPct: 25.0,
  highlightStyle: "text_colour",
  highlightNoOutline: false,
  highlightScalePct: 100,
}

const DEFAULT_CRF = 18
const DEFAULT_FFMPEG_PRESET = "medium"

module.exports = {
  ASS_COLOUR_RE,
  DEFAULT_CAPTION_STYLE,
  DEFAULT_CRF,
  DEFAULT_FFMPEG_PRESET,
  DEFAULT_NEGATION_WORDS,
  DEFAULT_PRESET,
  FONTS_DIR,
  FONT_FILES,
  FONT_LIBRARY,
  HIGHLIGHT_COLOUR_PALETTE,
  POSITION_MAP,
  PRESETS,
  PRESET_NAMES,
  VALID_FONT_FAMILIES,
  fontPath,
}
