import { create } from "zustand";
import { gateway, GatewayStatus, GatewayMessage } from "../lib/gateway";
import { toast } from "sonner";

/* ── Types ── */

export type AgentStatus = "working" | "thinking" | "idle" | "done" | "error";
export type View = "floor" | "calendar" | "skills" | "feed" | "sandbox" | "livebuild" | "system";
export type SystemTab = "grid" | "timeline" | "map";
export type { GatewayStatus };

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

export interface SystemCronJob {
  id: string;
  name: string;
  enabled: boolean;
  schedule: { kind: string; expr: string; tz: string };
  payload: { model: string; message: string; kind: string };
  delivery: { threadId: number | null; to: string; mode: string };
  state: {
    consecutiveErrors: number;
    lastRunAtMs: number;
    nextRunAtMs: number;
    lastRunStatus: string;
    lastDurationMs: number;
  };
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

export interface ActiveSession {
  id: string;
  model: string;
  status: string;
  startedAt: number;
  jobName?: string;
  task?: string;
}

export interface GatewayLogEntry {
  ts: number;
  type: string;
  name: string;
  detail: string;
}

/* ── Store interface ── */

interface ClubStore {
  view: View;
  setView: (v: View) => void;
  agents: Agent[];
  cronJobs: CronJob[];
  feed: FeedItem[];
  skills: Skill[];
  jobs: SystemCronJob[];
  setJobs: (jobs: SystemCronJob[]) => void;
  activeSystemTab: SystemTab;
  setActiveSystemTab: (tab: SystemTab) => void;
  gatewayStatus: GatewayStatus;
  setGatewayStatus: (s: GatewayStatus) => void;
  activeSessions: ActiveSession[];
  setActiveSessions: (sessions: ActiveSession[]) => void;
  recentEvents: GatewayLogEntry[];
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, patch: Partial<Agent>) => void;
  removeAgent: (id: string) => void;
  setCronJobs: (jobs: CronJob[]) => void;
  addFeedItem: (item: FeedItem) => void;
  markFeedRead: (id: string) => void;
}

/* ── Store ── */

