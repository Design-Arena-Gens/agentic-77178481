"use client";

import { FormEvent, useState } from "react";
import useSWR from "swr";

type AgentStatusResponse = {
  status: string;
  currentRun?: AgentRunSummary;
  history: AgentRunSummary[];
};

type AgentRunSummary = {
  id: string;
  status: "idle" | "running" | "success" | "error";
  startedAt: string;
  completedAt?: string;
  topic?: {
    title: string;
    summary: string;
    searchVolume: number;
  };
  videoPlan?: {
    hook: string;
    title: string;
    description: string;
    hashtags: string[];
    callToAction: string;
  };
  youtubeVideoId?: string;
  youtubeUrl?: string;
  error?: string;
};

const fetcher = (url: string) =>
  fetch(url).then((response) => {
    if (!response.ok) throw new Error("Failed to fetch agent status");
    return response.json();
  });

export default function Home() {
  const { data, mutate, isLoading, error } = useSWR<AgentStatusResponse>(
    "/api/agent/status",
    fetcher,
    {
      refreshInterval: 10_000,
    },
  );
  const [submitting, setSubmitting] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const currentRun = data?.currentRun;
  const handleTrigger = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setFormError(null);

    const payload = customTopic.trim()
      ? { forceTopicTitle: customTopic.trim() }
      : undefined;

    try {
      const response = await fetch("/api/agent/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: payload ? JSON.stringify(payload) : undefined,
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error ?? "Agent run failed");
      }

      await mutate();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to trigger agent run",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-white/10 bg-neutral-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.35rem] text-pink-400">
              Auto Trend Studio
            </p>
            <h1 className="text-2xl font-semibold text-white">
              Viral Shorts Automation
            </h1>
          </div>
          <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70">
            Status:{" "}
            <span
              className={`font-semibold ${
                data?.status === "running"
                  ? "text-amber-400"
                  : data?.status === "success"
                    ? "text-emerald-400"
                    : data?.status === "error"
                      ? "text-red-400"
                      : "text-white"
              }`}
            >
              {isLoading ? "loading..." : data?.status ?? "idle"}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-6 py-10 lg:grid-cols-[2fr,1fr]">
        <section className="space-y-6 rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl shadow-pink-500/5">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Latest automation
              </h2>
              <p className="mt-2 text-sm text-white/60">
                The agent fetches trending topics, generates a video, and uploads
                it to your faceless channel automatically.
              </p>
            </div>
            <span className="inline-flex h-10 items-center rounded-full bg-pink-500/10 px-4 text-xs font-medium uppercase tracking-[0.3rem] text-pink-300">
              Agent
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between text-sm">
                <p className="text-white/70">Current run</p>
                <p className="font-semibold text-white">
                  {currentRun ? new Date(currentRun.startedAt).toLocaleString() : "—"}
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3rem] text-white/40">
                    Trend
                  </p>
                  <p className="mt-2 text-base font-medium text-white">
                    {currentRun?.topic?.title ?? "Waiting..."}
                  </p>
                  <p className="mt-1 text-sm text-white/60">
                    {currentRun?.topic?.summary ?? "The agent will summarize the top trend before scripting."}
                  </p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3rem] text-white/40">
                    Outcome
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">
                    {currentRun?.status ?? "idle"}
                  </p>
                  <p className="mt-1 text-sm text-white/60">
                    {currentRun?.youtubeUrl ? (
                      <a
                        href={currentRun.youtubeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-pink-300 hover:text-pink-200"
                      >
                        View latest upload →
                      </a>
                    ) : currentRun?.error ? (
                      currentRun.error
                    ) : (
                      "Run the agent to publish a new video."
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-pink-500/20 bg-pink-400/5 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.25rem] text-pink-200">
              Manual trigger
            </h3>
            <form className="mt-4 space-y-4" onSubmit={handleTrigger}>
              <div>
                <label
                  htmlFor="custom-topic"
                  className="text-xs uppercase tracking-[0.3rem] text-white/40"
                >
                  Optional override
                </label>
                <input
                  id="custom-topic"
                  type="text"
                  value={customTopic}
                  onChange={(event) => setCustomTopic(event.target.value)}
                  placeholder="Focus on a specific trending keyword"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-400/40"
                />
              </div>

              {formError ? (
                <p className="text-sm text-red-400">{formError}</p>
              ) : null}

              <button
                type="submit"
                disabled={submitting || data?.status === "running"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-pink-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:bg-pink-500/50"
              >
                {submitting ? "Launching…" : "Generate & Upload Now"}
              </button>
            </form>
            <p className="mt-3 text-xs text-white/50">
              The agent runs end-to-end: trend discovery → script → slides →
              AI voiceover → ffmpeg render → YouTube upload.
            </p>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3rem] text-white/50">
              Recent runs
            </h3>
            <div className="mt-4 space-y-4">
              {error ? (
                <p className="text-sm text-red-400">
                  Failed to load status: {error.message}
                </p>
              ) : null}
              {currentRun && currentRun.status === "running" ? (
                <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
                  Agent is currently generating the next short…
                </div>
              ) : null}
              {data?.history?.length ? (
                data.history.map((run) => (
                  <article
                    key={run.id}
                    className="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-4"
                  >
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span>{new Date(run.startedAt).toLocaleString()}</span>
                      <span
                        className={`font-semibold ${
                          run.status === "success"
                            ? "text-emerald-300"
                            : run.status === "error"
                              ? "text-red-300"
                              : "text-white"
                        }`}
                      >
                        {run.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white">
                      {run.topic?.title ?? "Unknown trend"}
                    </h4>
                    <p className="text-xs leading-relaxed text-white/60">
                      {run.topic?.summary ?? "Summary unavailable."}
                    </p>
                    {run.youtubeUrl ? (
                      <a
                        href={run.youtubeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-medium text-pink-300 hover:text-pink-200"
                      >
                        Watch on YouTube →
                      </a>
                    ) : run.error ? (
                      <p className="text-xs text-red-300">{run.error}</p>
                    ) : null}
                  </article>
                ))
              ) : (
                <p className="text-sm text-white/50">
                  No completed runs yet. Trigger the agent to publish your first
                  automated short.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3rem] text-white/50">
              Deployment checklist
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-white/60">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-pink-400" />
                <span>
                  Provide API keys via environment variables before running in
                  production:
                  <code className="ml-1 rounded bg-white/10 px-1.5 py-0.5 text-xs text-white">
                    OPENAI_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
                    GOOGLE_REFRESH_TOKEN
                  </code>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-pink-400" />
                <span>
                  Configure a Vercel cron job hitting <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-white">/api/cron</code>{" "}
                  to publish on your cadence.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-pink-400" />
                <span>
                  Ensure your Google Cloud project has YouTube Data API v3
                  enabled and the refresh token grants upload scope.
                </span>
              </li>
            </ul>
          </section>
        </aside>
      </main>
    </div>
  );
}
