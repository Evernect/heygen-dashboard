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

test("the pause budget scales with the configured length", () => {
  const short = buildScriptGenerationPrompt({ ...BASE, wordsMin: 35, wordsMax: 45 })
  const long = buildScriptGenerationPrompt({ ...BASE, wordsMin: 75, wordsMax: 90 })

  assert.match(short, /Break budget: two to four break tags per version/)
  assert.match(short, /At least one sentence boundary in every version/)
  assert.match(short, /at least two different values/)

  assert.match(long, /Break budget: four to seven break tags per version/)
  assert.match(long, /At least two sentence boundaries in every version/)
  assert.match(long, /at least three different values/)
})

test("the checklist restates the same pause numbers as the rules", () => {
  const prompt = buildScriptGenerationPrompt({ ...BASE, wordsMin: 35, wordsMax: 45 })

  assert.match(prompt, /- Two to four break tags\. Not one after every sentence\./)
  assert.match(prompt, /- At least one sentence boundary runs on punctuation alone\./)
  assert.match(prompt, /at least two different values appear/)
  assert.equal(prompt.includes("four to seven"), false)
})

test("the long-sentence target cannot swallow a short script", () => {
  const prompt = buildScriptGenerationPrompt({ ...BASE, wordsMin: 18, wordsMax: 22 })

  assert.match(prompt, /at least one longer sentence of nine to fifteen words/)
  assert.equal(prompt.includes("twelve to eighteen"), false)
})

test("pause counts are spelled out, never left as digits", () => {
  const prompt = buildScriptGenerationPrompt({ ...BASE, wordsMin: 300, wordsMax: 400 })

  assert.match(prompt, /Break budget: eighteen to thirty one break tags/)
})

test("the worked example obeys the contraction rule it teaches", () => {
  const prompt = buildScriptGenerationPrompt(BASE)

  assert.match(prompt, /Where's our money going\?/)
  assert.equal(prompt.includes("Where is our money going?"), false)
})

test("the example does not pass its own break count off as the budget", () => {
  const prompt = buildScriptGenerationPrompt({ ...BASE, wordsMin: 35, wordsMax: 45 })

  assert.match(prompt, /keep to your own budget of two to four break tags/)
  assert.equal(prompt.includes("five breaks"), false)
})

test("the closing line may not report the candidate voting for themselves", () => {
  const prompt = buildScriptGenerationPrompt({
    ...BASE,
    candidateName: "Dana Okonkwo",
    office: "City Council",
  })

  assert.match(prompt, /never describe the speaker casting a vote for themselves/)
  assert.match(prompt, /So I'm voting for Dana Okonkwo for City Council is wrong/)
  assert.match(prompt, /- No closing line frames the ask as the speaker's own vote/)
  assert.equal(/\b(himself|his)\b/.test(prompt), false)
})

test("the closing checklist drops rules that need a campaign profile", () => {
  const prompt = buildScriptGenerationPrompt({
    issue: BASE.issue,
    angle: BASE.angle,
  })

  assert.equal(prompt.includes("reference patterns"), false)
  assert.equal(prompt.includes("casting a vote for themselves"), false)
  assert.match(prompt, /- No name, title, office, or call to vote appears in any closing line/)
})

test("the checklist re-asserts name and office only when they exist", () => {
  const withProfile = buildScriptGenerationPrompt(BASE)
  const without = buildScriptGenerationPrompt({
    issue: BASE.issue,
    angle: BASE.angle,
  })

  assert.match(withProfile, /name and office both present in full/)
  assert.equal(without.includes("name and office both present in full"), false)
})

test("the runtime ceiling is checked, not just stated up front", () => {
  const prompt = buildScriptGenerationPrompt({ ...BASE, wordsMin: 75, wordsMax: 90 })

  assert.match(prompt, /must run no longer than 36 seconds/)
  assert.match(prompt, /- Total spoken length of each version.*no more than 36 seconds\./)
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