export const useClubStore = create<ClubStore>((set) => ({
  view: "floor",
  setView: (view) => set({ view }),
  agents: [],
  cronJobs: [],
  feed: [],
  skills: [],
  jobs: [],
  setJobs: (jobs) => set({ jobs }),
  activeSystemTab: "grid",
  setActiveSystemTab: (activeSystemTab) => set({ activeSystemTab }),
  gatewayStatus: "disconnected",
  setGatewayStatus: (gatewayStatus) => set({ gatewayStatus }),
  activeSessions: [],
  setActiveSessions: (activeSessions) => set({ activeSessions }),
  recentEvents: [],
  addAgent: (agent) => set((s) => ({ agents: [...s.agents, agent] })),
  updateAgent: (id, patch) =>
    set((s) => ({ agents: s.agents.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
  removeAgent: (id) => set((s) => ({ agents: s.agents.filter((a) => a.id !== id) })),
  setCronJobs: (cronJobs) => set({ cronJobs }),
  addFeedItem: (item) => set((s) => ({ feed: [item, ...s.feed].slice(0, 200) })),
  markFeedRead: (id) =>
    set((s) => ({ feed: s.feed.map((f) => (f.id === id ? { ...f, read: true } : f)) })),
}));

/* ── Gateway → Store wiring ── */

function emojiForModel(model: string): string {
  const m = model.toLowerCase();
  if (m.includes("sonnet")) return "\uD83C\uDFB5";
  if (m.includes("opus")) return "\uD83C\uDFAD";
  if (m.includes("haiku")) return "\uD83C\uDF38";
  if (m.includes("local") || m.includes("llama") || m.includes("mistral")) return "\uD83D\uDDA5\uFE0F";
  return "\uD83E\uDD16";
}

function mapSessionStatus(status: string): AgentStatus {
  const s = status.toLowerCase();
  if (s === "running" || s === "active" || s === "working") return "working";
  if (s === "thinking" || s === "pending") return "thinking";
  if (s === "done" || s === "completed" || s === "complete") return "done";
  if (s === "error" || s === "failed") return "error";
  return "idle";
}

function sessionsToAgents(sessions: ActiveSession[]): Agent[] {
  return sessions.map((s, i) => ({
    id: s.id,
    name: s.jobName || s.model?.split("/").pop()?.slice(0, 14) || "Session",
    emoji: emojiForModel(s.model || ""),
    status: mapSessionStatus(s.status),
    task: s.task || `${s.model} session`,
    spawnedAt: new Date(s.startedAt || Date.now()),
    position: { x: 15 + (i * 18) % 70, y: 60 },
  }));
}

function emojiForJob(name: string): string {
  const n = name.toLowerCase();
  if (/intelligen|research|deal flow|nvidia|war room|blog digest/i.test(n)) return "\uD83D\uDD0D";
  if (/email|triage|yahoo/i.test(n)) return "\uD83D\uDCE7";
  if (/system|health|gateway|heartbeat|maintenance|log watch|model optim/i.test(n)) return "\u2699\uFE0F";
  if (/memory|kb growth|distillation|session wrap|weekly review|backup/i.test(n)) return "\uD83E\uDDE0";
  if (/financ|invest|portfolio|bill/i.test(n)) return "\uD83D\uDCB0";
  if (/calendar/i.test(n)) return "\uD83D\uDCC5";
  if (/home|hue|trash|neighborhood/i.test(n)) return "\uD83C\uDFE0";
  if (/factory/i.test(n)) return "\uD83C\uDFD7\uFE0F";
  if (/brief|digest/i.test(n)) return "\uD83D\uDCF0";
  return "\uD83E\uDD16";
}

function deriveAgentsFromJobs(jobs: SystemCronJob[]) {
  function humanSchedule(expr: string): string {
    const parts = expr.split(" ");
    if (parts.length < 5) return expr;
    const [min, hr] = parts;
    if (min.startsWith("*/")) return `Every ${min.slice(2)}m`;
    if (hr.startsWith("*/")) return `Every ${hr.slice(2)}h`;
    const hi = parseInt(hr), mi = parseInt(min);
    if (isNaN(hi)) return expr;
    const ampm = hi >= 12 ? "pm" : "am";
    const h12 = hi === 0 ? 12 : hi > 12 ? hi - 12 : hi;
    return `Daily ${h12}:${String(mi).padStart(2, "0")}${ampm}`;
  }

  const sorted = [...jobs]
    .filter((j) => j.state?.lastRunAtMs)
    .sort((a, b) => (b.state?.lastRunAtMs ?? 0) - (a.state?.lastRunAtMs ?? 0))
    .slice(0, 6);

  const agents: Agent[] = sorted.map((job, i) => {
    const errors = job.state?.consecutiveErrors ?? 0;
    let status: AgentStatus = "idle";
    if (errors > 0) status = "error";
    else if (job.state?.lastRunStatus === "ok" && job.state.lastRunAtMs > Date.now() - 3600000) status = "done";

    return {
      id: job.id,
      name: job.name.length > 14 ? job.name.slice(0, 14).trim() : job.name,
      emoji: emojiForJob(job.name),
      status,
      task: `${job.name.slice(0, 40)} \u2014 ${humanSchedule(job.schedule?.expr ?? "")}`,
      spawnedAt: new Date(job.state?.lastRunAtMs || Date.now()),
      position: { x: 12 + (i * 16) % 76, y: 60 },
    };
  });

  useClubStore.setState({ agents });
}

async function fetchJobsFromGateway() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await gateway.get<any[]>("/cron/jobs");
    if (!Array.isArray(data)) return;

    const jobs = data as SystemCronJob[];
    useClubStore.getState().setJobs(jobs);

    // Derive CronJob for calendar
    const cronJobs: CronJob[] = data.map((j) => ({
      jobId: j.id || j.jobId,
      name: j.name,
      enabled: j.enabled !== false,
      schedule: j.schedule || { kind: "cron" },
      description: j.payload?.message || j.description,
      nextRun: j.state?.nextRunAtMs ? new Date(j.state.nextRunAtMs) : undefined,
      lastRun: j.state?.lastRunAtMs ? new Date(j.state.lastRunAtMs) : undefined,
    }));
    useClubStore.getState().setCronJobs(cronJobs);

    // Derive agents from jobs (if no active sessions)
    if (useClubStore.getState().activeSessions.length === 0) {
      deriveAgentsFromJobs(jobs);
    }
  } catch (err) {
    console.warn("[gateway] Failed to fetch jobs:", err);
  }
}

async function fetchSessionsFromGateway() {
  try {
    const data = await gateway.get<ActiveSession[]>("/sessions");
    if (!Array.isArray(data)) return;
    useClubStore.getState().setActiveSessions(data);
    if (data.length > 0) {
      useClubStore.setState({ agents: sessionsToAgents(data) });
    }
  } catch {
    // Sessions endpoint may not exist — agents derived from jobs instead
  }
}

function handleMessage(msg: GatewayMessage) {
  const store = useClubStore.getState();
  const type = String(msg.type || msg.kind || msg.event || "message");
  const name = String(msg.name || msg.jobName || msg.sessionId || type);
  const detail = String(msg.text || msg.message || msg.detail || msg.error || "");

  // Log entry
  const entry: GatewayLogEntry = { ts: Date.now(), type, name, detail };
  useClubStore.setState((s) => ({
    recentEvents: [...s.recentEvents, entry].slice(-500),
  }));

  // Feed item
  const feedType: FeedItem["type"] =
    type.includes("error") || type.includes("fail") ? "alert" :
    type.includes("heartbeat") || type.includes("health") ? "heartbeat" :
    type.includes("session") || type.includes("agent") ? "agent" :
    "system";

  store.addFeedItem({
    id: `gw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: feedType,
    title: name,
    body: detail || JSON.stringify(msg).slice(0, 200),
    timestamp: new Date(typeof msg.timestamp === "number" ? msg.timestamp : Date.now()),
    read: false,
  });

  // Toasts for job lifecycle
  if (type.includes("job.started") || type === "job_started") {
    toast.info(`Job started: ${name}`, { duration: 3000 });
  }
  if (type.includes("job.completed") || type === "job_completed" || type.includes("job.done")) {
    const dur = Number(msg.durationMs || msg.duration || 0);
    const durStr = dur > 0 ? ` (${Math.round(dur / 1000)}s)` : "";
    toast.success(`Job completed: ${name}${durStr}`, { duration: 4000 });
    fetchJobsFromGateway();
  }
  if (type.includes("job.failed") || type === "job_failed") {
    const errStr = String(msg.error || msg.message || "Unknown error").slice(0, 100);
    toast.error(`Job failed: ${name}`, { description: errStr, duration: 6000 });
    fetchJobsFromGateway();
  }
  if (type.includes("session")) {
    fetchSessionsFromGateway();
  }
}

/* ── Init ── */

let _initialized = false;

export function initGateway() {
  if (_initialized) return;
  _initialized = true;

  let wasConnected = false;

  gateway.onStatus((status) => {
    useClubStore.getState().setGatewayStatus(status);

    if (status === "connected") {
      if (!wasConnected) {
        toast.success("Gateway connected", { duration: 3000 });
      }
      wasConnected = true;
      fetchJobsFromGateway();
      fetchSessionsFromGateway();
    } else if (status === "disconnected" && wasConnected) {
      toast.warning("Gateway offline \u2014 reconnecting...", { duration: 5000 });
    }
  });

  gateway.onMessage(handleMessage);
  gateway.connect();

  // Periodic refresh while connected
  setInterval(() => {
    if (gateway.status === "connected") {
      fetchJobsFromGateway();
      fetchSessionsFromGateway();
    }
  }, 30000);
}

// Auto-initialize on module load
initGateway();
