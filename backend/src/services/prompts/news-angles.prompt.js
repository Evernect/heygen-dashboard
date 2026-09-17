"use strict"

const { IMPORTANCE_LEVELS } = require("./news-selection.prompt")

/**
 * What to say when there is nothing in the content bank yet.
 *
 * An empty "# VOICE REFERENCE" heading reads to a model like the examples were
 * deliberately left blank, which is worse than saying plainly that there are
 * none and what to do instead.
 */
const NO_VOICE_EXAMPLES = `No prior examples are available yet. Write plainly in
the first person, taking the voice entirely from the stated positions below:
short sentences, name the problem, say what he would do. Do not imitate a
generic political style.`

const NO_GUIDANCE = "(no style guidance recorded yet)"

function angleKeys(count) {
  return Array.from({ length: count }, (_, index) => `angle_${index + 1}`)
}

function buildNewsAnglesPrompt({
  voiceExamples,
  positionsBlock,
  guidanceText,
  topicsJson,
  count,
}) {
  const keys = angleKeys(count)

  return `# ROLE
You write the ANGLE for a candidate's short video. You do NOT write the script.
An angle is 1-2 sentences: it names the problem plainly and states what he would do.

# VOICE REFERENCE
Real issue/angle pairs from this candidate's own content bank. Study the voice: the
bluntness, the sentence length, the kind of problem he names, the kind of fix he proposes.

${voiceExamples?.length ? voiceExamples : NO_VOICE_EXAMPLES}

# HIS STATED POSITIONS
Never write an angle that contradicts these. If a topic has no matching position, say so
in conflict_flag rather than inventing one.

${positionsBlock || "(none recorded yet)"}

# STYLE GUIDANCE FROM PAST PERFORMANCE
${guidanceText || NO_GUIDANCE}

# TODAY'S TOPICS
${topicsJson}

# TASK
For each topic write one angle in his voice. First person singular (I, my, me).
Plainspoken and direct. No greetings, no slogans, no invented credentials.

Use ONLY facts that appear in that topic's source_summary. Do not add statistics, dates,
names, dollar figures or quotes that are not already there. If the summary begins with
"HEADLINES ONLY:", keep the angle general and make no factual claims beyond the headline.

Then set conflict_flag:
- an empty string if the angle is consistent with his stated positions
- otherwise one line describing the conflict, or noting that no stated position covers it

Carry through id, topic, why_now, importance, importance_score and source_summary exactly
as given. The id in particular must be copied unchanged - it is a lookup key, and a wrong
id will attach the wrong sources to this angle.

You were given ${count} topic(s). Return ${keys.join(", ")}, one per topic, in the
same order.

Return JSON only.`
}

function buildAngleSchema(topicIds) {
  const useEnum = Array.isArray(topicIds) && topicIds.length > 0

  return {
    type: "object",
    additionalProperties: false,
    properties: {
      id: useEnum
        ? {
            type: "string",
            enum: topicIds,
            description:
              "Copy the id from the topic you were given, unchanged. This is a lookup key.",
          }
        : {
            type: "string",
            description:
              "Copy the id from the topic you were given, unchanged. This is a lookup key.",
          },
      topic: { type: "string" },
      angle: {
        type: "string",
        description:
          "1-2 sentences in the candidate's voice, first person singular. Names the problem and states what he would do.",
      },
      why_now: { type: "string" },
      importance: { type: "string", enum: IMPORTANCE_LEVELS },
      importance_score: { type: "number" },
      source_summary: {
        type: "string",
        description: "Copy through unchanged from the topic you were given",
      },
      conflict_flag: {
        type: "string",
        description:
          "Empty string if the angle is consistent with his stated positions. Otherwise one line describing the conflict, or noting that no stated position covers this topic.",
      },
    },
    required: [
      "id",
      "topic",
      "angle",
      "why_now",
      "importance",
      "importance_score",
      "source_summary",
      "conflict_flag",
    ],
  }
}

/**
 * One fixed slot per topic handed in. `conflict_flag` is a required string with
 * "" meaning no conflict rather than a nullable field — under strict mode a
 * nullable becomes `["string", "null"]`, which models handle less reliably, and
 * an empty string is what the original workflow meant by "no conflict" anyway.
 */
function buildNewsAnglesSchema({ count = 3, topicIds = [] } = {}) {
  const angle = buildAngleSchema(topicIds)
  const keys = angleKeys(count)

  return {
    type: "object",
    additionalProperties: false,
    properties: Object.fromEntries(keys.map((key) => [key, angle])),
    required: keys,
  }
}

module.exports = {
  buildNewsAnglesPrompt,
  buildNewsAnglesSchema,
  angleKeys,
  NO_VOICE_EXAMPLES,
}
