import fs from "node:fs";
import { google } from "googleapis";
import { optionalEnv, requireEnv } from "./env";
import type { VideoPlan, TrendTopic } from "./types";

type UploadResult = {
  videoId: string;
  url: string;
};

function getOauthClient() {
  const clientId = requireEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requireEnv("GOOGLE_CLIENT_SECRET");
  const redirectUri =
    optionalEnv("GOOGLE_REDIRECT_URI") ??
    "https://developers.google.com/oauthplayground";
  const refreshToken = requireEnv("GOOGLE_REFRESH_TOKEN");

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri,
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

export async function uploadVideoToYouTube(
  videoPath: string,
  plan: VideoPlan,
  topic: TrendTopic,
): Promise<UploadResult> {
  const oauth2Client = getOauthClient();
  const youtube = google.youtube({
    version: "v3",
    auth: oauth2Client,
  });

  const tags = [
    ...plan.hashtags.map((tag) => tag.replace(/^#/, "")),
    topic.title,
    ...topic.entityNames,
  ];

  const categoryId =
    optionalEnv("YOUTUBE_CATEGORY_ID") ??
    (topic.title.toLowerCase().includes("crypto") ? "19" : "24"); // 19 = Travel & Events, 24 = Entertainment

  const privacyStatus = optionalEnv("YOUTUBE_PRIVACY_STATUS") ?? "public";

  const request = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: plan.title,
        description: `${plan.hook}\n\n${plan.description}\n\n${plan.hashtags.join(" ")}`,
        categoryId,
        defaultLanguage: "en",
        tags,
      },
      status: {
        privacyStatus,
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: fs.createReadStream(videoPath),
    },
  });

  const videoId = request.data.id;
  if (!videoId) {
    throw new Error("YouTube API did not return a video ID");
  }

  return {
    videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
  };
}
