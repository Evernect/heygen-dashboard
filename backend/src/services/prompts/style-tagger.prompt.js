"use strict"

const HOOK_TYPES = [
  "RHETORICAL_QUESTION",
  "BLUNT_CLAIM",
  "CONTRAST",
  "DIRECT_ADDRESS",
]

function buildStyleTaggerPrompt(hooks) {
  const listing = hooks
    .map((hook, index) => `${index + 1}. [${hook.id}] ${hook.text}`)
    .join("\n")

  return `# ROLE
You are a script style analyst for short-form political talking-head videos. You classify opening lines, nothing else.

# TASK
Each numbered line below is the opening sentence of one script, preceded by its id in square brackets. Classify every one of them into exactly one hook type, and return one entry per id.

Hook types, returned exactly as written here:
- RHETORICAL_QUESTION - opens with a question the speaker does not expect answered, e.g. Where is our money going?
- BLUNT_CLAIM - opens with a flat assertion of fact or judgement, e.g. This budget is a disaster.
- CONTRAST - opens by setting two things against each other, e.g. They promised lower bills, and rates went up.
- DIRECT_ADDRESS - opens by speaking straight at the viewer, e.g. You guys are paying for this.

# RULES
- Classify only on what the line literally says. Do not judge quality, persuasiveness, or truth.
- Pick the single best fit. If a line both asks a question and addresses the viewer, choose the form that carries the opening, which is whichever comes first.
- Return exactly one entry for every id given, using the id verbatim. Do not add, drop, merge, or reorder ids.

# OPENING LINES
${listing}`
}

function buildStyleTaggerSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      hooks: {
        type: "array",
        description: "One entry per id supplied, in the same order.",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: {
              type: "string",
              description: "The id from the square brackets, verbatim.",
            },
            hook_type: { type: "string", enum: HOOK_TYPES },
          },
          required: ["id", "hook_type"],
        },
      },
    },
    required: ["hooks"],
  }
}

module.exports = { buildStyleTaggerPrompt, buildStyleTaggerSchema, HOOK_TYPES }
