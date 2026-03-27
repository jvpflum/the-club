import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useClubStore, SystemCronJob, SystemTab } from "../store/useClubStore";



/* ─── Topic Map ─── */
const TOPIC_MAP: Record<number, string> = {
  1: "General", 13: "Tasks", 14: "Email", 15: "Calendar", 16: "Finance",
  17: "Home", 18: "Cars", 30: "Briefing", 38: "System", 89: "Neighborhood",
  295: "LinkedIn", 345: "GitHub", 497: "Investments", 975: "Property", 1195: "Factory",
};

/* ─── Category Detection ─── */
type Category = "INTELLIGENCE" | "DAILY OPS" | "AUTOMATION" | "HEALTH" | "MEMORY" | "REMINDERS" | "FACTORY" | "DISABLED";

const CAT_KEYWORDS: [Category, RegExp][] = [
  ["INTELLIGENCE", /deal flow|nvidia|war room|portfolio|blog digest|investment/i],
  ["DAILY OPS", /daily brief|email triage|yahoo triage|bill approval|github digest/i],
  ["AUTOMATION", /hue |calendar focus|calendar event prep/i],
  ["HEALTH", /gateway heartbeat|system maintenance|prompt integrity|log watcher|model optimizer/i],
  ["MEMORY", /kb growth|memory distillation|session wrap|weekly review|weekly backup/i],
  ["REMINDERS", /trash night|tax|birthday|stale task/i],
  ["FACTORY", /factory/i],
];

const CAT_COLORS: Record<Category, string> = {
  INTELLIGENCE: "var(--ocean)",
  "DAILY OPS": "var(--sand)",
  AUTOMATION: "var(--lavender)",
  HEALTH: "var(--palm)",
  MEMORY: "#a78bfa",
  REMINDERS: "var(--coral)",
  FACTORY: "#f59e0b",
  DISABLED: "var(--text-muted)",
};

function categorize(job: SystemCronJob): Category {
  if (!job.enabled) return "DISABLED";
  const name = job.name;
  const topic = job.delivery?.threadId ? TOPIC_MAP[job.delivery.threadId] ?? "" : "";
  const haystack = `${name} ${topic}`;
  for (const [cat, re] of CAT_KEYWORDS) {
    if (re.test(haystack)) return cat;
  }
  // fallback by topic
  if (topic === "Investments" || topic === "Finance") return "INTELLIGENCE";
  if (topic === "System") return "HEALTH";
  if (topic === "Home") return "AUTOMATION";
  if (topic === "Factory") return "FACTORY";
  return "DAILY OPS";
}

/* ─── Helpers ─── */
function parseCronHuman(expr: string): string {
  const parts = expr.split(" ");
  if (parts.length < 5) return expr;
  const [min, hr, dom, , dow] = parts;

  const fmtHr = (h: string, m: string) => {
    const hi = parseInt(h), mi = parseInt(m);
    const ampm = hi >= 12 ? "pm" : "am";
    const h12 = hi === 0 ? 12 : hi > 12 ? hi - 12 : hi;
    return mi === 0 ? `${h12}${ampm}` : `${h12}:${String(mi).padStart(2, "0")}${ampm}`;
  };

  // Every N minutes
  if (min.startsWith("*/")) return `Every ${min.slice(2)}m`;
  // Every N hours
  if (hr.startsWith("*/")) return `Every ${hr.slice(2)}h`;

  const dowNames: Record<string, string> = { "0": "Sun", "1": "Mon", "2": "Tue", "3": "Wed", "4": "Thu", "5": "Fri", "6": "Sat" };

  if (dow !== "*") {
    const days = dow.split(",").map(d => {
      if (d.includes("-")) {
        const [a, b] = d.split("-");
        return `${dowNames[a] ?? a}-${dowNames[b] ?? b}`;
      }
      return dowNames[d] ?? d;
    });
    return `${days.join("/")} ${fmtHr(hr, min)}`;
  }

  if (dom !== "*") return `Day ${dom} ${fmtHr(hr, min)}`;
  return `Daily ${fmtHr(hr, min)}`;
}

