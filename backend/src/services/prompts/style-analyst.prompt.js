"use strict"

const MIN_EVIDENCE_COUNT = 5

function buildStyleAnalystPrompt({ rows, sampleSize, minSampleSize }) {
  return `# ROLE
You compare style attributes across posted short-form videos to find what distinguishes top-tier from bottom-tier performance. The attributes are hook_type, hook_word_count, outro_lead_in, break_count, avg_break_duration, sentence_variety_score, composite_score and performance_tier.

# HOW THE DATA WAS BUILT
- composite_score is the mean of the video's per-platform engagement-rate z-scores, so it is already normalised within each platform. A higher score is better.
- performance_tier splits the ranking into thirds: top, mid, bottom.
- Videos live for fewer than three days are excluded entirely, so everything below is settled enough to compare.
- sentence_variety_score runs from 0 to 1 and is the share of counted sentences that are short (six words or fewer) against long (twelve words or more). Higher means choppier.

# RULES
- Only assert a winning_pattern or avoid_pattern if at least ${MIN_EVIDENCE_COUNT} videos share that attribute value AND the pattern holds consistently across top versus bottom tier. If fewer than ${MIN_EVIDENCE_COUNT} videos share an attribute value, do not report it.
- If sample_size is below ${minSampleSize}, return empty winning_patterns and avoid_patterns arrays and an empty guidance_text string, regardless of what the data looks like. Insufficient data is a valid, expected answer, not a failure.
- Never invent an attribute or a value that is not literally present in the data.
- Report evidence_count honestly for every pattern you do report. It is the number of videos actually sharing that value, not an estimate.
- Do not confuse correlation with cause, and do not report a pattern that holds in the top tier but also holds in the bottom tier.
- guidance_text must be three to five short, plain-language sentences, phrased as instructions a scriptwriter can follow, for example "Favor rhetorical-question hooks under eight words; recent data shows these outperforming blunt-claim hooks." It is not a data summary and must not quote scores or z-values.
- guidance_text is injected verbatim into the script generation prompt, so it must read as direction, never as commentary about this analysis.

# DATA
sample_size: ${sampleSize}

${JSON.stringify(rows, null, 1)}`
}

function patternSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      attribute: {
        type: "string",
        description:
          "The attribute name, exactly as it appears in the data, e.g. hook_type.",
      },
      value: {
        type: "string",
        description:
          "The attribute value or range this pattern covers, e.g. rhetorical_question, or 4 to 5.",
      },
      evidence_count: {
        type: "integer",
        description: "How many videos in the data share this value.",
      },
    },
    required: ["attribute", "value", "evidence_count"],
  }
}

function buildStyleAnalystSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      sample_size: {
        type: "integer",
        description: "The number of videos supplied, echoed back.",
      },
      winning_patterns: { type: "array", items: patternSchema() },
      avoid_patterns: { type: "array", items: patternSchema() },
      guidance_text: {
        type: "string",
        description:
          "Three to five plain sentences to inject directly into the script generation prompt. Empty string when the sample is too small.",
      },
    },
    required: [
      "sample_size",
      "winning_patterns",
      "avoid_patterns",
      "guidance_text",
    ],
  }
}

module.exports = {
  buildStyleAnalystPrompt,
  buildStyleAnalystSchema,
  MIN_EVIDENCE_COUNT,
}
