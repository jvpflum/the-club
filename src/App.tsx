import { useEffect, lazy, Suspense, useRef } from "react";
import { motion } from "framer-motion";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "./components/Sidebar";
import { useClubStore } from "./store/useClubStore";

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
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
      style={{
        background: connected ? "rgba(74,222,128,0.10)" : "rgba(251,113,133,0.10)",
        border: `1px solid ${connected ? "rgba(74,222,128,0.25)" : "rgba(251,113,133,0.25)"}`,
      }}
    >
      <motion.div
        animate={connected ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: connected ? "var(--palm)" : "var(--coral)" }}
      />
      <span style={{ fontSize: 10, fontWeight: 600, color: connected ? "var(--palm)" : "var(--coral)", letterSpacing: "0.05em" }}>
        {connected ? "CONNECTED" : "OFFLINE"}
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

const isTauri = !!(window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;

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
        if (Array.isArray(raw)) {
          setJobs(raw.map((j) => normalizeJob(j as Record<string, unknown>) as never));
        }
      } catch {
        // silently fail — jobs will be empty
      }
    })();
  }, []);

  // Gateway connection via port check (no raw WebSocket — needs auth token)
  useEffect(() => {
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
