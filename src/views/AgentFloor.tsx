import { AnimatePresence, motion } from "framer-motion";
import { useClubStore } from "../store/useClubStore";
import { AgentCharacter } from "../components/AgentCharacter";

export function AgentFloor() {
  const { agents } = useClubStore();

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-ocean-800 via-ocean-600 to-ocean-400" />

      {/* Sun */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-8 right-16 w-16 h-16 rounded-full bg-gradient-to-br from-sand-300 to-sand-500 shadow-[0_0_60px_rgba(212,146,42,0.6)]"
      />

      {/* Clouds */}
      {[
        { x: "10%", y: 30, scale: 1, delay: 0 },
        { x: "40%", y: 20, scale: 0.7, delay: 1 },
        { x: "70%", y: 40, scale: 1.2, delay: 2 },
      ].map((cloud, i) => (
        <motion.div
          key={i}
          animate={{ x: [0, 20, 0] }}
          transition={{ duration: 8 + i * 2, repeat: Infinity, ease: "easeInOut", delay: cloud.delay }}
          className="absolute text-4xl opacity-80"
          style={{ left: cloud.x, top: cloud.y, fontSize: `${2 * cloud.scale}rem` }}
        >
          ☁️
        </motion.div>
      ))}

      {/* Ocean */}
      <motion.div
        animate={{ scaleY: [1, 1.02, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[28%] left-0 right-0 h-[30%] bg-gradient-to-b from-ocean-500/80 to-ocean-700/90"
        style={{ borderRadius: "50% 50% 0 0 / 20px 20px 0 0" }}
      />

      {/* Wave line */}
      <motion.div
        animate={{ x: [0, -20, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[27%] left-0 right-0 h-3 opacity-60"
        style={{
          background: "repeating-linear-gradient(90deg, transparent 0px, rgba(255,255,255,0.3) 10px, transparent 20px)",
        }}
      />

      {/* Beach sand */}
      <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-sand-400 to-sand-200" />

      {/* Beach items */}
      <div className="absolute bottom-[30%] left-[5%] text-3xl">🌴</div>
      <div className="absolute bottom-[30%] right-[8%] text-3xl">🌴</div>
      <motion.div
        animate={{ rotate: [0, 5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-[29%] left-[15%] text-xl"
      >
        ⛱️
      </motion.div>
      <div className="absolute bottom-[28%] right-[20%] text-xl">🏄</div>

      {/* Agent desks area — the "office on the beach" */}
      <div className="absolute bottom-[30%] left-0 right-0 flex justify-center">
        <div className="glass rounded-2xl px-6 py-2 flex items-end gap-2 mb-1">
          <span className="text-white/50 text-[10px] tracking-widest uppercase">Agent Floor</span>
        </div>
      </div>

      {/* Agents */}
      <div className="absolute bottom-[32%] left-0 right-0 px-8">
        <div className="flex flex-wrap gap-6 justify-center items-end">
          <AnimatePresence>
            {agents.map((agent) => (
              <AgentCharacter key={agent.id} agent={agent} />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Spawn new agent button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="absolute bottom-4 right-4 glass px-4 py-2 rounded-xl text-white/80 text-sm font-medium flex items-center gap-2 hover:bg-white/20 transition-all"
        onClick={() => {
          const { addAgent } = useClubStore.getState();
          addAgent({
            id: `agent-${Date.now()}`,
            name: "Sub-Agent",
            emoji: ["🤖", "🦾", "💡", "⚡", "🔬"][Math.floor(Math.random() * 5)],
            status: "working",
            task: "Spawning new task...",
            spawnedAt: new Date(),
            position: { x: Math.random() * 80, y: 60 },
          });
        }}
      >
        <span>+ Spawn Agent</span>
        <span>🤖</span>
      </motion.button>

      {/* Stats bar */}
      <div className="absolute top-4 left-4 flex gap-3">
        <div className="glass px-3 py-1.5 rounded-xl text-white/70 text-xs flex items-center gap-2">
          <span className="text-palm-400">●</span>
          <span>{agents.filter(a => a.status !== "idle").length} active</span>
        </div>
        <div className="glass px-3 py-1.5 rounded-xl text-white/70 text-xs flex items-center gap-2">
          <span>🏖️</span>
          <span>{agents.length} agents</span>
        </div>
      </div>
    </div>
  );
}
