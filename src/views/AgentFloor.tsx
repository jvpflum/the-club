import { AnimatePresence, motion } from "framer-motion";
import { useClubStore } from "../store/useClubStore";
import { AgentCharacter } from "../components/AgentCharacter";

export function AgentFloor() {
  const agents = useClubStore(s => s.agents);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>

      {/* ── Sky ── */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, #0a1628 0%, #0d2240 35%, #0e3a5c 60%, #1a5f7a 80%, #2d8a6e 92%, #3aaa6a 100%)",
      }} />

      {/* ── Stars ── */}
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.2, 0.9, 0.2] }}
          transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 4 }}
          style={{
            position: "absolute",
            width: Math.random() > 0.8 ? 2 : 1,
            height: Math.random() > 0.8 ? 2 : 1,
            borderRadius: "50%",
            background: "white",
            top: `${Math.random() * 45}%`,
            left: `${Math.random() * 100}%`,
          }}
        />
      ))}

      {/* ── Moon ── */}
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute", top: 24, right: 60,
          width: 48, height: 48, borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #fef3c7, #fde68a)",
          boxShadow: "0 0 30px rgba(253,230,138,0.35), 0 0 60px rgba(253,230,138,0.15)",
        }}
      />

      {/* ── Clouds ── */}
      {[
        { left: "8%",  top: 55,  scale: 1,    delay: 0,   duration: 12 },
        { left: "35%", top: 38,  scale: 0.65, delay: 2,   duration: 16 },
        { left: "62%", top: 28,  scale: 0.8,  delay: 1,   duration: 14 },
      ].map((c, i) => (
        <motion.div
          key={i}
          animate={{ x: [0, 15, 0] }}
          transition={{ duration: c.duration, repeat: Infinity, ease: "easeInOut", delay: c.delay }}
          style={{ position: "absolute", left: c.left, top: c.top, fontSize: `${2.4 * c.scale}rem`, opacity: 0.55, filter: "blur(0.5px)" }}
        >☁️</motion.div>
      ))}

      {/* ── Ocean ── */}
      <motion.div
        animate={{ scaleY: [1, 1.015, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          bottom: "28%", left: "-5%", right: "-5%",
          height: "32%",
          background: "linear-gradient(180deg, rgba(14,165,233,0.55) 0%, rgba(7,89,133,0.85) 60%, rgba(6,56,100,0.95) 100%)",
          borderRadius: "50% 50% 0 0 / 30px 30px 0 0",
        }}
      />

      {/* ── Wave shimmer ── */}
      <motion.div
        animate={{ x: [0, -30, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          bottom: "27.5%", left: 0, right: 0,
          height: 12,
          background: "repeating-linear-gradient(90deg, transparent 0, rgba(255,255,255,0.18) 12px, transparent 24px)",
          borderRadius: "50%",
        }}
      />

      {/* ── Beach sand ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "30%",
        background: "linear-gradient(180deg, #c8a96e 0%, #d4b483 30%, #e8c99a 70%, #f0d8b0 100%)",
      }} />

      {/* ── Sand texture overlay ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: "30%",
        backgroundImage: "radial-gradient(ellipse at 20% 20%, rgba(180,140,80,0.3) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(160,120,60,0.2) 0%, transparent 50%)",
      }} />

      {/* ── Palm trees ── */}
      {[{ x: "4%", scale: 1.1 }, { x: "88%", scale: 0.9 }].map((p, i) => (
        <motion.div
          key={i}
          animate={{ rotate: i === 0 ? [-2, 2, -2] : [2, -2, 2] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            bottom: "28%",
            left: p.x,
            fontSize: `${3 * p.scale}rem`,
            transformOrigin: "bottom center",
            filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))",
          }}
        >🌴</motion.div>
      ))}

      {/* ── Umbrella + chair ── */}
      <div style={{ position: "absolute", bottom: "29.5%", left: "14%", fontSize: "1.6rem", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.3))" }}>⛱️</div>
      <div style={{ position: "absolute", bottom: "28.5%", right: "18%", fontSize: "1.3rem" }}>🏄</div>
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ position: "absolute", bottom: "28.5%", right: "30%", fontSize: "1rem" }}
      >🦀</motion.div>

      {/* ── "Agent Floor" label ── */}
      <div style={{
        position: "absolute",
        bottom: "30%",
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(6,13,26,0.55)",
        border: "1px solid rgba(255,255,255,0.10)",
        backdropFilter: "blur(12px)",
        borderRadius: 99,
        padding: "4px 16px",
        color: "rgba(255,255,255,0.45)",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}>
        Agent Floor
      </div>

      {/* ── Agent characters ── */}
      <div style={{
        position: "absolute",
        bottom: "33%",
        left: 0, right: 0,
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 24,
        padding: "0 40px",
      }}>
        <AnimatePresence>
          {agents.map(agent => <AgentCharacter key={agent.id} agent={agent} />)}
        </AnimatePresence>
      </div>

      {/* ── Stats bar (top-left) ── */}
      <div style={{ position: "absolute", top: 16, left: 16, display: "flex", gap: 8 }}>
        {[
          { icon: "🏖️", val: `${agents.length} agents` },
          { icon: "⚡", val: `${agents.filter(a => a.status !== "idle").length} active` },
        ].map(s => (
          <div key={s.val} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(6,13,26,0.60)", border: "1px solid rgba(255,255,255,0.10)",
            backdropFilter: "blur(12px)", borderRadius: 99, padding: "4px 12px",
            fontSize: 11, color: "rgba(255,255,255,0.65)",
          }}>
            <span>{s.icon}</span><span>{s.val}</span>
          </div>
        ))}
      </div>

      {/* ── Spawn button ── */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          useClubStore.getState().addAgent({
            id: `agent-${Date.now()}`,
            name: "Sub-Agent",
            emoji: ["🤖","🦾","💡","⚡","🔬"][Math.floor(Math.random() * 5)],
            status: "working",
            task: "Running task...",
            spawnedAt: new Date(),
            position: { x: 50, y: 60 },
          });
        }}
        style={{
          position: "absolute", bottom: 16, right: 16,
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(56,189,248,0.15)", border: "1px solid rgba(56,189,248,0.30)",
          backdropFilter: "blur(16px)", borderRadius: 12, padding: "8px 16px",
          color: "var(--ocean)", fontSize: 12, fontWeight: 600,
          cursor: "pointer", letterSpacing: "0.02em",
        }}
      >
        <span>+ Spawn Agent</span><span>🤖</span>
      </motion.button>
    </div>
  );
}