function relTime(ms: number): string {
  if (!ms) return "—";
  const now = Date.now();
  const diff = now - ms;
  const abs = Math.abs(diff);
  const future = diff < 0;
  if (abs < 60_000) return future ? "in <1m" : "<1m ago";
  if (abs < 3_600_000) {
    const m = Math.round(abs / 60_000);
    return future ? `in ${m}m` : `${m}m ago`;
  }
  if (abs < 86_400_000) {
    const h = Math.round(abs / 3_600_000);
    return future ? `in ${h}h` : `${h}h ago`;
  }
  const d = Math.round(abs / 86_400_000);
  return future ? `in ${d}d` : `${d}d ago`;
}

function fmtDuration(ms: number): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return rs ? `${m}m ${rs}s` : `${m}m`;
}

function modelBadge(model: string): { label: string; color: string } {
  const m = model.toLowerCase();
  if (m.includes("sonnet") || m.includes("claude")) return { label: "SONNET", color: "var(--ocean)" };
  if (m.includes("local-mid") || m.includes("mid")) return { label: "LOCAL-MID", color: "var(--palm)" };
  if (m.includes("local-fast") || m.includes("fast")) return { label: "LOCAL-FAST", color: "var(--sand)" };
  return { label: model.slice(0, 10).toUpperCase(), color: "var(--text-secondary)" };
}

function topicName(job: SystemCronJob): string {
  if (job.delivery?.mode === "none") return "none";
  const tid = job.delivery?.threadId;
  if (tid == null) return "none";
  return TOPIC_MAP[tid] ?? `Thread ${tid}`;
}

function statusColor(job: SystemCronJob): string {
  if (!job.enabled) return "var(--text-muted)";
  if ((job.state?.consecutiveErrors ?? 0) >= 2) return "var(--coral)";
  if ((job.state?.consecutiveErrors ?? 0) >= 1) return "var(--sand)";
  return "var(--palm)";
}

/* ─── Cron → fire times in a day ─── */
function cronFireTimes(expr: string): number[] {
  const parts = expr.split(" ");
  if (parts.length < 5) return [];
  const [minP, hrP, , , dowP] = parts;
  const today = new Date();
  const todayDow = today.getDay();

  // Check day-of-week filter
  if (dowP !== "*") {
    const allowed = new Set<number>();
    for (const seg of dowP.split(",")) {
      if (seg.includes("-")) {
        const [a, b] = seg.split("-").map(Number);
        for (let i = a; i <= b; i++) allowed.add(i);
      } else {
        allowed.add(Number(seg));
      }
    }
    if (!allowed.has(todayDow)) return [];
  }

  const hours: number[] = [];
  if (hrP === "*") for (let i = 0; i < 24; i++) hours.push(i);
  else if (hrP.startsWith("*/")) {
    const step = parseInt(hrP.slice(2));
    for (let i = 0; i < 24; i += step) hours.push(i);
  } else {
    for (const h of hrP.split(",")) hours.push(parseInt(h));
  }

  const mins: number[] = [];
  if (minP === "*") for (let i = 0; i < 60; i++) mins.push(i);
  else if (minP.startsWith("*/")) {
    const step = parseInt(minP.slice(2));
    for (let i = 0; i < 60; i += step) mins.push(i);
  } else {
    for (const m of minP.split(",")) mins.push(parseInt(m));
  }

  const times: number[] = [];
  for (const h of hours) {
    for (const m of mins) {
      times.push(h * 60 + m);
    }
  }
  return times.sort((a, b) => a - b);
}


