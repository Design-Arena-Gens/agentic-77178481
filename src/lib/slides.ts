import fs from "node:fs/promises";
import path from "node:path";
import {
  CanvasRenderingContext2D,
  createCanvas,
  loadImage,
} from "@napi-rs/canvas";
import type { VideoScene } from "./types";

const WIDTH = 1080;
const HEIGHT = 1920;

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const tentative = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(tentative);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = tentative;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function drawOverlayText(
  ctx: CanvasRenderingContext2D,
  lines: string[],
) {
  const lineHeight = 64;
  const totalHeight = lines.length * lineHeight;
  let y = HEIGHT - totalHeight - 180;

  ctx.fillStyle = "rgba(0,0,0,0.55)";
  const paddingX = 60;
  const paddingY = 40;
  const boxWidth = WIDTH - paddingX * 2;
  ctx.fillRect(
    paddingX,
    y - paddingY,
    boxWidth,
    totalHeight + paddingY * 2,
  );

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 54px 'Inter'";
  ctx.textAlign = "center";

  for (const line of lines) {
    ctx.fillText(line, WIDTH / 2, y);
    y += lineHeight;
  }
}

export async function composeSlides(
  scenes: VideoScene[],
  backgroundPaths: string[],
  workspaceDir: string,
): Promise<string[]> {
  const slidesDir = path.join(workspaceDir, "slides");
  await fs.mkdir(slidesDir, { recursive: true });

  const slidePaths: string[] = [];

  for (let index = 0; index < scenes.length; index += 1) {
    const scene = scenes[index];
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");

    // Background image
    const background = await loadImage(backgroundPaths[index]);
    const scale = Math.max(WIDTH / background.width, HEIGHT / background.height);
    const scaledWidth = background.width * scale;
    const scaledHeight = background.height * scale;
    const dx = (WIDTH - scaledWidth) / 2;
    const dy = (HEIGHT - scaledHeight) / 2;

    ctx.drawImage(background, dx, dy, scaledWidth, scaledHeight);

    // Gradient overlay for text readability
    const gradient = ctx.createLinearGradient(0, HEIGHT * 0.55, 0, HEIGHT);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.75)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, HEIGHT * 0.45, WIDTH, HEIGHT * 0.55);

    // Headline badge
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    const badgeX = WIDTH * 0.08;
    const badgeY = 120;
    const badgeWidth = WIDTH * 0.84;
    const badgeHeight = 120;
    const radius = 30;
    ctx.moveTo(badgeX + radius, badgeY);
    ctx.lineTo(badgeX + badgeWidth - radius, badgeY);
    ctx.quadraticCurveTo(
      badgeX + badgeWidth,
      badgeY,
      badgeX + badgeWidth,
      badgeY + radius,
    );
    ctx.lineTo(badgeX + badgeWidth, badgeY + badgeHeight - radius);
    ctx.quadraticCurveTo(
      badgeX + badgeWidth,
      badgeY + badgeHeight,
      badgeX + badgeWidth - radius,
      badgeY + badgeHeight,
    );
    ctx.lineTo(badgeX + radius, badgeY + badgeHeight);
    ctx.quadraticCurveTo(
      badgeX,
      badgeY + badgeHeight,
      badgeX,
      badgeY + badgeHeight - radius,
    );
    ctx.lineTo(badgeX, badgeY + radius);
    ctx.quadraticCurveTo(badgeX, badgeY, badgeX + radius, badgeY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#111111";
    ctx.font = "bold 48px 'Inter'";
    ctx.textAlign = "center";
    ctx.fillText(scene.headline, WIDTH / 2, badgeY + badgeHeight / 2 + 16);

    // On-screen text block
    ctx.font = "600 56px 'Inter'";
    ctx.textAlign = "center";
    const wrapped = wrapText(ctx, scene.onScreenText, WIDTH * 0.7);
    drawOverlayText(ctx, wrapped);

    const outputPath = path.join(
      slidesDir,
      `scene-${index.toString().padStart(2, "0")}.png`,
    );
    await fs.writeFile(outputPath, canvas.toBuffer("image/png"));
    slidePaths.push(outputPath);
  }

  return slidePaths;
}
