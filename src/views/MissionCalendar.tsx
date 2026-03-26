import { motion } from "framer-motion";
import { useClubStore } from "../store/useClubStore";

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function cronLabel(expr: string): string {
  const p = expr.split(" ");
  if (p.length < 5) return expr;
  const [min, hr, , , dow] = p;
  if (min.startsWith("*/")) return `Every ${min.slice(2)} min`;
  if (hr.startsWith("*/")) return `Every ${hr.slice(2)} hr`;
  if (hr !== "*") {
    const h = parseInt(hr);
    const m = min.padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    if (dow !== "*" && dow !== "?") return `${h12}:${m} ${ampm}`;
    return `Daily ${h12}:${m} ${ampm}`;
  }
  return expr;
}

/** Determine which days of the week (0=Sun..6=Sat) a cron expression fires */
function cronFiresDow(expr?: string): Set<number> {
  if (!expr) return new Set([0, 1, 2, 3, 4, 5, 6]);
  const parts = expr.split(" ");
  if (parts.length < 5) return new Set([0, 1, 2, 3, 4, 5, 6]);
  const dow = parts[4];
  if (dow === "*" || dow === "?") return new Set([0, 1, 2, 3, 4, 5, 6]);

  const days = new Set<number>();
  for (const seg of dow.split(",")) {
    if (seg.includes("-")) {
      const [a, b] = seg.split("-").map(Number);
      for (let i = a; i <= b; i++) days.add(i % 7);
    } else {
      const n = parseInt(seg);
      if (!isNaN(n)) days.add(n % 7);
    }
  }
  return days.size > 0 ? days : new Set([0, 1, 2, 3, 4, 5, 6]);
}

export function MissionCalendar() {
  const { cronJobs } = useClubStore();
  const gatewayStatus = useClubStore(s => s.gatewayStatus);
  const now = new Date();

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: 24, gap: 20, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>Mission Calendar</h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Week strip */}
        <div style={{
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: 16, padding: "16px 20px",
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 14 }}>
            This Week
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
            {DAYS.map((day, i) => {
              const d = new Date(now);
              d.setDate(now.getDate() - now.getDay() + i);
              const isToday = d.toDateString() === now.toDateString();
              // Count enabled jobs that fire on this day of week
              const jobsOnDay = cronJobs.filter(j => j.enabled && cronFiresDow(j.schedule.expr).has(i));
              return (
                <div key={day} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 500 }}>{day}</span>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: isToday ? 700 : 400,
                    background: isToday ? "var(--ocean)" : "transparent",
                    color: isToday ? "#060d1a" : "var(--text-secondary)",
                    boxShadow: isToday ? "0 0 12px rgba(56,189,248,0.4)" : "none",
                  }}>
                    {d.getDate()}
                  </div>
                  <div style={{ display: "flex", gap: 2 }}>
                    {jobsOnDay.slice(0, 4).map((_, di) => (
                      <div key={di} style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--ocean)", opacity: 0.6 }} />
                    ))}
                    {jobsOnDay.length > 4 && (
                      <span style={{ fontSize: 8, color: "var(--text-faint)" }}>+{jobsOnDay.length - 4}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Jobs list */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>
            Scheduled Jobs ({cronJobs.length})
          </div>

          {cronJobs.length === 0 ? (
            <div style={{
              background: "var(--bg-surface)", border: "1px solid var(--border)",
              borderRadius: 14, padding: "32px 16px", textAlign: "center",
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{"\uD83D\uDCC5"}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                {gatewayStatus === "connected" ? "No scheduled jobs found" : "Connect to gateway to load jobs"}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {cronJobs.map((job, i) => (
                <motion.div key={job.jobId}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    background: "var(--bg-surface)", border: "1px solid var(--border)",
                    borderRadius: 14, padding: "14px 16px",
                    display: "flex", alignItems: "center", gap: 14,
                  }}
                >
                  {/* Status dot */}
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                    background: job.enabled ? "var(--palm)" : "var(--text-faint)",
                    boxShadow: job.enabled ? "0 0 8px rgba(74,222,128,0.6)" : "none",
                  }} />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{job.name}</div>
                    {job.description && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {job.description}
                      </div>
                    )}
                  </div>

                  {/* Schedule */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 12, color: "var(--ocean)", fontFamily: "monospace" }}>
                      {job.schedule.expr ? cronLabel(job.schedule.expr) : job.schedule.kind}
                    </div>
                    {job.schedule.tz && (
                      <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 1 }}>{job.schedule.tz}</div>
                    )}
                  </div>

                  {/* Last run */}
                  {job.lastRun && (
                    <div style={{ fontSize: 10, color: "var(--text-faint)", flexShrink: 0, textAlign: "right" }}>
                      <div>Last run</div>
                      <div>{job.lastRun.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
