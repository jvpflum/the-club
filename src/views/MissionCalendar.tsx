import { motion } from "framer-motion";
import { useClubStore } from "../store/useClubStore";

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function cronLabel(expr: string) {
  const p = expr.split(" ");
  if (p.length === 5 && p[1] !== "*") {
    const h = parseInt(p[1]);
    return `Daily ${h > 12 ? h - 12 : h || 12}:${p[0].padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`;
  }
  return expr;
}

export function MissionCalendar() {
  const { cronJobs } = useClubStore();
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
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          style={{
            background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.28)",
            borderRadius: 10, padding: "7px 16px",
            color: "var(--ocean)", fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}
        >+ New Job</motion.button>
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
                    {cronJobs.filter(j => j.enabled).slice(0,3).map((_, di) => (
                      <div key={di} style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--ocean)", opacity: 0.6 }} />
                    ))}
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

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {["▶","✏️"].map(icon => (
                    <button key={icon} style={{
                      background: "var(--bg-elevated)", border: "1px solid var(--border)",
                      borderRadius: 8, width: 30, height: 30,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, cursor: "pointer", color: "var(--text-secondary)",
                    }}>{icon}</button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
