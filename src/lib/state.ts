import type { AgentRunSummary, AgentRunStatus } from "./types";

type AgentState = {
  currentStatus: AgentRunStatus;
  currentRun?: AgentRunSummary;
  history: AgentRunSummary[];
};

const state: AgentState = {
  currentStatus: "idle",
  history: [],
};

export function getAgentState() {
  return state;
}

export function setAgentStatus(status: AgentRunStatus) {
  state.currentStatus = status;
}

export function setCurrentRun(run: AgentRunSummary | undefined) {
  state.currentRun = run;
  if (run && run.status !== "running") {
    state.history.unshift(run);
    state.history = state.history.slice(0, 20);
  }
}
