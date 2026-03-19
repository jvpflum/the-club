import { create } from "zustand";

export type AgentStatus = "working" | "thinking" | "idle" | "done" | "error";
export type View = "floor" | "calendar" | "skills" | "feed" | "sandbox";

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  status: AgentStatus;
  task?: string;
  progress?: number;
  spawnedAt: Date;
  position: { x: number; y: number };
}

export interface CronJob {
  jobId: string;
  name: string;
  enabled: boolean;
  schedule: { kind: string; expr?: string; tz?: string };
  nextRun?: Date;
  lastRun?: Date;
  description?: string;
}

export interface FeedItem {
  id: string;
  type: "brief" | "alert" | "heartbeat" | "agent" | "system";
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  emoji: string;
  installed: boolean;
  enabled: boolean;
  version?: string;
}

interface ClubStore {
  view: View;
  setView: (v: View) => void;
  agents: Agent[];
  cronJobs: CronJob[];
  feed: FeedItem[];
  skills: Skill[];
  gatewayConnected: boolean;
  setGatewayConnected: (v: boolean) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, patch: Partial<Agent>) => void;
  removeAgent: (id: string) => void;
  setCronJobs: (jobs: CronJob[]) => void;
  addFeedItem: (item: FeedItem) => void;
  markFeedRead: (id: string) => void;
}

export const useClubStore = create<ClubStore>((set) => ({
  view: "floor",
  setView: (view) => set({ view }),
  agents: [
    {
      id: "juiceclaw-main",
      name: "JuiceClaw",
      emoji: "🧃",
      status: "idle",
      task: "Watching the beach...",
      spawnedAt: new Date(),
      position: { x: 20, y: 60 },
    },
  ],
  cronJobs: [
    {
      jobId: "morning-brief-0d26f218",
      name: "Morning Brief",
      enabled: true,
      schedule: { kind: "cron", expr: "0 7 * * *", tz: "America/Los_Angeles" },
      description: "Daily executive briefing — weather, NVIDIA news, AI industry, global events",
    },
  ],
  feed: [
    {
      id: "welcome",
      type: "system",
      title: "Welcome to The Club 🏖️",
      body: "Your AI mission control is live. Agents are standing by.",
      timestamp: new Date(),
      read: false,
    },
  ],
  skills: [
    { id: "github", name: "GitHub", emoji: "🐙", description: "Issues, PRs, CI runs via gh CLI", installed: true, enabled: true, version: "1.0.0" },
    { id: "weather", name: "Weather", emoji: "🌤️", description: "Current weather and forecasts via wttr.in", installed: true, enabled: true, version: "1.0.0" },
    { id: "discord", name: "Discord", emoji: "💬", description: "Discord channel operations", installed: true, enabled: true, version: "1.0.0" },
    { id: "gh-issues", name: "GH Issues", emoji: "🔧", description: "Auto-fix GitHub issues and open PRs", installed: true, enabled: false, version: "1.0.0" },
    { id: "clawhub", name: "ClawHub", emoji: "🦞", description: "Browse and install new skills", installed: true, enabled: true, version: "1.0.0" },
    { id: "oracle", name: "Oracle", emoji: "🔮", description: "Prompt + file bundling engine", installed: false, enabled: false },
  ],
  gatewayConnected: false,
  setGatewayConnected: (gatewayConnected) => set({ gatewayConnected }),
  addAgent: (agent) => set((s) => ({ agents: [...s.agents, agent] })),
  updateAgent: (id, patch) =>
    set((s) => ({ agents: s.agents.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
  removeAgent: (id) => set((s) => ({ agents: s.agents.filter((a) => a.id !== id) })),
  setCronJobs: (cronJobs) => set({ cronJobs }),
  addFeedItem: (item) => set((s) => ({ feed: [item, ...s.feed] })),
  markFeedRead: (id) =>
    set((s) => ({ feed: s.feed.map((f) => (f.id === id ? { ...f, read: true } : f)) })),
}));
