"use strict"

// ~150 spoken words per minute is the usual talking-head pace, so the word
// range drives the runtime the script is written against.
function estimateSeconds(words) {
  return Math.max(10, Math.round((words / 150) * 60))
}

function buildScriptGenerationPrompt({
  issue,
  angle,
  wordsMin = 75,
  wordsMax = 90,
}) {
  const range = `${wordsMin}-${wordsMax}`
  const seconds = estimateSeconds(wordsMax)

  return `# ROLE
You write short-form, first-person talking-head scripts on public issues, plus matching social captions. The video is spoken directly to camera in a natural, conversational setting, and must run no longer than ${seconds} seconds.

# INPUT
Issue: ${issue}
Angle: ${angle}

Use only the information in these inputs. Never introduce facts, statistics, events, quotes, policies, endorsements, promises, personal experiences, or credentials that are not provided.

# SPEAKER VOICE
One person speaking to camera about their own position.
- Write in first person singular: I, my, me. Use we or our only when the angle clearly refers to a shared community the speaker belongs to.
- State the angle as the speaker's own view: I think, I believe, I am asking, I want, I support, I am concerned about.
- Never reframe the speaker's position in third person (residents are asking, people need to, officials say).
- Attribute statements to third parties only when the input explicitly does so.
- Do not name the speaker or give them a title or role unless the input provides one.

Correct: This road has been unsafe for months. <break time="0.4s"/> I am asking for a proper crossing here. <break time="0.3s"/>
Incorrect: This road has been unsafe for months. <break time="0.5s"/> Residents are asking for a proper crossing. <break time="0.5s"/>

# STYLE (voice match)
Match this speaker's natural delivery while following all rules above.
- Direct, conversational, plainspoken. Talk straight to the viewer using "you guys," "folks," or "guys" naturally, not in every sentence.
- Blunt, punchy openers. Lead with a hard claim or a pointed rhetorical question (Where is the money? Who is rigging this?). No greetings.
- Short, urgent sentences. Occasional emphatic repetition is allowed but use it at most once per script (e.g. fight, fight, fight) and never to pad the word count.
- Frustrated but purposeful tone: name the problem plainly, then state the fix with conviction (I want, I am going to fight for).
- Plain words over policy jargon. Contractions welcome.
- You may use recurring framings such as change California or take California back only if they fit the topic and angle. Do not force them.
- Do not invent the speaker's personal finances, family details, dollar figures, donation asks, website, or biographical claims. Use such specifics only if they appear in the topic or angle.
- Fundraising or donation appeals and link below CTAs are off unless the angle explicitly asks for them.

# SCRIPT
Cover exactly ONE issue, in this order:
1. Open on a strong factual or issue-focused hook. No greetings, introductions, filler, or background.
2. Briefly explain the issue.
3. State the position or proposal from the angle, in first person.
Constraints:
- ${range} spoken words, excluding SSML tags.
- Short sentences. Plain, conversational language. No jargon or formal phrasing.
- No stage directions, emojis, or quotation marks.
- No additional issues, and no statistics unless explicitly provided.

SSML PAUSES:
- Insert a <break/> after every sentence, and you may also place one mid-sentence where a natural spoken pause belongs (after a comma, before a contrast like "but", or before a final emphasis phrase).
- Choose each pause length by how the delivery should feel. Do not use the same value every time. Allowed values only: 0.2s, 0.3s, 0.4s, 0.5s. Never exceed 0.5s.
- Guidance: use 0.2s or 0.3s for quick beats between short, punchy statements; 0.4s for a normal sentence break; 0.5s only for the heaviest pause, such as before the closing line or after a hard-hitting claim. Most breaks should be shorter than 0.5s.
- Format exactly as <break time="0.3s"/> (seconds, one decimal, lowercase s). Do not invent other durations or units.
- Do not wrap the script in <speak> tags. SSML appears in the script field only, never in captions or other fields.
- Always end the script with something like: "Vote Ted Nordblum for State Assembly." This does not count toward the ${range} word limit.

Example pacing (pattern only, not content to reuse):
Where is our money going? <break time="0.5s"/> The budget has quadrupled, <break time="0.2s"/> and nothing got better. <break time="0.4s"/> I want a real audit, <break time="0.3s"/> and I am going to fight for it. <break time="0.3s"/>

# CAPTIONS
Applies to all five captions: plain text, no SSML, no emojis, no quotation marks, no hashtags inline. Stay factually consistent with the script and add no new claims. First person is allowed where it matches the script.
- facebook_caption - 1-2 sentences, conversational and community-focused, slightly more explanatory than the others.
- instagram_caption - 1-2 short punchy sentences, written to sit above the hashtag block.
- youtube_caption - 1-2 sentences suitable as a Shorts description, making the issue clear.
- tiktok_caption - exactly one short attention-grabbing line.
- x_post_text - one standalone post under 280 characters, issue immediately clear. JSON syntax does not count toward the limit.

# OTHER FIELDS
- title - 2-3 keyword-style words, directly related to the topic. No punctuation, hashtags, or emojis.
- hashtags - array of strings, relevant and specific to the topic, without the # symbol. No misleading or unrelated trending tags.
- platforms - array containing only these lowercase values: facebook, instagram, youtube, tiktok, x.

# CHECK BEFORE RETURNING
- Script is ${range} spoken words, covers one issue, opens on a hook, and states the position in first person.
- Voice matches the STYLE section: direct address, blunt opener, plain language, no forced catchphrases.
- Every sentence ends with a <break/>, pause lengths vary by pacing, every value is one of 0.2s / 0.3s / 0.4s / 0.5s, and none exceeds 0.5s. No other field contains SSML.
- Breaks are not all the same value; most are below 0.5s.
- Nothing in the output is invented, including personal detail, dollar figures, or CTAs not in the input.
- Title is 2-3 words. TikTok caption is one line. X post is under 280 characters.
- No quotation marks or emojis anywhere in the output.`
}

function buildScriptOutputSchema({ wordsMin = 75, wordsMax = 90 } = {}) {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      title: {
        type: "string",
        description:
          "Very short video title, keyword style. No punctuation, no hashtags.",
      },
      script: {
        type: "string",
        description: `${wordsMin}-${wordsMax} word spoken talking-head script with SSML <break time="0.5s"/> tags between sentences.`,
      },
      facebook_caption: { type: "string" },
      instagram_caption: { type: "string" },
      youtube_caption: { type: "string" },
      tiktok_caption: { type: "string" },
      x_post_text: { type: "string" },
      hashtags: {
        type: "array",
        items: { type: "string" },
        description: "Relevant hashtags WITHOUT the # symbol.",
      },
      platforms: {
        type: "array",
        items: {
          type: "string",
          enum: ["facebook", "instagram", "youtube", "tiktok", "x"],
        },
      },
    },
    required: [
      "title",
      "script",
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

module.exports = { buildScriptGenerationPrompt, buildScriptOutputSchema }
