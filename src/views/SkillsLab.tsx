import { motion } from "framer-motion";
import { useClubStore, Skill } from "../store/useClubStore";
import { clsx } from "clsx";

function SkillCard({ skill }: { skill: Skill }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={clsx(
        "glass rounded-2xl p-4 flex flex-col gap-3 transition-all cursor-default",
        !skill.installed && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="text-3xl">{skill.emoji}</div>
        <div className="flex gap-2 items-center">
          {skill.version && (
            <span className="text-white/30 text-[10px] font-mono">v{skill.version}</span>
          )}
          {skill.installed ? (
            <div className={clsx(
              "w-2 h-2 rounded-full",
              skill.enabled ? "bg-palm-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]" : "bg-white/20"
            )} />
          ) : null}
        </div>
      </div>

      <div>
        <div className="text-white font-semibold text-sm mb-1">{skill.name}</div>
        <div className="text-white/50 text-xs leading-relaxed">{skill.description}</div>
      </div>

      <div className="flex gap-2 mt-auto">
        {skill.installed ? (
          <>
            <button className="flex-1 glass py-1.5 rounded-xl text-xs text-white/70 hover:bg-white/20 hover:text-white transition-all">
              {skill.enabled ? "Disable" : "Enable"}
            </button>
            <button className="flex-1 glass py-1.5 rounded-xl text-xs text-white/70 hover:bg-white/20 hover:text-white transition-all">
              Configure
            </button>
          </>
        ) : (
          <button className="flex-1 glass py-1.5 rounded-xl text-xs text-ocean-300 hover:bg-ocean-500/30 hover:text-white transition-all font-semibold">
            Install
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function SkillsLab() {
  const { skills } = useClubStore();
  const installed = skills.filter((s) => s.installed);
  const available = skills.filter((s) => !s.installed);

  return (
    <div className="h-full flex flex-col p-6 gap-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Skills Lab</h1>
          <p className="text-white/50 text-sm">{installed.length} installed · {available.length} available</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="glass px-4 py-2 rounded-xl text-white/80 text-sm font-medium hover:bg-white/20 flex items-center gap-2"
        >
          <span>🦞</span>
          <span>Browse ClawHub</span>
        </motion.button>
      </div>

      {/* Search */}
      <div className="glass rounded-xl px-4 py-2 flex items-center gap-3">
        <span className="text-white/30">🔍</span>
        <input
          placeholder="Search skills..."
          className="bg-transparent text-white text-sm flex-1 outline-none placeholder:text-white/30"
        />
      </div>

      <div className="overflow-y-auto flex-1 flex flex-col gap-4">
        {installed.length > 0 && (
          <div>
            <h2 className="text-white/40 text-[10px] uppercase tracking-widest mb-3">Installed</h2>
            <div className="grid grid-cols-2 gap-3">
              {installed.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          </div>
        )}

        {available.length > 0 && (
          <div>
            <h2 className="text-white/40 text-[10px] uppercase tracking-widest mb-3">Available</h2>
            <div className="grid grid-cols-2 gap-3">
              {available.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
