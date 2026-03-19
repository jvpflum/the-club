import { motion } from "framer-motion";
import { useState } from "react";

interface Project {
  id: string;
  name: string;
  emoji: string;
  description: string;
  status: "active" | "paused" | "complete";
  agents: number;
}

const DEMO_PROJECTS: Project[] = [
  {
    id: "the-club",
    name: "The Club",
    emoji: "🏖️",
    description: "This app — self-improving autonomously",
    status: "active",
    agents: 1,
  },
  {
    id: "palomar",
    name: "Palomar",
    emoji: "🔒",
    description: "Main project repo — issue triage + fixes",
    status: "paused",
    agents: 0,
  },
];

export function Sandbox() {
  const [projects] = useState<Project[]>(DEMO_PROJECTS);

  return (
    <div className="h-full flex flex-col p-6 gap-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Sandbox</h1>
          <p className="text-white/50 text-sm">Autonomous workspaces — build anything, in isolation</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="glass px-4 py-2 rounded-xl text-white/80 text-sm font-medium hover:bg-white/20"
        >
          + New Project
        </motion.button>
      </div>

      {/* Info banner */}
      <div className="glass rounded-2xl p-4 flex items-start gap-3 border border-ocean-500/30">
        <span className="text-2xl">🧪</span>
        <div>
          <div className="text-white text-sm font-semibold mb-1">Autonomous Project Mode</div>
          <div className="text-white/50 text-xs leading-relaxed">
            Each sandbox is an isolated workspace where sub-agents can work autonomously — writing code,
            running tests, opening PRs. You can even point agents at The Club itself to self-improve.
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto flex-1">
        {projects.map((project) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.01 }}
            className="glass rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:bg-white/15 transition-all"
          >
            <div className="text-3xl">{project.emoji}</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-white font-semibold">{project.name}</span>
                <span
                  className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold ${
                    project.status === "active"
                      ? "bg-palm-400/20 text-palm-400"
                      : project.status === "paused"
                      ? "bg-sand-400/20 text-sand-400"
                      : "bg-white/10 text-white/40"
                  }`}
                >
                  {project.status}
                </span>
              </div>
              <div className="text-white/50 text-xs">{project.description}</div>
            </div>
            <div className="text-right">
              {project.agents > 0 && (
                <div className="text-white/50 text-xs flex items-center gap-1 justify-end">
                  <span className="w-1.5 h-1.5 rounded-full bg-palm-400 inline-block" />
                  {project.agents} agent{project.agents !== 1 ? "s" : ""}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <button className="glass px-3 py-1 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/20 transition-all">
                  Open
                </button>
                <button className="glass px-3 py-1 rounded-lg text-xs text-ocean-300 hover:text-white hover:bg-ocean-500/30 transition-all">
                  Deploy Agent
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
