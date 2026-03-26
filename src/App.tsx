import { useEffect, lazy, Suspense, useRef } from "react";
import { motion } from "framer-motion";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { toast } from "sonner";
import { Sidebar } from "./components/Sidebar";
import { useClubStore, AgentStatus } from "./store/useClubStore";

// Lazy-loaded views — mount once, show/hide (Crystal pattern)
const AgentFloor      = lazy(() => import("./views/AgentFloor").then(m => ({ default: m.AgentFloor })));
const MissionCalendar = lazy(() => import("./views/MissionCalendar").then(m => ({ default: m.MissionCalendar })));
const BriefingFeed    = lazy(() => import("./views/BriefingFeed").then(m => ({ default: m.BriefingFeed })));
const SkillsLab       = lazy(() => import("./views/SkillsLab").then(m => ({ default: m.SkillsLab })));
const Sandbox         = lazy(() => import("./views/Sandbox").then(m => ({ default: m.Sandbox })));
const SystemView      = lazy(() => import("./views/SystemView").then(m => ({ default: m.SystemView })));
const LiveBuild       = lazy(() => import("./views/LiveBuild").then(m => ({ default: m.LiveBuild })));

// Mount once, show/hide (no remount on tab switch)
function ViewSlot({ active, children }: { id: string; active: boolean; children: React.ReactNode }) {
  const mounted = useRef(false);
  if (active && !mounted.current) mounted.current = true;
  if (!mounted.current) return null;
  return <div style={{ display: active ? "contents" : "none" }}>{children}</div>;
}

function Loader() {
  return (
    <div className="flex h-full items-center justify-center gap-3">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        className="w-5 h-5 rounded-full border-2 border-ocean-400/30 border-t-ocean-400"
      />
      <span style={{ color: "var(--text-muted)", fontSize: 12 }}>Loading...</span>
    </div>
  );
}

function TitleBar() {
  return (
    <div
      data-tauri-drag-region
      className="flex items-center gap-3 px-4 select-none flex-shrink-0"
      style={{
        height: 44,
        background: "rgba(6,13,26,0.85)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Window controls (mac-style) */}
      <div className="flex gap-1.5">
        {["#ff5f57","#febc2e","#28c840"].map((c, i) => (
          <div key={i} className="w-3 h-3 rounded-full" style={{ background: c, opacity: 0.85 }} />
        ))}
      </div>
      {/* Title */}
      <div className="flex-1 flex items-center justify-center gap-2 pointer-events-none">
        <span className="text-lg">🌴</span>
        <span style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 500, letterSpacing: "0.02em" }}>
          The Club
        </span>
      </div>
      {/* Gateway status pill */}
      <GatewayPill />
    </div>
  );
}

function GatewayPill() {
  const connected = useClubStore(s => s.gatewayConnected);
  const isBrowser = connected === "browser";
  const isConnected = connected === true;

  const bg = isBrowser
    ? "rgba(139,92,246,0.10)"
    : isConnected ? "rgba(74,222,128,0.10)" : "rgba(251,113,133,0.10)";
  const border = isBrowser
    ? "rgba(139,92,246,0.25)"
    : isConnected ? "rgba(74,222,128,0.25)" : "rgba(251,113,133,0.25)";
  const dotColor = isBrowser
    ? "#8b5cf6"
    : isConnected ? "var(--palm)" : "var(--coral)";
  const label = isBrowser
    ? "BROWSER MODE"
    : isConnected ? "CONNECTED" : "OFFLINE";

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <motion.div
        animate={isConnected ? { opacity: [1, 0.4, 1] } : isBrowser ? { opacity: [1, 0.6, 1] } : { opacity: 1 }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: dotColor }}
      />
      <span style={{ fontSize: 10, fontWeight: 600, color: dotColor, letterSpacing: "0.05em" }}>
        {label}
      </span>
    </div>
  );
}

