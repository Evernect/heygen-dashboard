"use strict"

const test = require("node:test")
const assert = require("node:assert/strict")

const {
  extractStyle,
  parseBreaks,
  toSentences,
  sentenceVariety,
  findOutroLeadIn,
} = require("../src/services/insights/style-tagger.service")

const EXAMPLE = `Where is our money going? <break time="0.5s"/> The budget's quadrupled since I got here, folks, and nothing actually got better. Same roads, same waiting lists, and a bigger bill every single year. <break time="0.3s"/> That's not a mystery, that's a choice. <break time="0.4s"/> I want a real audit of every dollar, <break time="0.2s"/> and I'm going to fight for it. <break time="0.6s"/> I'm Ted Nordblum, and I'm running for State Assembly.`

test("break tags are counted and averaged", () => {
  const { breakCount, avgBreakDuration } = parseBreaks(EXAMPLE)

  assert.equal(breakCount, 5)
  assert.equal(avgBreakDuration, 0.4)
})

test("the two-decimal durations the new prompt allows are parsed", () => {
  const { breakCount, avgBreakDuration } = parseBreaks(
    `One. <break time="0.15s"/> Two. <break time="0.25s"/> Three.`
  )

  assert.equal(breakCount, 2)
  assert.equal(avgBreakDuration, 0.2)
})

test("a script with no break tags reports zero and a null average", () => {
  assert.deepEqual(parseBreaks("No pauses here at all."), {
    breakCount: 0,
    avgBreakDuration: null,
  })
})

test("sentences are split with the SSML stripped out", () => {
  const sentences = toSentences(EXAMPLE)

  assert.equal(sentences[0], "Where is our money going?")
  assert.equal(sentences.at(-1), "I'm Ted Nordblum, and I'm running for State Assembly.")
  assert.equal(
    sentences.some((sentence) => sentence.includes("<break")),
    false
  )
})

test("a question hook is captured whole, capped at eight words", () => {
  const style = extractStyle(EXAMPLE, { candidateName: "Ted Nordblum" })

  assert.equal(style.hookFirstWords, "Where is our money going?")
  assert.equal(style.hookWordCount, 5)
})

test("a long hook is truncated to its first eight words but counted in full", () => {
  const style = extractStyle(
    `They promised our electricity bills would finally come down this year, and they went up again. <break time="0.4s"/> I want answers.`
  )

  assert.equal(
    style.hookFirstWords,
    "They promised our electricity bills would finally come"
  )
  assert.equal(style.hookWordCount, 16)
})

test("the outro lead-in is the sentence before the line naming the candidate", () => {
  const style = extractStyle(EXAMPLE, { candidateName: "Ted Nordblum" })

  assert.equal(
    style.outroLeadIn,
    "I want a real audit of every dollar, and I'm going to fight for it."
  )
})

test("a candidate named mid-script does not fool the outro search", () => {
  const script = `Ted Nordblum warned about this years ago. <break time="0.4s"/> The council ignored it. Rates doubled anyway. <break time="0.5s"/> I want that decision reviewed. <break time="0.6s"/> Vote Ted Nordblum for State Assembly.`

  assert.equal(
    findOutroLeadIn(toSentences(script), "Ted Nordblum"),
    "I want that decision reviewed."
  )
})

test("with no candidate name the last sentence is assumed to be the close", () => {
  const sentences = ["Rates doubled.", "I want answers.", "And I'm not letting go."]

  assert.equal(findOutroLeadIn(sentences, null), "I want answers.")
})

test("a one-sentence script has no lead-in", () => {
  assert.equal(findOutroLeadIn(["Just the one."], "Ted Nordblum"), null)
})

test("sentence variety is bounded between zero and one", () => {
  const style = extractStyle(EXAMPLE, { candidateName: "Ted Nordblum" })

  assert.ok(style.sentenceVarietyScore >= 0)
  assert.ok(style.sentenceVarietyScore <= 1)
})

test("all-short sentences score one rather than dividing by zero", () => {
  assert.equal(sentenceVariety(["Rates went up.", "I want answers.", "Fix it."]), 1)
})

test("all-long sentences score zero", () => {
  assert.equal(
    sentenceVariety([
      "They promised our electricity bills would finally come down this year and they did not.",
    ]),
    0
  )
})

test("sentences in neither band leave the score undefined", () => {
  assert.equal(sentenceVariety(["One two three four five six seven eight."]), null)
})
