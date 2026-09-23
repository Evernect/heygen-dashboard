"use strict"

const test = require("node:test")
const assert = require("node:assert/strict")

const {
  applyHighlights,
  buildAss,
  lineY,
  resolveHighlights,
} = require("../src/services/captions/ass-builder")
const {
  DEFAULT_CAPTION_STYLE,
  DEFAULT_PRESET,
} = require("../src/services/captions/caption-constants")
const { resolveStyle } = require("../src/services/captions/caption-style")
const { sanitiseHighlights } = require("../src/services/captions/highlight-colour.service")
const { escapeFilterPath } = require("../src/services/captions/ffmpeg")
const {
  applyCase,
  parseSrt,
  rewrap,
  srtTimeToAss,
} = require("../src/services/captions/srt")

const SRT = [
  "1",
  "00:00:00,000 --> 00:00:02,400",
  "They promised lower bills",
  "",
  "2",
  "00:00:02,400 --> 00:00:05,120",
  "and rates went up",
  "",
].join("\r\n")

const styled = (overrides = {}) =>
  resolveStyle(DEFAULT_PRESET, { ...DEFAULT_CAPTION_STYLE, ...overrides })

test("parseSrt reads cues from a CRLF file", () => {
  const cues = parseSrt(SRT)

  assert.equal(cues.length, 2)
  assert.deepEqual(cues[0], {
    idx: "1",
    start: "00:00:00,000",
    end: "00:00:02,400",
    text: "They promised lower bills",
  })
  assert.equal(cues[1].text, "and rates went up")
})

test("parseSrt reads the final cue with no trailing blank line", () => {
  const cues = parseSrt("1\n00:00:00,000 --> 00:00:01,000\nlast one")

  assert.equal(cues.length, 1)
  assert.equal(cues[0].text, "last one")
})

test("srtTimeToAss drops milliseconds to centiseconds", () => {
  assert.equal(srtTimeToAss("00:00:02,400"), "0:00:02.40")
  assert.equal(srtTimeToAss("01:23:45,678"), "1:23:45.67")
  assert.equal(srtTimeToAss("00:00:00,009"), "0:00:00.00")
})

test("rewrap breaks on \\N every maxWords words", () => {
  assert.equal(rewrap("one two three four five", 3), "one two three\\Nfour five")
  assert.equal(rewrap("one two", 0), "one two")
  assert.equal(rewrap("", 3), "")
})

test("applyCase reproduces Python's str.title() quirk", () => {
  assert.equal(applyCase("they don't pay", "upper"), "THEY DON'T PAY")
  assert.equal(applyCase("they don't pay", "title"), "They Don'T Pay")
  assert.equal(applyCase("leave it", "none"), "leave it")
})

test("resolveStyle lets a friendly font key win over fontName", () => {
  const style = styled()

  assert.equal(style.fontName, "Poppins ExtraBold")
  assert.equal(style.bold, false)
  assert.equal(style.textCase, "upper")
  assert.equal(style.maxWordsPerLine, 3)
  assert.equal(style.fadeMs, 120)
})

test("resolveStyle rejects an unknown font key", () => {
  assert.throws(() => resolveStyle(DEFAULT_PRESET, { font: "comic-sans" }), /not a known font key/)
})

test("buildAss sizes from percentages against the real frame height", () => {
  const ass = buildAss(parseSrt(SRT), styled(), 1080, 1920)

  assert.match(ass, /PlayResX: 1080/)
  assert.match(ass, /PlayResY: 1920/)
  assert.match(ass, /^Style: Default,Poppins ExtraBold,115,/m)
  assert.match(ass, /,1,5,0,2,10,10,480,1$/m)
})

test("buildAss emits a background box as BorderStyle 3", () => {
  const ass = buildAss(parseSrt(SRT), resolveStyle("boxed", {}), 720, 1280)

  assert.match(ass, /,&H00000000,&HB0000000,0,0,0,0,100,100,0,0,3,6,0,2,10,10,80,1$/m)
})

test("buildAss keeps a one-line cue on a single un-positioned Dialogue", () => {
  const cues = [{ idx: "1", start: "00:00:00,000", end: "00:00:01,000", text: "two words" }]
  const ass = buildAss(cues, styled(), 1080, 1920)

  const events = ass.split("[Events]")[1].split("\n").filter((l) => l.startsWith("Dialogue"))
  assert.equal(events.length, 1)
  assert.equal(
    events[0],
    "Dialogue: 0,0:00:00.00,0:00:01.00,Default,,0,0,0,,{\\fad(120,120)}TWO WORDS"
  )
})

