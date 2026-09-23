"use strict"

const {
  DEFAULT_NEGATION_WORDS,
  HIGHLIGHT_COLOUR_PALETTE,
  POSITION_MAP,
} = require("./caption-constants")
const { FALLBACK_HIGHLIGHT_COLOUR, wordHighlightSchema } = require("./caption-style")
const { getFontAscentDescent, measureTextWidth } = require("./font-metrics")
const { applyCase, rewrap, srtTimeToAss } = require("./srt")

const ASS_LINE_BREAK = "\\N"

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function applyHighlights(
  text,
  highlights,
  baseColour,
  glow,
  scalePct,
  removeOutline,
  outlineWidth
) {
  if (!highlights.length) return text

  const glowTag = glow > 0 ? `\\blur${glow}` : ""
  const scaleTag = scalePct !== 100 ? `\\fscx${scalePct}\\fscy${scalePct}` : ""
  const resetScaleTag = scalePct !== 100 ? "\\fscx100\\fscy100" : ""
  const bordTag = removeOutline ? "\\bord0" : ""
  const resetBordTag = removeOutline ? `\\bord${outlineWidth}` : ""

  const ordered = [...highlights].sort((a, b) => b.word.length - a.word.length)

  let result = text
  for (const highlight of ordered) {
    const pattern = new RegExp(`\\b(${escapeRegExp(highlight.word)})\\b`, "gi")
    result = result.replace(
      pattern,
      (match) =>
        `{\\c${highlight.colour}${glowTag}${scaleTag}${bordTag}}${match}` +
        `{\\c${baseColour}\\blur0${resetScaleTag}${resetBordTag}}`
    )
  }

  return result
}

function resolveHighlights(style) {
  const combined = []

  for (const raw of style.highlights) {
    const parsed = wordHighlightSchema.safeParse(raw)
    if (parsed.success) combined.push({ ...parsed.data })
  }

  for (const word of style.highlightWords) {
    const parsed = wordHighlightSchema.safeParse({
      word,
      colour: style.highlightColour,
    })
    if (parsed.success) combined.push({ ...parsed.data })
  }

  if (style.useDefaultNegations) {
    for (const word of DEFAULT_NEGATION_WORDS) {
      combined.push({ word, colour: style.highlightColour })
    }
  }

  if (style.randomHighlightColour && combined.length) {
    const chosen =
      HIGHLIGHT_COLOUR_PALETTE[
        Math.floor(Math.random() * HIGHLIGHT_COLOUR_PALETTE.length)
      ]
    for (const highlight of combined) highlight.colour = chosen
  }

  return combined
}

