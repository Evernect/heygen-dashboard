"use strict"

const test = require("node:test")
const assert = require("node:assert/strict")

const {
  buildScriptGenerationPrompt,
  buildScriptOutputSchema,
} = require("../src/services/prompts/script-generation.prompt")

const BASE = {
  issue: "Bridge closure",
  angle: "The detour is costing commuters an hour a day.",
  candidateName: "Ted Nordblum",
  office: "State Assembly",
  state: "California",
}

test("guidance is injected under its own heading", () => {
  const prompt = buildScriptGenerationPrompt({
    ...BASE,
    guidanceText: "Favor rhetorical-question hooks under eight words.",
  })

  assert.match(
    prompt,
    /# PERFORMANCE-INFORMED GUIDANCE\nFavor rhetorical-question hooks under eight words\./
  )
})

test("the section is still rendered when there is no guidance", () => {
  const prompt = buildScriptGenerationPrompt(BASE)

  assert.match(prompt, /# PERFORMANCE-INFORMED GUIDANCE/)
  assert.match(prompt, /If it is empty, ignore it entirely\./)
})

test("guidance is explicitly subordinate to the prompt's own constraints", () => {
  const prompt = buildScriptGenerationPrompt({ ...BASE, guidanceText: "x" })
  assert.match(prompt, /never overrides any constraint in this prompt/)
})

test("the candidate name and office are templated, not hardcoded", () => {
  const prompt = buildScriptGenerationPrompt({
    ...BASE,
    candidateName: "Dana Okonkwo",
    office: "City Council",
  })

  assert.match(prompt, /Vote Dana Okonkwo for City Council\./)
  assert.equal(prompt.includes("Ted Nordblum"), false)
  assert.equal(prompt.includes("State Assembly"), false)
})

test("the state framing is templated too", () => {
  const prompt = buildScriptGenerationPrompt({ ...BASE, state: "Ohio" })
  assert.match(prompt, /change Ohio or take Ohio back/)
})

test("without a campaign profile nothing is invented to sign off with", () => {
  const prompt = buildScriptGenerationPrompt({
    issue: BASE.issue,
    angle: BASE.angle,
  })

  assert.match(prompt, /Do not invent a name, a title, an office, or a call to vote/)
  assert.equal(/Vote .* for .*\./.test(prompt), false)
  assert.equal(prompt.includes("null"), false)
  assert.equal(prompt.includes("undefined"), false)
})

test("the word range follows the per-user setting", () => {
  const prompt = buildScriptGenerationPrompt({
    ...BASE,
    wordsMin: 60,
    wordsMax: 70,
  })

  assert.match(prompt, /60 to 70 spoken words/)
  assert.equal(prompt.includes("75 to 90"), false)
})

test("the schema uses no keyword OpenAI strict mode rejects", () => {
  const schema = buildScriptOutputSchema({ variantCount: 3 })
  const serialised = JSON.stringify(schema)

  for (const keyword of ["minItems", "maxItems", "uniqueItems", "contains"]) {
    assert.equal(serialised.includes(keyword), false, `${keyword} must not appear`)
  }
})

test("every object in the schema is closed and fully required", () => {
  const schema = buildScriptOutputSchema({ variantCount: 3 })

  const walk = (node, path) => {
    if (node.type === "object") {
      assert.equal(node.additionalProperties, false, `${path} must be closed`)
      assert.deepEqual(
        [...(node.required ?? [])].sort(),
        Object.keys(node.properties).sort(),
        `${path} must require every property`
      )
      for (const [key, child] of Object.entries(node.properties)) {
        walk(child, `${path}.${key}`)
      }
    }
    if (node.type === "array") walk(node.items, `${path}[]`)
  }

  walk(schema, "root")
})

test("captions and hashtags are shared, scripts are per version", () => {
  const schema = buildScriptOutputSchema({ variantCount: 3 })

  assert.deepEqual(Object.keys(schema.properties.scripts.items.properties), [
    "version",
    "label",
    "script",
  ])
  assert.equal(schema.properties.facebook_caption.type, "string")
  assert.deepEqual(schema.properties.scripts.items.properties.version.enum, [
    "A",
    "B",
    "C",
  ])
})
