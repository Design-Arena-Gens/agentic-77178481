import { NextResponse } from "next/server";
import { runAgent } from "@/lib/agent";
import { getAgentState, setAgentStatus, setCurrentRun } from "@/lib/state";

export const runtime = "nodejs";

export async function GET() {
  const state = getAgentState();
  if (state.currentStatus === "running") {
    return NextResponse.json({ status: "skipped", reason: "already running" });
  }

  setAgentStatus("running");

  const run = await runAgent();
  setCurrentRun(run);
  setAgentStatus(run.status === "running" ? "running" : run.status);

  return NextResponse.json({ status: run.status, run });
}
