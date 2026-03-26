import { lazy, Suspense, useRef } from "react";
import { motion } from "framer-motion";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { Sidebar } from "./components/Sidebar";
import { useClubStore } from "./store/useClubStore";
import type { GatewayStatus } from "./lib/gateway";

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
        <span className="text-lg">{"\uD83C\uDF34"}</span>
        <span style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 500, letterSpacing: "0.02em" }}>
          The Club
        </span>
      </div>
      {/* Gateway status pill */}
      <GatewayPill />
    </div>
  );
}

const STATUS_CONFIG: Record<GatewayStatus, { bg: string; border: string; dot: string; label: string }> = {
  connecting: {
    bg: "rgba(251,191,36,0.10)",
    border: "rgba(251,191,36,0.25)",
    dot: "#fbbf24",
    label: "CONNECTING",
  },
  connected: {
    bg: "rgba(74,222,128,0.10)",
    border: "rgba(74,222,128,0.25)",
    dot: "var(--palm)",
    label: "CONNECTED",
  },
  disconnected: {
    bg: "rgba(251,113,133,0.10)",
    border: "rgba(251,113,133,0.25)",
    dot: "var(--coral)",
    label: "OFFLINE",
  },
  error: {
    bg: "rgba(251,113,133,0.10)",
    border: "rgba(251,113,133,0.25)",
    dot: "var(--coral)",
    label: "ERROR",
  },
};

function GatewayPill() {
  const status = useClubStore(s => s.gatewayStatus);
  const c = STATUS_CONFIG[status];

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
    >
      <motion.div
        animate={
          status === "connected" || status === "connecting"
            ? { opacity: [1, 0.4, 1] }
            : { opacity: 1 }
        }
        transition={{ duration: status === "connecting" ? 0.8 : 1.5, repeat: Infinity }}
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: c.dot }}
      />
      <span style={{ fontSize: 10, fontWeight: 600, color: c.dot, letterSpacing: "0.05em" }}>
        {c.label}
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

export default function App() {
  // Gateway auto-initialized by store import — no manual setup needed
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
