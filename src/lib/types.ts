export type TrendTopic = {
  title: string;
  entityNames: string[];
  summary: string;
  searchVolume: number;
};

export type VideoScene = {
  id: string;
  headline: string;
  voiceover: string;
  onScreenText: string;
  visualPrompt: string;
};

export type VideoPlan = {
  topic: string;
  hook: string;
  title: string;
  description: string;
  hashtags: string[];
  scenes: VideoScene[];
  callToAction: string;
};

export type AgentRunStatus = "idle" | "running" | "success" | "error";

export type AgentRunSummary = {
  id: string;
  status: AgentRunStatus;
  startedAt: string;
  completedAt?: string;
  topic?: TrendTopic;
  videoPlan?: VideoPlan;
  youtubeVideoId?: string;
  youtubeUrl?: string;
  error?: string;
  artifacts?: {
    videoPath?: string;
    audioPath?: string;
    workspace?: string;
  };
};
