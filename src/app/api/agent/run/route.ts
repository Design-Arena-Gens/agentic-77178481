import { NextResponse } from "next/server";
import { runAgent } from "@/lib/agent";
import { getAgentState, setAgentStatus, setCurrentRun } from "@/lib/state";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const state = getAgentState();
  if (state.currentStatus === "running") {
    return NextResponse.json(
      { error: "Agent is already running" },
      { status: 409 },
    );
  }

  let forceTopicTitle: string | undefined;
  try {
    const payload = await request.json();
    if (payload?.forceTopicTitle && typeof payload.forceTopicTitle === "string") {
      forceTopicTitle = payload.forceTopicTitle;
    }
  } catch {
    // ignore invalid body
  }

  setAgentStatus("running");

  const run = await runAgent({ forceTopicTitle });
  setCurrentRun(run);
  setAgentStatus(run.status === "running" ? "running" : run.status);

  const statusCode = run.status === "success" ? 200 : 500;
  return NextResponse.json(run, { status: statusCode });
}
