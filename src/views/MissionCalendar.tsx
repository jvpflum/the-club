import { motion } from "framer-motion";
import { useClubStore } from "../store/useClubStore";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function cronToLabel(expr: string): string {
  const parts = expr.split(" ");
  if (parts.length === 5) {
    const [min, hour, , , day] = parts;
    if (day === "*" && hour !== "*") {
      const h = parseInt(hour);
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h > 12 ? h - 12 : h || 12;
      return `Daily ${h12}:${min.padStart(2, "0")} ${ampm}`;
    }
  }
  return expr;
}

export function MissionCalendar() {
  const { cronJobs } = useClubStore();
  const now = new Date();

  return (
    <div className="h-full flex flex-col p-6 gap-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Mission Calendar</h1>
          <p className="text-white/50 text-sm">
            {now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="glass px-4 py-2 rounded-xl text-white/80 text-sm font-medium hover:bg-white/20"
        >
          + New Job
        </motion.button>
      </div>

      {/* Scheduled Jobs */}
      <div className="flex flex-col gap-3 overflow-y-auto flex-1">
        <h2 className="text-white/60 text-xs uppercase tracking-widest">Scheduled Jobs ({cronJobs.length})</h2>
        {cronJobs.map((job) => (
          <motion.div
            key={job.jobId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-2xl p-4 flex items-center gap-4"
          >
            <div
              className={`w-3 h-3 rounded-full flex-shrink-0 ${
                job.enabled ? "bg-palm-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" : "bg-white/20"
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm">{job.name}</div>
              <div className="text-white/50 text-xs mt-0.5 truncate">{job.description}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-ocean-300 text-xs font-mono">
                {job.schedule.expr ? cronToLabel(job.schedule.expr) : job.schedule.kind}
              </div>
              <div className="text-white/30 text-[10px]">{job.schedule.tz}</div>
            </div>
            <div className="flex gap-2">
              <button
                className="glass px-3 py-1 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/20 transition-all"
                title="Run now"
              >
                ▶
              </button>
              <button
                className="glass px-3 py-1 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/20 transition-all"
                title="Edit"
              >
                ✏️
              </button>
            </div>
          </motion.div>
        ))}

        {cronJobs.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center text-white/40">
            <div className="text-4xl mb-2">📅</div>
            <div>No scheduled jobs yet</div>
          </div>
        )}

        {/* Week view */}
        <h2 className="text-white/60 text-xs uppercase tracking-widest mt-2">This Week</h2>
        <div className="glass rounded-2xl p-4">
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((day, i) => {
              const date = new Date(now);
              date.setDate(now.getDate() - now.getDay() + i);
              const isToday = date.toDateString() === now.toDateString();
              return (
                <div key={day} className="flex flex-col items-center">
                  <div className="text-white/40 text-[10px] mb-1">{day}</div>
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${
                      isToday ? "bg-ocean-500 text-white shadow-lg" : "text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {date.getDate()}
                  </div>
                  {/* Dots for scheduled jobs */}
                  <div className="flex gap-0.5 mt-1">
                    {cronJobs.filter(j => j.enabled).slice(0, 3).map((_, di) => (
                      <div key={di} className="w-1 h-1 rounded-full bg-ocean-400" />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