/* ─── Tab Bar ─── */
function TabBar({ active, onChange }: { active: SystemTab; onChange: (t: SystemTab) => void }) {
  const tabs: { id: SystemTab; label: string }[] = [
    { id: "grid", label: "Job Grid" },
    { id: "timeline", label: "Timeline" },
    { id: "map", label: "System Map" },
  ];
  return (
    <div style={{ display: "flex", gap: 4, padding: "4px", borderRadius: 12, background: "var(--bg-surface)" }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: "6px 16px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.03em",
            transition: "all 0.15s",
            background: active === t.id ? "var(--bg-elevated)" : "transparent",
            color: active === t.id ? "var(--text-primary)" : "var(--text-muted)",
            boxShadow: active === t.id ? "0 0 0 1px rgba(56,189,248,0.20)" : "none",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Health Bar ─── */
function HealthBar({ jobs }: { jobs: SystemCronJob[] }) {
  const gw = useClubStore(s => s.gatewayStatus);
  const isConnected = gw === "connected";
  const enabled = jobs.filter(j => j.enabled);
  const healthy = enabled.filter(j => (j.state?.consecutiveErrors ?? 0) === 0);
  const withErrors = enabled.filter(j => (j.state?.consecutiveErrors ?? 0) > 0);
  const disabled = jobs.filter(j => !j.enabled);
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const runsToday = jobs.filter(j => (j.state?.lastRunAtMs ?? 0) >= todayStart.getTime()).length;

  const Stat = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 18, fontWeight: 700, color }}>{value}</span>
      <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
    </div>
  );

  const gwDotColor = isConnected ? "var(--palm)" : gw === "connecting" ? "#fbbf24" : "var(--coral)";
  const gwLabel = isConnected ? "GATEWAY" : gw === "connecting" ? "CONNECTING" : "GW OFFLINE";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 20, padding: "10px 16px",
      borderRadius: 12, background: "var(--bg-surface)", border: "1px solid var(--glass-border)",
      flexWrap: "wrap",
    }}>
      <Stat label="healthy" value={`${healthy.length}/${enabled.length}`} color="var(--palm)" />
      {withErrors.length > 0 && <Stat label="errors" value={withErrors.length} color="var(--coral)" />}
      <Stat label="disabled" value={disabled.length} color="var(--text-muted)" />
      <Stat label="runs today" value={runsToday} color="var(--ocean)" />
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <motion.div
          animate={isConnected || gw === "connecting" ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            width: 8, height: 8, borderRadius: 99,
            background: gwDotColor,
          }}
        />
        <span style={{ fontSize: 10, fontWeight: 600, color: gwDotColor, letterSpacing: "0.05em" }}>
          {gwLabel}
        </span>
      </div>
    </div>
  );
}