test("buildAss positions each wrapped line when lineSpacingPx is set", () => {
  const cues = [
    { idx: "1", start: "00:00:00,000", end: "00:00:02,000", text: "one two three four" },
  ]
  const ass = buildAss(cues, styled(), 1080, 1920)

  const events = ass.split("[Events]")[1].split("\n").filter((l) => l.startsWith("Dialogue"))
  assert.equal(events.length, 2)
  assert.match(events[0], /\{\\an2\\pos\(540,1395\)\}ONE TWO THREE$/)
  assert.match(events[1], /\{\\an2\\pos\(540,1440\)\}FOUR$/)
})

test("lineY grows downward from the top anchor and upward from the bottom", () => {
  const base = { totalLines: 3, marginV: 100, lineSpacingPx: 50, playH: 1000 }

  assert.equal(lineY({ ...base, lineIndex: 0, alignment: 8 }), 100)
  assert.equal(lineY({ ...base, lineIndex: 2, alignment: 8 }), 200)

  assert.equal(lineY({ ...base, lineIndex: 0, alignment: 2 }), 800)
  assert.equal(lineY({ ...base, lineIndex: 2, alignment: 2 }), 900)

  assert.equal(lineY({ ...base, lineIndex: 0, alignment: 5 }), 425)
})

test("applyHighlights wraps a word and resets the colour after it", () => {
  const style = styled()
  const highlights = [{ word: "rates", colour: "&H00A5D6FF" }]

  const out = applyHighlights(
    "AND RATES WENT UP",
    highlights,
    style.primaryColour,
    style.highlightGlow,
    style.highlightScalePct,
    style.highlightNoOutline,
    style.outlineWidth
  )

  assert.equal(
    out,
    "AND {\\c&H00A5D6FF}RATES{\\c&H00FFFFFF\\blur0} WENT UP"
  )
})

test("applyHighlights matches case-insensitively on whole words only", () => {
  const out = applyHighlights("RATED RATES", [{ word: "rate", colour: "&H000000FF" }],
    "&H00FFFFFF", 0, 100, false, 5)

  assert.equal(out, "RATED RATES")
})

test("resolveHighlights unifies colours when randomHighlightColour is set", () => {
  const style = styled({
    randomHighlightColour: true,
    highlights: [
      { word: "one", colour: "&H00A5D6FF" },
      { word: "two", colour: "&H0000D7FF" },
    ],
  })

  const resolved = resolveHighlights(style)
  assert.equal(resolved.length, 2)
  assert.equal(resolved[0].colour, resolved[1].colour)
})

test("sanitiseHighlights caps, dedupes and unifies on one colour", () => {
  const script = "They promised lower bills and rates went up by fifty percent"

  const out = sanitiseHighlights(
    [
      { word: "promised", colour: "&H00A5D6FF" },
      { word: "PROMISED", colour: "&H00A5D6FF" },
      { word: "rates", colour: "not-a-colour" },
      { word: "fifty", colour: "&H0000D7FF" },
      { word: "percent", colour: "&H00A5D6FF" },
      { word: "bills", colour: "&H00A5D6FF" },
    ],
    script
  )

  assert.equal(out.length, 4)
  assert.deepEqual(
    out.map((h) => h.word),
    ["promised", "rates", "fifty", "percent"]
  )
  assert.ok(out.every((h) => h.colour === "&H00A5D6FF"))
})

test("sanitiseHighlights drops words the script never says", () => {
  const out = sanitiseHighlights(
    [
      { word: "rates", colour: "&H00A5D6FF" },
      { word: "hallucinated", colour: "&H00A5D6FF" },
    ],
    "and rates went up"
  )

  assert.deepEqual(out.map((h) => h.word), ["rates"])
})

test("sanitiseHighlights renders nothing rather than a colour nobody chose", () => {
  const out = sanitiseHighlights([{ word: "rates", colour: "#ffd6a5" }], "and rates went up")

  assert.deepEqual(out, [])
})

test("escapeFilterPath makes a Windows path safe for the ass filter", () => {
  assert.equal(
    escapeFilterPath("C:\\Temp\\job\\captions.ass"),
    "C\\\\:/Temp/job/captions.ass"
  )
  assert.equal(escapeFilterPath("/tmp/job/captions.ass"), "/tmp/job/captions.ass")
})
