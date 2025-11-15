import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";

type ComposeVideoOptions = {
  slidePaths: string[];
  audioPath: string;
  workspaceDir: string;
  fps?: number;
  secondsPerSlide?: number;
};

function execFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const command = spawn(ffmpegPath ?? "ffmpeg", args, {
      stdio: ["ignore", "inherit", "inherit"],
    });

    command.on("error", reject);
    command.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with status ${code}`));
      }
    });
  });
}

export async function composeVerticalVideo({
  slidePaths,
  audioPath,
  workspaceDir,
  fps = 30,
  secondsPerSlide = 5,
}: ComposeVideoOptions): Promise<string> {
  if (!slidePaths.length) {
    throw new Error("No slides provided for video composition");
  }

  const sequencesDir = path.join(workspaceDir, "sequences");
  await fs.mkdir(sequencesDir, { recursive: true });

  // Copy slides into sequentially numbered files for ffmpeg compatibility.
  await Promise.all(
    slidePaths.map((slide, index) => {
      const targetPath = path.join(
        sequencesDir,
        `frame-${index.toString().padStart(4, "0")}.png`,
      );
      return fs.copyFile(slide, targetPath);
    }),
  );

  const outputVideoPath = path.join(workspaceDir, "render", "video.mp4");
  await fs.mkdir(path.dirname(outputVideoPath), { recursive: true });

  const inputPattern = path.join(sequencesDir, "frame-%04d.png");
  const args = [
    "-y",
    "-framerate",
    `${1 / secondsPerSlide}`,
    "-i",
    inputPattern,
    "-i",
    audioPath,
    "-c:v",
    "libx264",
    "-vf",
    "format=yuv420p",
    "-preset",
    "veryfast",
    "-r",
    `${fps}`,
    "-c:a",
    "aac",
    "-shortest",
    outputVideoPath,
  ];

  await execFfmpeg(args);
  return outputVideoPath;
}
