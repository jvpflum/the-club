import { motion } from "framer-motion";
import { Agent, AgentStatus } from "../store/useClubStore";
import { clsx } from "clsx";

const STATUS_COLOR: Record<AgentStatus, string> = {
  working: "bg-ocean-400",
  thinking: "bg-sand-400",
  idle: "bg-white/40",
  done: "bg-palm-400",
  error: "bg-coral-500",
};

const STATUS_LABEL: Record<AgentStatus, string> = {
  working: "Working",
  thinking: "Thinking...",
  idle: "Idle",
  done: "Done ✓",
  error: "Error",
};

export function AgentCharacter({ agent }: { agent: Agent }) {
  const isWorking = agent.status === "working";
  const isThinking = agent.status === "thinking";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.5, y: -20 }}
      className="flex flex-col items-center gap-1 select-none cursor-default"
      style={{ width: 80 }}
    >
      {/* Task bubble */}
      {agent.task && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl px-2 py-1 text-[10px] text-white/80 max-w-[120px] text-center leading-tight mb-1"
        >
          {agent.task.length > 40 ? agent.task.slice(0, 37) + "…" : agent.task}
        </motion.div>
      )}

      {/* Character body */}
      <motion.div
        animate={
          isWorking
            ? { y: [0, -3, 0] }
            : isThinking
            ? { rotate: [-2, 2, -2] }
            : { y: [0, -2, 0] }
        }
        transition={{
          duration: isWorking ? 0.5 : isThinking ? 1.2 : 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative"
      >
        {/* Agent emoji / avatar */}
        <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center text-2xl shadow-lg">
          {agent.emoji}
        </div>

        {/* Typing indicator for working */}
        {isWorking && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
            {[0, 0.2, 0.4].map((delay) => (
              <motion.div
                key={delay}
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, delay }}
                className="w-1 h-1 rounded-full bg-ocean-300"
              />
            ))}
          </div>
        )}

        {/* Thinking spinner */}
        {isThinking && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1 -right-1 text-xs"
          >
            ⚙️
          </motion.div>
        )}
      </motion.div>

      {/* Name + status */}
      <div className="text-center">
        <div className="text-white text-[11px] font-semibold">{agent.name}</div>
        <div className="flex items-center gap-1 justify-center">
          <div className={clsx("w-1.5 h-1.5 rounded-full", STATUS_COLOR[agent.status])} />
          <span className="text-white/50 text-[9px]">{STATUS_LABEL[agent.status]}</span>
        </div>
      </div>

      {/* Progress bar if applicable */}
      {agent.progress !== undefined && (
        <div className="w-16 h-0.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${agent.progress}%` }}
            className="h-full bg-ocean-400 rounded-full"
          />
        </div>
      )}
    </motion.div>
  );
}
