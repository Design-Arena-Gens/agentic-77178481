import { z } from "zod";

const envSchema = z.object({
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REFRESH_TOKEN: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  DEFAULT_TREND_REGION: z.string().optional(),
  YOUTUBE_CATEGORY_ID: z.string().optional(),
  YOUTUBE_DEFAULT_TAGS: z.string().optional(),
  YOUTUBE_PRIVACY_STATUS: z
    .enum(["public", "private", "unlisted"])
    .default("public"),
});

type EnvSchema = z.infer<typeof envSchema>;

const envValues: EnvSchema = envSchema.parse({
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
  DEFAULT_TREND_REGION: process.env.DEFAULT_TREND_REGION,
  YOUTUBE_CATEGORY_ID: process.env.YOUTUBE_CATEGORY_ID,
  YOUTUBE_DEFAULT_TAGS: process.env.YOUTUBE_DEFAULT_TAGS,
  YOUTUBE_PRIVACY_STATUS: process.env.YOUTUBE_PRIVACY_STATUS as
    | "public"
    | "private"
    | "unlisted"
    | undefined,
});

export function requireEnv<Key extends keyof EnvSchema>(
  key: Key,
  reason?: string,
): NonNullable<EnvSchema[Key]> {
  const value = envValues[key];
  if (!value) {
    const suffix = reason ? ` (${reason})` : "";
    throw new Error(`Missing required environment variable ${key}${suffix}`);
  }
  return value;
}

export function optionalEnv<Key extends keyof EnvSchema>(
  key: Key,
): EnvSchema[Key] {
  return envValues[key];
}
