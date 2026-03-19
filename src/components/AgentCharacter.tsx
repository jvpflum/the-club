import { motion } from "framer-motion";
import { Agent, AgentStatus } from "../store/useClubStore";

const STATUS = {
  working: { color: "var(--ocean)",   label: "Working",    glow: "rgba(56,189,248,0.5)" },
  thinking:{ color: "var(--sand)",    label: "Thinking…",  glow: "rgba(228,176,69,0.5)" },
  idle:    { color: "rgba(255,255,255,0.3)", label: "Idle", glow: "transparent" },
  done:    { color: "var(--palm)",    label: "Done ✓",     glow: "rgba(74,222,128,0.5)" },
  error:   { color: "var(--coral)",   label: "Error",      glow: "rgba(251,113,133,0.5)" },
};

export function AgentCharacter({ agent }: { agent: Agent }) {
  const s = STATUS[agent.status as AgentStatus] || STATUS.idle;
  const isWorking  = agent.status === "working";
  const isThinking = agent.status === "thinking";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.4, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.4, y: -16 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 80 }}
    >
      {/* Task bubble */}
      {agent.task && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            maxWidth: 120,
            background: "rgba(6,13,26,0.75)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(12px)",
            borderRadius: 10,
            padding: "4px 8px",
            fontSize: 9,
            color: "rgba(255,255,255,0.75)",
            textAlign: "center",
            lineHeight: 1.4,
            marginBottom: 2,
          }}
        >
          {agent.task.length > 45 ? agent.task.slice(0, 42) + "…" : agent.task}
        </motion.div>
      )}

      {/* Avatar */}
      <motion.div
        animate={
          isWorking  ? { y: [0, -4, 0] } :
          isThinking ? { rotate: [-3, 3, -3] } :
          { y: [0, -2, 0] }
        }
        transition={{
          duration: isWorking ? 0.55 : isThinking ? 1.4 : 3.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ position: "relative" }}
      >
        <div style={{
          width: 52, height: 52,
          borderRadius: 18,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.14)",
          backdropFilter: "blur(12px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 26,
          boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)`,
        }}>
          {agent.emoji}
        </div>

        {/* Working dots */}
        {isWorking && (
          <div style={{ position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 3 }}>
            {[0, 0.18, 0.36].map(d => (
              <motion.div key={d}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: d }}
                style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--ocean)" }}
              />
            ))}
          </div>
        )}

        {/* Thinking spinner */}
        {isThinking && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{ position: "absolute", top: -4, right: -4, fontSize: 13 }}
          >⚙️</motion.div>
        )}
      </motion.div>

      {/* Name + status */}
      <div style={{ textAlign: "center" }}>
        <div style={{ color: "var(--text-primary)", fontSize: 11, fontWeight: 600 }}>{agent.name}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 2 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: s.color, boxShadow: `0 0 5px ${s.glow}` }} />
          <span style={{ color: "var(--text-muted)", fontSize: 9 }}>{s.label}</span>
        </div>
      </div>

      {/* Progress */}
      {agent.progress !== undefined && (
        <div style={{ width: 56, height: 2, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden" }}>
          <motion.div
            animate={{ width: `${agent.progress}%` }}
            style={{ height: "100%", background: "var(--ocean)", borderRadius: 99 }}
          />
        </div>
      )}
    </motion.div>
  );
}
