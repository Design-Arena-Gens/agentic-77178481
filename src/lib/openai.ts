import OpenAI from "openai";
import { requireEnv } from "./env";

let client: OpenAI | null = null;

export function getOpenAIClient() {
  if (!client) {
    client = new OpenAI({
      apiKey: requireEnv(
        "OPENAI_API_KEY",
        "needed for script, image, and audio generation",
      ),
    });
  }
  return client;
}
