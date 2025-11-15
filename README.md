# Auto Trend Shorts Agent

This project provisions a fully automated pipeline that researches trending topics, assembles a faceless short-form video, and uploads it directly to YouTube. It is built with Next.js so it can be deployed on Vercel, and exposes REST endpoints to trigger the agent or monitor its status.

## Features

- Pulls fresh trends using the Google Trends API (region configurable).
- Uses OpenAI to plan a 45–60 second script, generate B-roll imagery, and synthesize a natural voiceover.
- Renders vertical slides with cinematic backgrounds, overlay text, and exports a 9:16 MP4 using FFmpeg.
- Uploads the rendered video to YouTube Shorts using OAuth credentials.
- Provides a dashboard to trigger runs manually, view the latest status, and inspect recent automation history.
- Includes a cron-friendly endpoint (`/api/cron`) for scheduled publishing on Vercel.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` → `.env.local` and supply valid credentials:

- `OPENAI_API_KEY` – used for script generation, image synthesis, and voiceover (Audio Speech API).
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` – OAuth credentials with **YouTube Data API v3** access and `youtube.upload` scope.
- Optional: adjust `DEFAULT_TREND_REGION`, `YOUTUBE_CATEGORY_ID`, `YOUTUBE_PRIVACY_STATUS`, etc.

### 3. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000` to access the control panel. Triggering the agent will spin up the full automation workflow.

## Production Deployment

1. Push the project to a Git repository.
2. Create a Vercel project (`vercel deploy --prod`) with the environment variables from `.env.local`.
3. Configure a cron job in Vercel to hit `https://<your-domain>/api/cron` at your preferred cadence.
4. Monitor the dashboard or Vercel logs to confirm successful runs.

## Troubleshooting

- Ensure the OAuth refresh token was generated with offline access and includes `https://www.googleapis.com/auth/youtube.upload`.
- The OpenAI Audio Speech endpoint can occasionally throttle; the agent retries trend fetching but not TTS. Re-run if it fails.
- FFmpeg rendering uses `ffmpeg-static`. If you need custom filters, adjust `composeVerticalVideo` in `src/lib/video.ts`.

## License

MIT