function buildPillEvents({
  lineText,
  lineIndex,
  totalLines,
  highlights,
  style,
  fontSize,
  playW,
  playH,
  start,
  end,
}) {
  const highlightMap = new Map(
    highlights.map((highlight) => [highlight.word.toLowerCase(), highlight.colour])
  )
  const tokens = lineText.split(" ")

  const widths = tokens.map((token) =>
    measureTextWidth(token, style.fontName, style.bold, fontSize)
  )
  const spaceW = measureTextWidth(" ", style.fontName, style.bold, fontSize)
  const totalLineW = tokens.length
    ? widths.reduce((sum, width) => sum + width, 0) + spaceW * (tokens.length - 1)
    : 0

  const lineHeight = Math.trunc(fontSize * 0.82)
  const blockHeight = lineHeight * totalLines
  const bottomFudge = 6

  let blockTop
  if (style.alignment === 8 || (style.alignment == null && style.position === "top")) {
    blockTop = style.marginV
  } else if (
    style.alignment === 5 ||
    (style.alignment == null && style.position === "middle")
  ) {
    blockTop = Math.floor((playH - blockHeight) / 2)
  } else {
    blockTop = playH - style.marginV - blockHeight - bottomFudge
  }

  const lineTop = blockTop + lineIndex * lineHeight
  const lineLeft = Math.floor((playW - totalLineW) / 2)

  const events = []
  let cursorX = lineLeft

  tokens.forEach((token, index) => {
    const width = widths[index]
    const cleanToken = token.replace(/[^\w'-]/g, "").toLowerCase()

    if (highlightMap.has(cleanToken)) {
      const colour = highlightMap.get(cleanToken)
      const [ascent, descent] = getFontAscentDescent(
        style.fontName,
        style.bold,
        fontSize
      )

      const boxX1 = cursorX - style.pillPaddingX
      const boxY1 = lineTop - style.pillPaddingY
      const boxX2 = cursorX + width + style.pillPaddingX
      const boxY2 = lineTop + ascent + descent + style.pillPaddingY
      const boxW = boxX2 - boxX1
      const boxH = boxY2 - boxY1
      const radius = Math.min(Math.floor(boxH / 3), 14)

      const draw =
        `m ${radius} 0 l ${boxW - radius} 0 ` +
        `b ${boxW} 0 ${boxW} 0 ${boxW} ${radius} ` +
        `l ${boxW} ${boxH - radius} ` +
        `b ${boxW} ${boxH} ${boxW} ${boxH} ${boxW - radius} ${boxH} ` +
        `l ${radius} ${boxH} ` +
        `b 0 ${boxH} 0 ${boxH} 0 ${boxH - radius} ` +
        `l 0 ${radius} ` +
        `b 0 0 0 0 ${radius} 0`

      events.push(
        `Dialogue: 0,${start},${end},Default,,0,0,0,,` +
          `{\\an7\\pos(${boxX1},${boxY1})\\c${colour}\\bord0\\shad0\\p1}${draw}{\\p0}`
      )
    }

    cursorX += width + spaceW
  })

  return events
}

function lineY({ lineIndex, totalLines, alignment, marginV, lineSpacingPx, playH }) {
  if ([7, 8, 9].includes(alignment)) {
    return marginV + lineIndex * lineSpacingPx
  }

  if ([4, 5, 6].includes(alignment)) {
    const totalHeight = totalLines * lineSpacingPx
    const blockTop = Math.floor((playH - totalHeight) / 2)
    return blockTop + lineIndex * lineSpacingPx
  }

  const linesBelow = totalLines - 1 - lineIndex
  return playH - marginV - linesBelow * lineSpacingPx
}

function anForAlignment(alignment) {
  if ([7, 8, 9].includes(alignment)) return 8
  if ([4, 5, 6].includes(alignment)) return 5
  return 2
}

function buildStyleLine(style, fontSize, marginV, alignment) {
  const bold = style.bold ? -1 : 0

  if (style.backgroundBox) {
    return (
      `Style: Default,${style.fontName},${fontSize},${style.primaryColour},${style.primaryColour},` +
      `${style.outlineColour},${style.backgroundColour},${bold},0,0,0,100,100,0,0,` +
      `3,6,0,${alignment},10,10,${marginV},1`
    )
  }

  return (
    `Style: Default,${style.fontName},${fontSize},${style.primaryColour},${style.primaryColour},` +
    `${style.outlineColour},&H00000000,${bold},0,0,0,100,100,0,0,` +
    `1,${style.outlineWidth},0,${alignment},10,10,${marginV},1`
  )
}

function buildAss(cues, style, playW, playH) {
  const alignment = style.alignment ?? POSITION_MAP[style.position]
  const highlights = resolveHighlights(style)

  const effectiveFontSize = style.fontSizePct
    ? Math.round(playH * (style.fontSizePct / 100))
    : style.fontSize
  const effectiveMarginV = style.marginVPct
    ? Math.round(playH * (style.marginVPct / 100))
    : style.marginV

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${playW}
PlayResY: ${playH}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
${buildStyleLine(style, effectiveFontSize, effectiveMarginV, alignment)}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`

  const fadeTag = style.fadeMs > 0 ? `{\\fad(${style.fadeMs},${style.fadeMs})}` : ""
  const cx = Math.floor(playW / 2)
  const an = anForAlignment(alignment)

  const lines = []

  for (const cue of cues) {
    const text = rewrap(applyCase(cue.text, style.textCase), style.maxWordsPerLine)
    const start = srtTimeToAss(cue.start)
    const end = srtTimeToAss(cue.end)
    const physicalLines = text.split(ASS_LINE_BREAK)

    const positionTag = (index) => {
      const y = lineY({
        lineIndex: index,
        totalLines: physicalLines.length,
        alignment,
        marginV: effectiveMarginV,
        lineSpacingPx: style.lineSpacingPx,
        playH,
      })
      return `{\\an${an}\\pos(${cx},${y})}`
    }

    const usePositioned = Boolean(style.lineSpacingPx) && physicalLines.length > 1

    if (style.highlightStyle === "pill" && highlights.length) {
      physicalLines.forEach((physicalLine, index) => {
        lines.push(
          ...buildPillEvents({
            lineText: physicalLine,
            lineIndex: index,
            totalLines: physicalLines.length,
            highlights,
            style,
            fontSize: effectiveFontSize,
            playW,
            playH,
            start,
            end,
          })
        )
      })

      if (usePositioned) {
        physicalLines.forEach((physicalLine, index) => {
          lines.push(
            `Dialogue: 1,${start},${end},Default,,0,0,0,,` +
              `${fadeTag}${positionTag(index)}${physicalLine}`
          )
        })
      } else {
        lines.push(`Dialogue: 1,${start},${end},Default,,0,0,0,,${fadeTag}${text}`)
      }

      continue
    }

    const highlight = (value) =>
      applyHighlights(
        value,
        highlights,
        style.primaryColour,
        style.highlightGlow,
        style.highlightScalePct,
        style.highlightNoOutline,
        style.outlineWidth
      )

    if (usePositioned) {
      physicalLines.forEach((physicalLine, index) => {
        lines.push(
          `Dialogue: 0,${start},${end},Default,,0,0,0,,` +
            `${fadeTag}${positionTag(index)}${highlight(physicalLine)}`
        )
      })
    } else {
      lines.push(
        `Dialogue: 0,${start},${end},Default,,0,0,0,,${fadeTag}${highlight(text)}`
      )
    }
  }

  return `${header}${lines.join("\n")}\n`
}

module.exports = {
  anForAlignment,
  applyHighlights,
  buildAss,
  buildPillEvents,
  lineY,
  resolveHighlights,
}
