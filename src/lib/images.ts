import fs from "node:fs/promises";
import path from "node:path";
import { getOpenAIClient } from "./openai";
import type { VideoScene } from "./types";

export async function generateSceneBackgrounds(
  scenes: VideoScene[],
  workspaceDir: string,
): Promise<string[]> {
  const client = getOpenAIClient();
  const outputDir = path.join(workspaceDir, "backgrounds");
  await fs.mkdir(outputDir, { recursive: true });

  const results: string[] = [];

  for (const scene of scenes) {
    const result = await client.images.generate({
      model: "gpt-image-1",
      size: "1024x1792",
      response_format: "b64_json",
      prompt: `Create a cinematic, vertical background image for a faceless video scene.
Scene headline: ${scene.headline}
Visual direction: ${scene.visualPrompt}
Style: Modern, high-contrast lighting, cinematic depth of field, suitable for overlaying bold typography.`,
    });

    const image = result.data?.[0]?.b64_json;
    if (!image) {
      throw new Error(`OpenAI image generation failed for scene ${scene.id}`);
    }

    const buffer = Buffer.from(image, "base64");
    const filePath = path.join(outputDir, `${scene.id}.png`);
    await fs.writeFile(filePath, buffer);
    results.push(filePath);
  }

  return results;
}