/* ─── Job Card ─── */
function JobCard({ job }: { job: SystemCronJob }) {
  const badge = modelBadge(job.payload?.model ?? "");
  const errors = job.state?.consecutiveErrors ?? 0;
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        padding: 14,
        borderRadius: 12,
        background: "var(--bg-surface)",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.18)" : "var(--glass-border)"}`,
        opacity: job.enabled ? 1 : 0.45,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minWidth: 0,
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "border-color 0.15s, transform 0.15s",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <motion.div
          animate={errors > 0 ? { opacity: [1, 0.3, 1] } : {}}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{
            width: 8, height: 8, borderRadius: 99, flexShrink: 0,
            background: statusColor(job),
          }}
        />
        <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {job.name}
        </span>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
          padding: "2px 6px", borderRadius: 6,
          background: `color-mix(in srgb, ${badge.color} 15%, transparent)`,
          color: badge.color,
        }}>
          {badge.label}
        </span>
      </div>

      {/* Details grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", fontSize: 11 }}>
        <Detail label="Schedule" value={parseCronHuman(job.schedule?.expr ?? "")} />
        <Detail label="Topic" value={topicName(job)} />
        <Detail label="Last run" value={relTime(job.state?.lastRunAtMs ?? 0)} />
        <Detail label="Next run" value={relTime(job.state?.nextRunAtMs ?? 0)} />
        <Detail label="Duration" value={fmtDuration(job.state?.lastDurationMs ?? 0)} />
        {errors > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ color: "var(--text-muted)" }}>Errors</span>
            <span style={{
              background: "var(--coral)", color: "white", fontSize: 9, fontWeight: 700,
              padding: "1px 5px", borderRadius: 6, minWidth: 16, textAlign: "center",
            }}>
              {errors}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 4, overflow: "hidden" }}>
      <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>{label}</span>
      <span style={{ color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );
}

/* ─── Category Section ─── */
function CategorySection({ cat, jobs, color }: { cat: string; jobs: SystemCronJob[]; color: string }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%",
          border: "none", background: "none", cursor: "pointer", padding: "8px 0",
        }}
      >
        <div style={{ width: 3, height: 16, borderRadius: 2, background: color, flexShrink: 0 }} />
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
          color: "var(--text-secondary)",
        }}>
          {cat}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 6,
          background: "var(--bg-surface)", color: "var(--text-muted)",
        }}>
          {jobs.length}
        </span>
        <span style={{ fontSize: 10, color: "var(--text-faint)", marginLeft: "auto" }}>{open ? "▼" : "▶"}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 10,
              paddingBottom: 8,
            }}>
              {jobs.map(j => <JobCard key={j.id} job={j} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── TAB 1: Job Grid ─── */
function JobGrid({ jobs }: { jobs: SystemCronJob[] }) {
  const grouped = useMemo(() => {
    const map = new Map<Category, SystemCronJob[]>();
    for (const j of jobs) {
      const cat = categorize(j);
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(j);
    }
    // Stable order
    const order: Category[] = ["INTELLIGENCE", "DAILY OPS", "AUTOMATION", "HEALTH", "MEMORY", "REMINDERS", "FACTORY", "DISABLED"];
    return order.filter(c => map.has(c)).map(c => ({ cat: c, jobs: map.get(c)!, color: CAT_COLORS[c] }));
  }, [jobs]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {grouped.map(g => (
        <CategorySection key={g.cat} cat={g.cat} jobs={g.jobs} color={g.color} />
      ))}
      {jobs.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
          Waiting for gateway connection...
        </div>
      )}
    </div>
  );
}

/* ─── TAB 2: Timeline ─── */
function Timeline({ jobs }: { jobs: SystemCronJob[] }) {
  const enabledJobs = jobs.filter(j => j.enabled);
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const totalMin = 24 * 60;

  const rows = useMemo(() => {
    return enabledJobs.map(j => ({
      job: j,
      cat: categorize(j),
      fires: cronFireTimes(j.schedule?.expr ?? ""),
    })).filter(r => r.fires.length > 0 && r.fires.length < 300); // skip every-minute jobs from rendering hundreds of dots
  }, [enabledJobs]);

  // Group by category
  const catOrder: Category[] = ["INTELLIGENCE", "DAILY OPS", "AUTOMATION", "HEALTH", "MEMORY", "REMINDERS", "FACTORY"];
  const grouped = useMemo(() => {
    const map = new Map<Category, typeof rows>();
    for (const r of rows) {
      if (!map.has(r.cat)) map.set(r.cat, []);
      map.get(r.cat)!.push(r);
    }
    return catOrder.filter(c => map.has(c)).map(c => ({ cat: c, rows: map.get(c)! }));
  }, [rows]);

  const hourMarkers = Array.from({ length: 25 }, (_, i) => i);

  // Empty state
  if (jobs.length === 0) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 60, gap: 12, color: "var(--text-muted)",
      }}>
        <span style={{ fontSize: 48 }}>📅</span>
        <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-secondary)" }}>No jobs loaded</span>
        <span style={{ fontSize: 12 }}>Open in Tauri desktop for live data</span>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", overflowX: "auto", overflowY: "auto", flex: 1 }}>
      {/* Hour labels */}
      <div style={{ display: "flex", position: "sticky", top: 0, zIndex: 2, background: "var(--bg-base)", paddingLeft: 140 }}>
        {hourMarkers.map(h => (
          <div key={h} style={{
            flex: "0 0 calc((100% - 140px) / 24)", minWidth: 40,
            fontSize: 9, color: "var(--text-faint)", textAlign: "left", paddingBottom: 4,
          }}>
            {h < 24 ? `${h}:00` : ""}
          </div>
        ))}
      </div>

      {/* Now line */}
      <div style={{
        position: "absolute",
        left: `calc(140px + ${(currentMin / totalMin) * 100}% * (1 - 140 / 100))`,
        top: 20,
        bottom: 0,
        width: 2,
        background: "var(--coral)",
        opacity: 0.7,
        zIndex: 3,
        pointerEvents: "none",
      }}>
        <div style={{
          position: "absolute", top: -2, left: -3, width: 8, height: 8,
          borderRadius: 99, background: "var(--coral)",
        }} />
      </div>

      {/* Grouped rows */}
      {grouped.map(g => (
        <div key={g.cat} style={{ marginBottom: 8 }}>
          {/* Category label */}
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
            color: CAT_COLORS[g.cat], padding: "4px 0 2px 8px",
            borderLeft: `3px solid ${CAT_COLORS[g.cat]}`,
          }}>
            {g.cat}
          </div>
          {g.rows.map(r => (
            <div key={r.job.id} style={{ display: "flex", alignItems: "center", height: 28 }}>
              {/* Job name */}
              <div style={{
                width: 140, flexShrink: 0, fontSize: 11, color: "var(--text-secondary)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                paddingLeft: 12,
              }}>
                {r.job.name}
              </div>
              {/* Timeline track */}
              <div style={{ flex: 1, position: "relative", height: 20, minWidth: 500 }}>
                {/* Grid lines */}
                <div style={{
                  position: "absolute", inset: 0,
                  backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 100%)",
                  backgroundSize: `${100 / 24}% 100%`,
                }} />
                {/* Fire dots */}
                {r.fires.map((t, i) => (
                  <div
                    key={i}
                    title={`${r.job.name} — ${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`}
                    style={{
                      position: "absolute",
                      left: `${(t / totalMin) * 100}%`,
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                      width: 8, height: 8, borderRadius: 99,
                      background: CAT_COLORS[r.cat],
                      opacity: t < currentMin ? 0.4 : 0.9,
                      cursor: "default",
                      transition: "transform 0.15s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translate(-50%, -50%) scale(1.6)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translate(-50%, -50%) scale(1)"; }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}

      {rows.length === 0 && jobs.length > 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>No scheduled jobs to display.</div>
      )}
    </div>
  );
}

/* ─── TAB 3: System Map ─── */
function SystemMap({ jobs }: { jobs: SystemCronJob[] }) {
  const clusters = useMemo(() => {
    const map = new Map<string, SystemCronJob[]>();
    for (const j of jobs) {
      const topic = topicName(j);
      if (!map.has(topic)) map.set(topic, []);
      map.get(topic)!.push(j);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [jobs]);

  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center",
      alignContent: "flex-start", padding: "16px 0",
    }}>
      {clusters.map(([topic, topicJobs]) => (
        <div key={topic} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          {/* Hub node */}
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "var(--bg-elevated)", border: "2px solid var(--glass-border)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 20px rgba(56,189,248,0.08)",
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ocean)", textAlign: "center", lineHeight: 1.2 }}>
              {topic}
            </span>
            <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{topicJobs.length} jobs</span>
          </div>
          {/* Spoke job nodes */}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", maxWidth: 220,
          }}>
            {topicJobs.map(j => {
              const badge = modelBadge(j.payload?.model ?? "");
              return (
                <motion.div
                  key={j.id}
                  whileHover={{ scale: 1.08 }}
                  title={`${j.name} — ${parseCronHuman(j.schedule?.expr ?? "")}`}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    background: "var(--bg-surface)",
                    border: `1px solid ${statusColor(j)}33`,
                    opacity: j.enabled ? 1 : 0.4,
                    display: "flex", alignItems: "center", gap: 5,
                    cursor: "default",
                  }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: 99, background: statusColor(j), flexShrink: 0 }} />
                  <span style={{ fontSize: 10, fontWeight: 500, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                    {j.name}
                  </span>
                  <span style={{
                    fontSize: 7, fontWeight: 700, letterSpacing: "0.06em",
                    padding: "1px 4px", borderRadius: 4,
                    background: `color-mix(in srgb, ${badge.color} 15%, transparent)`,
                    color: badge.color,
                  }}>
                    {badge.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}

      {jobs.length === 0 && (
        <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>No jobs to map.</div>
      )}
    </div>
  );
}

/* ─── Main SystemView ─── */
export function SystemView() {
  const jobs = useClubStore(s => s.jobs);
  const activeTab = useClubStore(s => s.activeSystemTab);
  const setTab = useClubStore(s => s.setActiveSystemTab);

  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column", overflow: "hidden",
      padding: "16px 20px",
    }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12, flexShrink: 0 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "0.01em" }}>
          ⚡ System View
        </span>
        <TabBar active={activeTab} onChange={setTab} />
        <div style={{ flex: 1 }} />
        <HealthBar jobs={jobs} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
        {activeTab === "grid" && <JobGrid jobs={jobs} />}
        {activeTab === "timeline" && <Timeline jobs={jobs} />}
        {activeTab === "map" && <SystemMap jobs={jobs} />}
      </div>
    </div>
  );
}
