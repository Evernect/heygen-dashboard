"use strict"

const VERSION_LETTERS = ["A", "B", "C", "D", "E", "F"]

const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
  "sixteen", "seventeen", "eighteen", "nineteen",
]
const TENS = [
  "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty",
  "ninety",
]

function estimateSeconds(words) {
  return Math.max(10, Math.round((words / 150) * 60))
}

function versionLetters(variantCount) {
  return VERSION_LETTERS.slice(0, variantCount)
}

function numberWord(value) {
  if (value < 20) return ONES[value]
  if (value > 99) return String(value)
  const ones = value % 10
  return ones
    ? `${TENS[Math.floor(value / 10)]} ${ONES[ones]}`
    : TENS[Math.floor(value / 10)]
}

function capitalise(word) {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

function buildPacingRules(wordsMax) {
  const breaksMin = Math.max(1, Math.round(wordsMax / 22))
  const breaksMax = Math.max(breaksMin + 1, Math.ceil(wordsMax / 13))
  const longLow = Math.max(7, Math.min(12, Math.round(wordsMax * 0.4)))

  return {
    breaksMin,
    breaksMax,
    punctuationOnly: Math.max(1, Math.min(breaksMin, Math.round(wordsMax / 45))),
    distinctValues: Math.min(4, Math.max(2, Math.floor(breaksMax / 3) + 1)),
    longLow,
    longHigh: longLow + 6,
  }
}

function joinWithAnd(values) {
  if (values.length <= 1) return values.join("")
  return `${values.slice(0, -1).join(", ")} and ${values[values.length - 1]}`
}

function buildClosingSection({ candidateName, office, variantCount }) {
  if (!candidateName || !office) {
    return `**Closing line generation.** Every version ends with a short closing line that restates the speaker's resolve and connects naturally to the sentence before it. Vary the wording across all ${variantCount} versions; no two may share phrasing or sentence structure. Do not invent a name, a title, an office, or a call to vote, because none were provided.`
  }

  return `**Closing line generation. Do not copy any line below verbatim. The lines under "Reference patterns" exist only to show the required shape and tone; generate a new line for each version, inspired by that shape but worded differently every time:**
- **Vote ${candidateName} for ${office}.**
- **I'm ${candidateName}, and I'm running for ${office}.**
- **I'm running for ${office}, and I need your vote.**
- **That's why I'm asking for your vote. ${candidateName} for ${office}.**
- **I'm ${candidateName}. Vote for me for ${office}.**
- **This is why I'm running. Vote ${candidateName} for ${office}.**

Requirements for every generated closing line:
- The candidate name, ${candidateName}, and the office, ${office}, must always both appear, spoken in full (never abbreviated).
- The line must connect naturally to the sentence immediately before it, picking up its momentum rather than pivoting abruptly.
- The line must include some form of a vote ask, a declaration of candidacy, or both, matching the tone of the reference patterns, but built from new wording, new word order, or a new connecting phrase each time.
- The ask must always be directed outward, at the viewer's vote, or stated as the speaker's own candidacy. The closing line must never describe the speaker casting a vote for themselves. A line like So I'm voting for ${candidateName} for ${office} is wrong, because ${candidateName} is the speaker delivering the line, and a candidate does not ask viewers to watch them vote for themselves. They are asking viewers to vote for them, or declaring that they are running. Every closing line must pass this test: could a candidate credibly say this about themselves, as an ask to others or a declaration of their own candidacy, and not as a report of their own ballot choice.
- Across a single output, no two versions may share sentence structure, opening word, or phrasing with either the reference patterns or each other. Treat every reference line as used up once its general shape has informed one version; the remaining versions must draw on a different shape or a fresh combination.
- Do not default to the first reference pattern as a template. Rotate which structural idea (direct imperative, self-introduction, need-your-vote, thanks-plus-name, name-plus-imperative, this-is-why-framing) each version leans on, and feel free to blend or invent beyond the six shown as long as name and office still appear.

You may rephrase lightly to connect naturally to the sentence before it, but the candidate name and office must always appear.`
}

function buildClosingChecklist({ candidateName, office }) {
  if (!candidateName || !office) {
    return `- Every version ends with a freshly generated closing line, and no two versions share the same phrasing.
- No name, title, office, or call to vote appears in any closing line, because none were provided.`
  }

  return `- Every version ends with a freshly generated closing line, name and office both present in full, and no two versions share the same phrasing.
- No closing line frames the ask as the speaker's own vote, such as I'm voting for ${candidateName}. The ask must be directed at the viewer's vote, an assertion of the speaker's own candidacy, or both, never a report of the speaker casting a vote for themselves.
- No closing line is copied verbatim from the reference patterns list, and no two versions lean on the same structural idea from that list.`
}

function buildFramingBullet(state) {
  if (!state) return ""
  return `\n- You may use recurring framings such as change ${state} or take ${state} back only if they fit the topic and angle. Do not force them.`
}

function buildScriptGenerationPrompt({
  issue,
  angle,
  wordsMin = 75,
  wordsMax = 90,
  variantCount = 3,
  guidanceText = "",
  candidateName = null,
  office = null,
  state = null,
}) {
  const range = `${wordsMin} to ${wordsMax}`
  const seconds = estimateSeconds(wordsMax)
  const letters = versionLetters(variantCount)
  const versionList = joinWithAnd(letters.map((letter) => `Version ${letter}`))
  const pacing = buildPacingRules(wordsMax)

  const breakRange = `${numberWord(pacing.breaksMin)} to ${numberWord(pacing.breaksMax)}`
  const longRange = `${numberWord(pacing.longLow)} to ${numberWord(pacing.longHigh)}`
  const distinct = numberWord(pacing.distinctValues)
  const punctuationOnly = numberWord(pacing.punctuationOnly)
  const boundary = pacing.punctuationOnly === 1 ? "boundary" : "boundaries"

  const exampleClose =
    candidateName && office
      ? `I'm ${candidateName}, and I'm running for ${office}.`
      : `And I'm not letting this one go.`

  return `# ROLE
You write short-form, first-person talking-head scripts on public issues, plus matching social captions. The video is spoken directly to camera in a natural, conversational setting, and must run no longer than ${seconds} seconds.
The scripts are sent to a text-to-speech voice. Your single most important job, after getting the message right, is to write text that the voice model can speak with natural rhythm and flow. A script that is factually perfect but reads as a stack of disconnected one-liners is a failed script.

# INPUT
Issue: ${issue}
Angle: ${angle}

Use only the information in these inputs. Never introduce facts, statistics, events, quotes, policies, endorsements, promises, personal experiences, or credentials that are not provided.

# SPEAKER VOICE
One person speaking to camera about their own position.
- Write in first person singular: I, my, me. Use we or our only when the angle clearly refers to a shared community the speaker belongs to.
- State the angle as the speaker's own view: I think, I believe, I'm asking, I want, I support, I'm concerned about.
- Never reframe the speaker's position in third person (residents are asking, people need to, officials say).
- Attribute statements to third parties only when the input explicitly does so.
- Do not name the speaker or give them a title or role unless the input provides one.

Correct: This road has been unsafe for months, and nothing has changed. <break time="0.4s"/> I'm asking for a proper crossing here.
Incorrect: This road has been unsafe for months. <break time="0.5s"/> Residents are asking for a proper crossing. <break time="0.5s"/>

# STYLE (voice match)
Match this speaker's natural delivery while following all rules above.
- Direct, conversational, plainspoken. Talk straight to the viewer using you guys, folks, or guys naturally, not in every sentence.
- Blunt, punchy openers. Lead with a hard claim or a pointed rhetorical question (Where is the money? Who is rigging this?). No greetings.
- Urgent tone, but not every sentence is short. Occasional emphatic repetition is allowed, at most once per script (e.g. fight, fight, fight), and never to pad the word count.
- Frustrated but purposeful: name the problem plainly, then state the fix with conviction (I want, I'm going to fight for).
- **Use contractions throughout. Always prefer the contracted form: I'm over I am, I'll over I will, I've over I have, don't over do not, can't over cannot, that's over that is, it's over it is, we're over we are, they're over they are, won't over will not, isn't over is not, wasn't over was not, hasn't over has not, you're over you are. A script that avoids contractions sounds robotic and will be rewritten.**
- Plain words over policy jargon. Contractions are required, not optional, because they smooth the spoken line and match how the speaker actually talks.${buildFramingBullet(state)}
- Do not invent the speaker's personal finances, family details, dollar figures, donation asks, website, or biographical claims. Use such specifics only if they appear in the topic or angle.
- Fundraising or donation appeals and link below CTAs are off unless the angle explicitly asks for them.

# PERFORMANCE-INFORMED GUIDANCE
${guidanceText}

Treat the section above as a soft steer only, not a rule. If it is empty, ignore it entirely. It never overrides any constraint in this prompt, including word counts, SSML rules, or the differentiation rules for the ${variantCount} versions.

# WRITING FOR THE EAR
These rules govern the words themselves. They matter more for flow than the pause tags do.
1. Vary sentence length on purpose. Every version must contain at least one very short sentence of three to six words and at least one longer sentence of ${longRange} words. A script built entirely from five-word sentences is the number one cause of choppy, word-by-word delivery.
2. Join clauses instead of chopping them. Use and, but, so, because, and that to connect related ideas into one spoken line, rather than splitting every thought into its own sentence.
3. Use commas inside sentences. Internal commas give the voice model its rhythm and stop it from flattening a long line into a monotone run.
4. Keep each spoken run between roughly six and sixteen words. If a run goes past sixteen words without a comma, the model will run out of breath and the delivery will sag. Add a comma at the natural breath point.
5. Write numbers as words. Write twenty five, not 25. Write percent, not the symbol. Write dollars and cents in words.
6. Do not use em dashes, ellipses, semicolons, parentheses, asterisks, or all caps. Voice models read them unpredictably. Commas, periods, and question marks only.
7. Avoid stacking three or more stressed single-syllable words in a row, which produces a clipped machine-gun effect. Break the run with a longer word or a comma.
8. Do not put a hard stop after a one or two word fragment. Fragments like Not anymore. Enough. read as stutters through TTS. Fold them into the sentence that follows.
9. Expand abbreviations and acronyms into how they should be spoken, unless the input itself provides them in a fixed form.
10. Before returning, read each version aloud in your head at speaking pace. If it sounds like a list of slogans rather than a person talking, rewrite it.

# PACING AND PAUSES (SSML)
Punctuation already produces natural pauses in the voice model. A break tag is for a pause that is deliberately longer or heavier than the punctuation alone would give. Tagging every sentence gap overrides the model's own prosody and is exactly what makes speech sound word-by-word.

## Placement
- Break budget: ${breakRange} break tags per version. Never fewer than ${numberWord(pacing.breaksMin)}, never more than ${numberWord(pacing.breaksMax)}.
- At least ${punctuationOnly} sentence ${boundary} in every version must be carried by punctuation alone, with no break tag.
- Never place more than one break tag inside a single sentence.
- Never open or close a script with a break tag.

Place a break only where a speaker would genuinely take a beat:
- immediately after the opening hook, to let the claim or question land
- before a contrast word that turns the argument, such as but, and yet, meanwhile
- at the pivot from describing the problem to stating the position (I want, I'm asking, I'm going to fight for)
- before a final emphasis phrase inside a sentence
- immediately before the closing line

Never place a break:
- between a subject and its verb
- around a single isolated word
- after a conjunction that opens a clause
- between an article and its noun
- inside the closing line
- mechanically after every sentence

## Duration
Seconds only, written as decimals. Allowed values, exactly these seven: 0.15s, 0.2s, 0.25s, 0.3s, 0.4s, 0.5s, 0.6s.
- 0.15s to 0.2s: a quick beat mid-sentence, usually right after a comma
- 0.25s to 0.3s: a normal beat between two closely connected sentences
- 0.4s: a real stop at the end of a block of thought
- 0.5s: a heavy landing pause, after the hook or before the position statement
- 0.6s: at most once per version, and only directly before the closing line

Rules on values:
- No two consecutive break tags may use the same value.
- Each version must use at least ${distinct} different values.
- Most breaks in a version should be 0.3s or shorter.

## Format
- Write exactly like this: \`<break time="0.3s"/>\`
- Lowercase s, no space before the unit, use decimals exactly as listed (0.15s, 0.2s, 0.25s, 0.3s, 0.4s, 0.5s, 0.6s), no other units, no other durations, never use the millisecond form (no ms suffix).
- Never wrap the script in \`<speak>\` tags.
- SSML appears in the ${variantCount} script fields only. Never in captions, title, hashtags, or any other field.

## Example pacing (pattern only, do not reuse the content)
Where's our money going? <break time="0.5s"/> The budget's quadrupled since I got here, folks, and nothing actually got better. Same roads, same waiting lists, and a bigger bill every single year. <break time="0.3s"/> That's not a mystery, that's a choice. <break time="0.4s"/> I want a real audit of every dollar, <break time="0.2s"/> and I'm going to fight for it. <break time="0.6s"/> ${exampleClose}
Note what this example does: breaks land on real beats, not after every sentence. Some sentence gaps run on punctuation alone. Sentence lengths swing widely. Values are all different from their neighbours. Contractions appear throughout. Copy the pattern, never the count: this example is written at one particular length, so keep to your own budget of ${breakRange} break tags.

# SCRIPT
Generate exactly ${variantCount} distinct script variations labeled ${versionList}. All ${variantCount} cover the same issue and angle, but each must differ meaningfully in its opening hook, mid-section phrasing, and closing line. The speaker's position and meaning must be identical across all ${variantCount}.
Each version follows this order:
1. Open on a strong factual or issue-focused hook. No greetings, introductions, filler, or background.
2. Briefly explain the issue.
3. State the position or proposal from the angle, in first person.

Differentiation rules:
- No two versions may share the same opening hook or sentence.
- No sentence may be copy-pasted between versions. Reword, reorder, or restructure instead.
- Vary the rhetorical approach. For example, one version opens with a hard claim, another with a rhetorical question, the third with a stark contrast or a here is what is happening frame.
- Vary the rhythm across versions. One can run shorter and punchier overall, another more flowing, while both still obey the sentence-length variety rule inside themselves.
- Vary the pause pattern too. The ${variantCount} versions should not have breaks in the same structural positions.
- **Vary the closing line across all ${variantCount} versions. Each version must end with a distinct, freshly generated closing line, and no two versions of the same script may end with the same phrasing.**

${buildClosingSection({ candidateName, office, variantCount })}

Each version also carries a label: 2-4 plain words naming the take it makes, e.g. Direct challenge, Personal stake, Cost to residents. The label is for the reviewer's picker and never appears in the script or captions.

Constraints, applied to each version independently:
- ${range} spoken words, excluding SSML tags and excluding the closing line.
- Plain, conversational language. No jargon or formal phrasing.
- Contractions required throughout. Do not write I am, I will, I have, do not, cannot, that is, it is, we are, they are, will not, is not, was not, has not, or you are anywhere in a script. Use the contracted form every time.
- No stage directions, emojis, or quotation marks.
- No additional issues, and no statistics unless explicitly provided.
- Every version ends with a freshly generated closing line as specified above, and no two versions in the same output share the same closing phrasing.

# CAPTIONS
One set of captions is generated for the shared issue and angle, written to work with whichever script version the client selects.
Applies to all five: plain text, no SSML, no emojis, no quotation marks, no hashtags inline. Stay factually consistent with the issue and angle and add no new claims. First person is allowed where it matches the scripts. Contractions are encouraged in captions for the same reason as in scripts.
- facebook_caption: one to two sentences, conversational and community-focused, slightly more explanatory than the others.
- instagram_caption: one to two short punchy sentences, written to sit above the hashtag block.
- youtube_caption: one to two sentences suitable as a Shorts description, making the issue clear.
- tiktok_caption: exactly one short attention-grabbing line.
- x_post_text: one standalone post under 280 characters, issue immediately clear. JSON syntax does not count toward the limit.

# OTHER FIELDS
- title: two to three keyword-style words, directly related to the topic. No punctuation, hashtags, or emojis.
- hashtags: array of strings, relevant and specific to the topic, without the hash symbol. No misleading or unrelated trending tags.
- platforms: array containing only these lowercase values: facebook, instagram, youtube, tiktok, x.

# CHECK BEFORE RETURNING
Flow and pauses, per version:
- ${capitalise(breakRange)} break tags. Not one after every sentence.
- At least ${punctuationOnly} sentence ${pacing.punctuationOnly === 1 ? "boundary runs" : "boundaries run"} on punctuation alone.
- No more than one break inside any single sentence.
- No break at the very start or very end of the script.
- Every value is one of 0.15s, 0.2s, 0.25s, 0.3s, 0.4s, 0.5s, 0.6s, written in the exact format with lowercase s and no ms suffix.
- No two consecutive breaks share a value, and at least ${distinct} different values appear.
- 0.6s is used at most once, and only before the closing line.
- At least one sentence of three to six words and one of ${longRange} words.
- No spoken run exceeds sixteen words without a comma.
- No em dashes, ellipses, semicolons, parentheses, asterisks, or all caps. No digits, symbols, or unexpanded abbreviations.
- No one or two word sentence fragments left standing alone.

Content:
- All ${variantCount} versions are ${range} spoken words, counted independently, excluding SSML and the closing line.
- Each version covers exactly one issue and opens on a different hook.
- No sentence is shared between versions.
- All ${variantCount} express the same position and meaning.
${buildClosingChecklist({ candidateName, office })}
- Each label is 2-4 plain words and matches what its version actually does.
- Voice matches the STYLE section: direct address, blunt opener, plain language, contractions throughout, no forced catchphrases.
- Scan every script for uncontracted forms: I am, I will, I have, do not, cannot, that is, it is, we are, they are, will not, is not, was not, has not, you are. If any appear, replace them before returning.
- No SSML appears in captions or any other field.
- Total spoken length of each version, script plus closing line plus pauses, should read at a natural pace in no more than ${seconds} seconds.

All fields:
- Nothing is invented, including personal detail, dollar figures, or CTAs not in the input.
- Title is two to three words. TikTok caption is one line. X post is under 280 characters.
- No quotation marks or emojis anywhere in the output.
- The scripts array contains exactly ${variantCount} items, one per version, in order.
- Output is valid JSON matching the schema exactly.`
}

function buildScriptOutputSchema({
  wordsMin = 75,
  wordsMax = 90,
  variantCount = 3,
} = {}) {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      title: {
        type: "string",
        description:
          "Very short video title, keyword style. No punctuation, no hashtags. Shared by every version.",
      },
      scripts: {
        type: "array",
        description: `${variantCount} distinct script variations on the same issue and angle. The reviewer selects one. Each version must differ in hook, phrasing, rhythm and closing line while expressing the same position.`,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            version: {
              type: "string",
              enum: versionLetters(variantCount),
              description: "Version label for the reviewer's picker.",
            },
            label: {
              type: "string",
              description:
                "2-4 plain words naming the take this version makes, for the reviewer's picker.",
            },
            script: {
              type: "string",
              description: `${wordsMin}-${wordsMax} spoken word talking-head script with SSML <break time="0.Xs"/> tags. Hook first; one issue paired with the speaker's solution. No emojis or quotation marks. Ends with the closing line.`,
            },
          },
          required: ["version", "label", "script"],
        },
      },
      facebook_caption: {
        type: "string",
        description:
          "1-2 sentence Facebook caption, conversational and community-focused. Plain text, no break tags.",
      },
      instagram_caption: {
        type: "string",
        description:
          "1-2 punchy sentences for Instagram that read well above hashtags. Plain text, no break tags.",
      },
      youtube_caption: {
        type: "string",
        description:
          "1-2 sentence YouTube Shorts description. Plain text, no break tags.",
      },
      tiktok_caption: {
        type: "string",
        description:
          "One short punchy TikTok caption line. Plain text, no break tags.",
      },
      x_post_text: {
        type: "string",
        description: "Punchy standalone X post, under 280 characters.",
      },
      hashtags: {
        type: "array",
        items: { type: "string" },
        description:
          "Relevant hashtags WITHOUT the # symbol. Shared across platforms.",
      },
      platforms: {
        type: "array",
        items: {
          type: "string",
          enum: ["facebook", "instagram", "youtube", "tiktok", "x"],
        },
        description: "Which platforms this video should post to.",
      },
    },
    required: [
      "title",
      "scripts",
      "facebook_caption",
      "instagram_caption",
      "youtube_caption",
      "tiktok_caption",
      "x_post_text",
      "hashtags",
      "platforms",
    ],
  }
}

module.exports = {
  buildScriptGenerationPrompt,
  buildScriptOutputSchema,
  versionLetters,
  estimateSeconds,
}
