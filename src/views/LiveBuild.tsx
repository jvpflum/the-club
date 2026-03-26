import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useClubStore } from "../store/useClubStore";

interface CommandResult { stdout: string; stderr: string; code: number; }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isTauri = !!(window as any).__TAURI_INTERNALS__;
async function invokeCmd(cmd: string, args?: Record<string, unknown>): Promise<CommandResult> {
  if (!isTauri) return { stdout: "", stderr: "", code: 0 };
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<CommandResult>(cmd, args);
}

interface Commit {
  hash: string;
  message: string;
  author: string;
  date: string;
  files: number;
}

interface BuildEvent {
  id: string;
  type: "commit" | "job" | "system";
  message: string;
  detail?: string;
  timestamp: Date;
}

const REPO_PATH = "C:\\Users\\jarro\\.openclaw\\workspace\\the-club";

const EVENT_COLOR: Record<string, string> = {
  commit: "text-palm-400",
  job: "text-ocean-300",
  system: "text-white/40",
};

const EVENT_ICON: Record<string, string> = {
  commit: "\uD83D\uDD00",
  job: "\u26A1",
  system: "\u2699\uFE0F",
};

export function LiveBuild() {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [events, setEvents] = useState<BuildEvent[]>([]);
  const [repoStats, setRepoStats] = useState({ files: 0, commits: 0 });
  const [loading, setLoading] = useState(true);
  const eventsEndRef = useRef<HTMLDivElement>(null);
  const lastHashRef = useRef<string>("");

  // Subscribe to gateway events for job lifecycle
  const recentEvents = useClubStore(s => s.recentEvents);
  const gatewayStatus = useClubStore(s => s.gatewayStatus);

  // Map gateway events → build events
  useEffect(() => {
    const jobEvents: BuildEvent[] = recentEvents
      .filter(e => e.type.includes("job") || e.type.includes("session") || e.type.includes("event"))
      .map(e => ({
        id: `gw-${e.ts}`,
        type: "job" as const,
        message: e.name || e.type,
        detail: e.detail || undefined,
        timestamp: new Date(e.ts),
      }));
    setEvents(prev => {
      // Merge: keep commit events, replace gateway events
      const commitEvents = prev.filter(e => e.type === "commit");
      return [...commitEvents, ...jobEvents].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    });
  }, [recentEvents]);

  const fetchCommits = async () => {
    try {
      const result = await invokeCmd("execute_command", {
        command: `git -C "${REPO_PATH}" log --pretty=format:"%H|%s|%an|%ar|%ad" --date=short --numstat -20`,
        cwd: null,
      });
      if (result.code !== 0) return;

      const lines = result.stdout.trim().split("\n").filter(Boolean);
      const parsed: Commit[] = [];
      let current: Partial<Commit> | null = null;
      let fileCount = 0;

      for (const line of lines) {
        if (line.includes("|")) {
          if (current) parsed.push({ ...current, files: fileCount } as Commit);
          const [hash, message, author, date] = line.split("|");
          current = { hash: hash?.slice(0, 7), message, author, date };
          fileCount = 0;
        } else if (line.match(/^\d/)) {
          fileCount++;
        }
      }
      if (current) parsed.push({ ...current, files: fileCount } as Commit);

      setCommits(parsed);

      // Detect new commit
      if (parsed.length > 0 && parsed[0].hash !== lastHashRef.current) {
        if (lastHashRef.current) {
          const newCommit = parsed[0];
          setEvents((prev) => [
            ...prev,
            {
              id: newCommit.hash,
              type: "commit",
              message: `New commit: ${newCommit.message}`,
              detail: `${newCommit.author} \u00b7 ${newCommit.files} file(s) changed`,
              timestamp: new Date(),
            },
          ]);
        }
        lastHashRef.current = parsed[0].hash;
      }

      setLoading(false);
    } catch (e) {
      console.error("Git fetch failed:", e);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [fileResult, commitResult] = await Promise.all([
        invokeCmd("execute_command", {
          command: `(Get-ChildItem -Path "${REPO_PATH}\\src" -Recurse -Filter "*.tsx","*.ts" -ErrorAction SilentlyContinue | Measure-Object).Count`,
          cwd: null,
        }),
        invokeCmd("execute_command", {
          command: `git -C "${REPO_PATH}" rev-list --count HEAD`,
          cwd: null,
        }),
      ]);
      setRepoStats({
        files: parseInt(fileResult.stdout.trim()) || 0,
        commits: parseInt(commitResult.stdout.trim()) || 0,
      });
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchCommits();
    fetchStats();
    const poll = setInterval(() => {
      fetchCommits();
      fetchStats();
    }, 5000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    eventsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  return (
    <div className="h-full flex flex-col p-6 gap-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold flex items-center gap-2">
            Live Build
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 rounded-full"
              style={{ background: gatewayStatus === "connected" ? "var(--palm)" : "var(--coral)" }}
            />
          </h1>
          <p className="text-white/50 text-sm">
            {gatewayStatus === "connected" ? "Live gateway events + git log" : "Gateway offline \u2014 git log only"}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="glass px-3 py-1.5 rounded-xl text-xs text-white/60 flex items-center gap-2">
            <span className="text-ocean-300">{"\uD83D\uDCC1"}</span>
            {repoStats.files} files
          </div>
          <div className="glass px-3 py-1.5 rounded-xl text-xs text-white/60 flex items-center gap-2">
            <span className="text-palm-400">{"\uD83D\uDD00"}</span>
            {repoStats.commits} commits
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left: Live event stream */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <h2 className="text-white/40 text-[10px] uppercase tracking-widest">Live Stream</h2>
          <div className="flex-1 overflow-y-auto flex flex-col gap-2">
            {events.length === 0 ? (
              <div className="glass rounded-xl p-6 text-center text-white/40 text-sm">
                <div className="text-2xl mb-2">{"\u26A1"}</div>
                {gatewayStatus === "connected"
                  ? "Waiting for events\u2026"
                  : "Connect to gateway for live job events"}
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {events.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: "auto" }}
                    className="glass rounded-xl p-3 flex items-start gap-3"
                  >
                    <span className="text-base flex-shrink-0">{EVENT_ICON[event.type] || "\u2699\uFE0F"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${EVENT_COLOR[event.type] || "text-white/40"}`}>
                          {event.message}
                        </span>
                      </div>
                      {event.detail && (
                        <div className="text-white/40 text-[10px] mt-0.5">{event.detail}</div>
                      )}
                    </div>
                    <span className="text-white/25 text-[10px] flex-shrink-0">
                      {event.timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            <div ref={eventsEndRef} />
          </div>
        </div>

        {/* Right: Git commit log */}
        <div className="w-72 flex flex-col gap-3 flex-shrink-0">
          <h2 className="text-white/40 text-[10px] uppercase tracking-widest">Git Log</h2>
          <div className="flex-1 overflow-y-auto flex flex-col gap-2">
            {loading && (
              <div className="glass rounded-xl p-4 text-center text-white/40 text-sm">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="inline-block mr-2">{"\u2699\uFE0F"}</motion.div>
                Loading...
              </div>
            )}
            <AnimatePresence>
              {commits.map((commit, i) => (
                <motion.div
                  key={commit.hash}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="glass rounded-xl p-3 flex flex-col gap-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-ocean-300 text-[10px] bg-ocean-900/40 px-1.5 py-0.5 rounded">
                      {commit.hash}
                    </span>
                    {i === 0 && (
                      <span className="text-[9px] bg-palm-400/20 text-palm-400 px-1.5 py-0.5 rounded font-semibold">
                        HEAD
                      </span>
                    )}
                  </div>
                  <div className="text-white text-xs font-medium leading-tight line-clamp-2">
                    {commit.message}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/30 text-[10px]">{commit.author}</span>
                    <span className="text-white/30 text-[10px]">{commit.date}</span>
                  </div>
                  {commit.files > 0 && (
                    <div className="text-white/20 text-[10px]">{commit.files} file{commit.files !== 1 ? "s" : ""} changed</div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
