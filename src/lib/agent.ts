import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { generateSceneBackgrounds } from "./images";
import { synthesizeVoiceover } from "./audio";
import { composeSlides } from "./slides";
import { composeVerticalVideo } from "./video";
import { fetchTrendingTopics, selectTopTrend } from "./trends";
import { generateVideoPlan } from "./script";
import { uploadVideoToYouTube } from "./youtube";
import type { AgentRunSummary } from "./types";

type AgentOptions = {
  forceTopicTitle?: string;
};

async function createWorkspace(): Promise<string> {
  const base = path.join(os.tmpdir(), "trend-agent");
  await fs.mkdir(base, { recursive: true });
  return fs.mkdtemp(`${base}${path.sep}`);
}

async function cleanupWorkspace(dir: string) {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (error) {
    console.warn("Failed to cleanup workspace", error);
  }
}

async function pickTrend(forceTitle?: string) {
  const trends = await fetchTrendingTopics();

  if (forceTitle) {
    const match = trends.find(
      (trend) => trend.title.toLowerCase() === forceTitle.toLowerCase(),
    );
    if (match) {
      return match;
    }
  }

  return selectTopTrend(trends);
}

export async function runAgent(
  options: AgentOptions = {},
): Promise<AgentRunSummary> {
  const runId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const workspace = await createWorkspace();

  const summary: AgentRunSummary = {
    id: runId,
    status: "running",
    startedAt,
    artifacts: {
      workspace,
    },
  };

  try {
    const trend = await pickTrend(options.forceTopicTitle);
    summary.topic = trend;

    const plan = await generateVideoPlan(trend);
    summary.videoPlan = plan;

    const backgrounds = await generateSceneBackgrounds(
      plan.scenes,
      workspace,
    );

    const slides = await composeSlides(plan.scenes, backgrounds, workspace);

    const audioPath = await synthesizeVoiceover(
      plan.scenes.map((scene) => scene.voiceover),
      workspace,
    );

    const videoPath = await composeVerticalVideo({
      slidePaths: slides,
      audioPath,
      workspaceDir: workspace,
      secondsPerSlide: Math.max(5, Math.floor(55 / plan.scenes.length)),
    });

    summary.artifacts = {
      ...summary.artifacts,
      audioPath,
      videoPath,
      workspace,
    };

    const { videoId, url } = await uploadVideoToYouTube(
      videoPath,
      plan,
      trend,
    );

    summary.youtubeVideoId = videoId;
    summary.youtubeUrl = url;
    summary.status = "success";
    summary.completedAt = new Date().toISOString();
    return summary;
  } catch (error) {
    summary.status = "error";
    summary.error =
      error instanceof Error ? error.message : "Unknown error occurred";
    summary.completedAt = new Date().toISOString();
    return summary;
  } finally {
    // Keep workspace around on error for debugging.
    if (summary.status === "success") {
      await cleanupWorkspace(workspace);
      if (summary.artifacts) {
        summary.artifacts.workspace = "(cleaned)";
        summary.artifacts.audioPath = "(uploaded)";
        summary.artifacts.videoPath = "(uploaded)";
      }
    }
  }
}
