import { NextResponse } from "next/server";
import { getAgentState } from "@/lib/state";

export const runtime = "nodejs";

export async function GET() {
  const state = getAgentState();
  return NextResponse.json({
    status: state.currentStatus,
    currentRun: state.currentRun,
    history: state.history,
  });
}
