import { getOpenAIClient } from "./openai";
import type { TrendTopic, VideoPlan } from "./types";

const videoPlanSchema = {
  type: "object",
  properties: {
    topic: { type: "string" },
    hook: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    hashtags: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
      maxItems: 10,
    },
    callToAction: { type: "string" },
    scenes: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          headline: { type: "string" },
          voiceover: { type: "string" },
          onScreenText: { type: "string" },
          visualPrompt: { type: "string" },
        },
        required: ["id", "headline", "voiceover", "onScreenText", "visualPrompt"],
        additionalProperties: false,
      },
    },
  },
  required: [
    "topic",
    "hook",
    "title",
    "description",
    "hashtags",
    "callToAction",
    "scenes",
  ],
  additionalProperties: false,
};

export async function generateVideoPlan(topic: TrendTopic): Promise<VideoPlan> {
  const client = getOpenAIClient();
  const schemaString = JSON.stringify(videoPlanSchema);

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    reasoning: { effort: "medium" },
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: `You are a viral content strategist who writes concise scripts for vertical short-form videos. 
Focus on hooks, storytelling, and clear viewer takeaways. The voice should be energetic, authoritative, and easy to follow. 
Return data that conforms exactly to the provided JSON schema.`,
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Create a 45-60 second video plan about the following trending topic.

Primary trend: ${topic.title}
Related keywords: ${topic.entityNames.join(", ") || "n/a"}
News summary: ${topic.summary}

Structure:
1. Provide a 120 character hook that grabs attention immediately.
2. Break the story into 3-5 scenes. Each scene must include:
   - headline: 5-8 word summary of the beat.
   - voiceover: 1-2 sentences for narration (max 220 characters).
   - onScreenText: punchy overlay text (max 80 characters).
   - visualPrompt: 1 sentence describing visuals for AI generation.
3. Deliver a compelling description (2 paragraphs max) optimized for YouTube Shorts.
4. Suggest 5-8 relevant hashtags.
5. End with a call-to-action aimed at boosting channel engagement.

Respond in JSON that matches the provided schema.`,
          },
          {
            type: "input_text",
            text: `Use this JSON schema and return ONLY valid minified JSON:\n${schemaString}`,
          },
        ],
      },
    ],
  });

  const payload = response.output_text;
  if (!payload) {
    throw new Error("OpenAI response did not include output_text");
  }

  try {
    const parsed = JSON.parse(payload) as VideoPlan;
    return parsed;
  } catch (error) {
    console.error("Failed to parse OpenAI plan payload", payload);
    throw error;
  }
}
