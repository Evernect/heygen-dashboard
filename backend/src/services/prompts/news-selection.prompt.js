"use strict"

const MAX_ENUM_CANDIDATES = 40

const IMPORTANCE_LEVELS = ["High", "Medium", "Low"]

function formatElectionDate(profile) {
  if (!profile?.electionDate) return null

  return new Intl.DateTimeFormat("en-US", {
    timeZone: profile.timezone || "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(profile.electionDate))
}

function buildPersonaBlock(profile) {
  if (!profile) return "A candidate for public office."

  const office = [profile.party, "candidate for", profile.office]
    .filter(Boolean)
    .join(" ")

  const where = [profile.district, profile.state].filter(Boolean).join(", ")

  const lines = [
    `You select news stories for ${profile.candidateName || "a candidate"}'s daily short-form video.`,
    [office, where && `in ${where}`].filter(Boolean).join(" ") + ".",
  ]

  if (profile.districtDescription) {
    lines.push(`The district covers: ${profile.districtDescription}.`)
  }

  const electionDate = formatElectionDate(profile)
  if (electionDate) lines.push(`General election: ${electionDate}.`)

  if (profile.personaSummary) lines.push(profile.personaSummary)

  return lines.filter(Boolean).join("\n")
}

function pickKeys(maxPicks) {
  return Array.from({ length: maxPicks }, (_, index) => `pick_${index + 1}`)
}

function buildNewsSelectionPrompt({
  profile,
  positionsBlock,
  candidatesJson,
  maxPicks = 3,
}) {
  const keys = pickKeys(maxPicks)

  return `# ROLE
${buildPersonaBlock(profile)}

# HIS STATED POSITIONS
${positionsBlock || "(none recorded yet)"}

# TODAY'S CANDIDATE STORIES
${candidatesJson}

# TASK
Pick up to ${maxPicks} stories.

Hard exclusions - never pick these, no matter how high the score:
- sports, entertainment, celebrity news, real estate listings
- obituaries, routine crime blotter, traffic accidents, weather
- petitions, advocacy-group posts and press releases dressed as news
- business news with no policy angle (office leases, company earnings, layoffs at a
  single firm) unless it directly illustrates a stated position
- anything outside the state unless it directly concerns his district

Preferences, in order:
1. Stories that connect to one of his stated positions above
2. is_district true over statewide
3. is_named true (mentions him, his opponent, or the governor)
4. Higher outlet_count - more outlets means the story is real and corroborated
5. Variety - different underlying stories, not several angles on one

If fewer than ${maxPicks} stories clear the exclusions, fill only the picks you can
stand behind and return an empty string as the id of every remaining pick. It is
better to return 1 good topic than ${maxPicks} with filler. Never pad the list.

# FIELDS TO RETURN
Return ${keys.join(", ")}. Each one is either a real pick or an unused slot with
id set to "".

id                - copy exactly from the candidate you picked. This is a lookup key used
                    downstream to retrieve the source links. An id that does not match a
                    candidate will break the record.
importance_score  - copy the candidate's score field unchanged
importance        - your own judgement of how much this matters to THIS campaign.
                    This is editorial and may differ from importance_score.
source_summary    - 3-5 sentences of verified facts drawn ONLY from that story's
                    article_text and headlines. Do not add statistics, dates, names,
                    dollar figures or quotes that are not in the supplied text. If
                    article_text is empty, summarise from the headlines only and begin
                    the summary with "HEADLINES ONLY:" so a human knows detail is thin.

For an unused slot, set id to "" and leave the other fields as empty strings or 0.

Return JSON only.`
}

function buildPickSchema(candidateIds) {
  const useEnum =
    Array.isArray(candidateIds) &&
    candidateIds.length > 0 &&
    candidateIds.length <= MAX_ENUM_CANDIDATES

  return {
    type: "object",
    additionalProperties: false,
    properties: {
      id: useEnum
        ? {
            type: "string",
            enum: ["", ...candidateIds],
            description:
              'The id of the candidate story you picked, or "" for an unused slot.',
          }
        : {
            type: "string",
            description:
              'The id of the candidate story you picked, copied exactly, or "" for an unused slot.',
          },
      topic: {
        type: "string",
        description: "Short headline-style topic, under 12 words",
      },
      why_now: {
        type: "string",
        description: "One line on why this matters today for this campaign",
      },
      importance: { type: "string", enum: IMPORTANCE_LEVELS },
      importance_score: {
        type: "number",
        description: "Copy the score field from the candidate you picked",
      },
      source_summary: {
        type: "string",
        description:
          "3-5 sentences of verified facts drawn only from this story's article_text and headlines. Begin with 'HEADLINES ONLY:' if article_text was empty.",
      },
    },
    required: [
      "id",
      "topic",
      "why_now",
      "importance",
      "importance_score",
      "source_summary",
    ],
  }
}

function buildNewsSelectionSchema({ maxPicks = 3, candidateIds = [] } = {}) {
  const pick = buildPickSchema(candidateIds)
  const keys = pickKeys(maxPicks)

  return {
    type: "object",
    additionalProperties: false,
    properties: Object.fromEntries(keys.map((key) => [key, pick])),
    required: keys,
  }
}

module.exports = {
  buildNewsSelectionPrompt,
  buildNewsSelectionSchema,
  buildPersonaBlock,
  pickKeys,
  IMPORTANCE_LEVELS,
  MAX_ENUM_CANDIDATES,
}