function ViewContent() {
  const { view } = useClubStore();
  return (
    <Suspense fallback={<Loader />}>
      <ViewSlot id="floor"      active={view === "floor"}>      <AgentFloor /> </ViewSlot>
      <ViewSlot id="calendar"   active={view === "calendar"}>   <MissionCalendar /> </ViewSlot>
      <ViewSlot id="feed"       active={view === "feed"}>       <BriefingFeed /> </ViewSlot>
      <ViewSlot id="skills"     active={view === "skills"}>     <SkillsLab /> </ViewSlot>
      <ViewSlot id="sandbox"    active={view === "sandbox"}>    <Sandbox /> </ViewSlot>
      <ViewSlot id="system"     active={view === "system"}>     <SystemView /> </ViewSlot>
      <ViewSlot id="livebuild"  active={view === "livebuild"}>  <LiveBuild /> </ViewSlot>
    </Suspense>
  );
}

export const isTauri = !!(window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;

interface CommandResult { stdout: string; stderr: string; code: number }

async function invokeCmd(cmd: string, args?: Record<string, unknown>): Promise<CommandResult> {
  if (!isTauri) return { stdout: "", stderr: "", code: 0 };
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<CommandResult>(cmd, args);
}

/** Parse PSObject '@{key=value; key2=value2}' strings into plain objects */
function parsePSObject(val: unknown): Record<string, string> | null {
  if (typeof val !== "string") return null;
  const m = val.match(/^@\{(.+)\}$/s);
  if (!m) return null;
  const obj: Record<string, string> = {};
  for (const pair of m[1].split(";")) {
    const eq = pair.indexOf("=");
    if (eq > 0) obj[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
  }
  return obj;
}

function normalizeJob(raw: Record<string, unknown>): Record<string, unknown> {
  const out = { ...raw };
  for (const key of ["schedule", "payload", "delivery", "state"] as const) {
    const v = out[key];
    const parsed = parsePSObject(v);
    if (parsed) out[key] = parsed;
  }
  // Coerce numeric state fields
  if (out.state && typeof out.state === "object") {
    const s = out.state as Record<string, unknown>;
    s.consecutiveErrors = Number(s.consecutiveErrors) || 0;
    s.lastRunAtMs = Number(s.lastRunAtMs) || 0;
    s.nextRunAtMs = Number(s.nextRunAtMs) || 0;
    s.lastDurationMs = Number(s.lastDurationMs) || 0;
  }
  // Coerce delivery threadId
  if (out.delivery && typeof out.delivery === "object") {
    const d = out.delivery as Record<string, unknown>;
    d.threadId = d.threadId === "null" || d.threadId == null ? null : Number(d.threadId);
  }
  // Coerce enabled
  if (typeof out.enabled === "string") out.enabled = out.enabled === "True" || out.enabled === "true";
  return out;
}

/* ── Derive agents from jobs ── */
function deriveAgentsFromJobs(jobs: import("./store/useClubStore").SystemCronJob[]) {
  const store = useClubStore.getState();

  // Map job name to emoji by keyword
  function emojiForJob(name: string): string {
    const n = name.toLowerCase();
    if (/intelligen|research|deal flow|nvidia|war room|blog digest/i.test(n)) return "🔍";
    if (/email|triage|yahoo/i.test(n)) return "📧";
    if (/system|health|gateway|heartbeat|maintenance|log watch|model optim/i.test(n)) return "⚙️";
    if (/memory|kb growth|distillation|session wrap|weekly review|backup/i.test(n)) return "🧠";
    if (/financ|invest|portfolio|bill/i.test(n)) return "💰";
    if (/calendar/i.test(n)) return "📅";
    if (/home|hue|trash|neighborhood/i.test(n)) return "🏠";
    if (/factory/i.test(n)) return "🏗️";
    if (/brief|digest/i.test(n)) return "📰";
    return "🤖";
  }

  function humanSchedule(expr: string): string {
    const parts = expr.split(" ");
    if (parts.length < 5) return expr;
    const [min, hr, , , dow] = parts;
    if (min.startsWith("*/")) return `Every ${min.slice(2)}m`;
    if (hr.startsWith("*/")) return `Every ${hr.slice(2)}h`;
    if (dow !== "*") return `Weekday schedule`;
    const hi = parseInt(hr), mi = parseInt(min);
    const ampm = hi >= 12 ? "pm" : "am";
    const h12 = hi === 0 ? 12 : hi > 12 ? hi - 12 : hi;
    return `Daily ${h12}:${String(mi).padStart(2, "0")}${ampm}`;
  }

  // Top 4 most recently run jobs
  const sorted = [...jobs]
    .filter(j => j.state?.lastRunAtMs)
    .sort((a, b) => (b.state?.lastRunAtMs ?? 0) - (a.state?.lastRunAtMs ?? 0))
    .slice(0, 4);

  for (const job of sorted) {
    const agentName = job.name.length > 12 ? job.name.slice(0, 12).trim() : job.name;
    const errors = job.state?.consecutiveErrors ?? 0;
    let status: AgentStatus = "idle";
    if (errors > 0) {
      status = "error";
    } else if (job.state?.lastRunStatus === "ok" && job.state.lastRunAtMs > Date.now() - 3600000) {
      status = "done";
    }

    const taskStr = (job.name.slice(0, 45) + " — " + humanSchedule(job.schedule?.expr ?? ""))
      .replace(/[^\x00-\x7F]/g, "");

    const existing = store.agents.find(a => a.id === job.id);
    if (existing) {
      store.updateAgent(job.id, { name: agentName, emoji: emojiForJob(job.name), status, task: taskStr });
    } else {
      store.addAgent({
        id: job.id,
        name: agentName,
        emoji: emojiForJob(job.name),
        status,
        task: taskStr,
        spawnedAt: new Date(),
        position: { x: 30 + Math.random() * 40, y: 60 },
      });
    }
  }
}

export default function App() {
  const setGatewayConnected = useClubStore(s => s.setGatewayConnected);
  const setJobs = useClubStore(s => s.setJobs);

  // Load jobs on mount
  useEffect(() => {
    (async () => {
      try {
        let raw: unknown[] = [];
        if (isTauri) {
          const res = await invokeCmd("execute_command", {
            command: "Get-Content C:\\Users\\jarro\\.openclaw\\cron\\jobs.json",
            cwd: null,
          });
          if (res.stdout) raw = JSON.parse(res.stdout);
        } else {
          const base = import.meta.env.BASE_URL || "/";
          const resp = await fetch(`${base}jobs-snapshot.json`);
          if (resp.ok) raw = await resp.json();
        }
        if (Array.isArray(raw) && raw.length > 0) {
          const normalized = raw.map((j) => normalizeJob(j as Record<string, unknown>) as never);
          setJobs(normalized);
          deriveAgentsFromJobs(normalized);
          toast.success("System loaded", { description: `${normalized.length} jobs active`, duration: 2000 });
        }
      } catch {
        // silently fail — jobs will be empty
      }
    })();
  }, []);

  // Gateway connection — skip entirely in browser mode
  useEffect(() => {
    if (!isTauri) {
      setGatewayConnected("browser");
      return;
    }
    const check = async () => {
      try {
        const r = await fetch("http://127.0.0.1:18789/health", { signal: AbortSignal.timeout(2000) });
        setGatewayConnected(r.ok);
      } catch {
        setGatewayConnected(false);
      }
    };
    check();
    const iv = setInterval(check, 5000);
    return () => clearInterval(iv);
  }, []);

  return (
    <TooltipProvider>
      <Toaster position="bottom-right" theme="dark" />
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", overflow: "hidden", background: "var(--bg-base)" }}>
        <TitleBar />
        <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>
          <Sidebar />
          <main style={{ flex: 1, minWidth: 0, overflow: "hidden", position: "relative" }}>
            <ViewContent />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
