import fs from "node:fs/promises";
import path from "node:path";
import { requireEnv } from "./env";

const OPENAI_TTS_ENDPOINT = "https://api.openai.com/v1/audio/speech";

export async function synthesizeVoiceover(
  scenesVoiceover: string[],
  workspaceDir: string,
): Promise<string> {
  const apiKey = requireEnv("OPENAI_API_KEY");
  const prompt = scenesVoiceover.join("\n\n");

  const response = await fetch(OPENAI_TTS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      format: "mp3",
      input: prompt,
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.text();
    throw new Error(
      `OpenAI TTS failed: ${response.status} ${response.statusText} - ${errorPayload}`,
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const audioDir = path.join(workspaceDir, "audio");
  await fs.mkdir(audioDir, { recursive: true });
  const voiceoverPath = path.join(audioDir, "voiceover.mp3");
  await fs.writeFile(voiceoverPath, buffer);
  return voiceoverPath;
}
