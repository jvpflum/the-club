import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useClubStore } from "../store/useClubStore";
import { AgentCharacter } from "../components/AgentCharacter";

/* ── Seagulls ── */
const SEAGULLS = [
  { y: 12, duration: 20, delay: 0 },
  { y: 22, duration: 28, delay: 5 },
  { y: 8,  duration: 35, delay: 12 },
];

function Seagulls() {
  return (
    <>
      {SEAGULLS.map((s, i) => (
        <motion.div
          key={i}
          animate={{ x: ["-10%", "110%"] }}
          transition={{ duration: s.duration, repeat: Infinity, delay: s.delay, ease: "linear" }}
          style={{
            position: "absolute",
            top: `${s.y}%`,
            left: 0,
            fontSize: "1.2rem",
            opacity: 0.7,
            pointerEvents: "none",
          }}
        >
          <motion.div
            animate={{ y: [0, -6, 0, 4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            {"\uD83E\uDD85"}
          </motion.div>
        </motion.div>
      ))}
    </>
  );
}

/* ── Jumping Fish ── */
function JumpingFish() {
  const [visible, setVisible] = useState(false);
  const [xPos, setXPos] = useState(50);

  useEffect(() => {
    const scheduleJump = () => {
      const delay = 8000 + Math.random() * 7000;
      return setTimeout(() => {
        setXPos(15 + Math.random() * 70);
        setVisible(true);
        setTimeout(() => setVisible(false), 600);
        scheduleJump();
      }, delay);
    };
    const tid = scheduleJump();
    return () => clearTimeout(tid);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: -40, opacity: 1 }}
          exit={{ y: 0, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            position: "absolute",
            bottom: "29%",
            left: `${xPos}%`,
            fontSize: "1.2rem",
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          {"\uD83D\uDC1F"}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Footprints in sand ── */
function Footprints() {
  const prints = [
    { left: "25%", bottom: "18%" },
    { left: "28%", bottom: "16%" },
    { left: "55%", bottom: "12%" },
    { left: "57%", bottom: "10%" },
    { left: "72%", bottom: "20%" },
    { left: "74%", bottom: "18%" },
    { left: "40%", bottom: "8%" },
    { left: "42%", bottom: "6%" },
  ];
  return (
    <>
      {prints.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: p.left,
            bottom: p.bottom,
            width: 3,
            height: 3,
            borderRadius: "50%",
            background: "rgba(180,140,80,0.4)",
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}

/* ── Shooting Star ── */
function ShootingStar() {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 20, y: 10 });

  useEffect(() => {
    const scheduleStar = () => {
      const delay = 15000 + Math.random() * 30000;
      return setTimeout(() => {
        setPos({ x: 10 + Math.random() * 50, y: 5 + Math.random() * 25 });
        setVisible(true);
        setTimeout(() => setVisible(false), 400);
        scheduleStar();
      }, delay);
    };
    const tid = scheduleStar();
    return () => clearTimeout(tid);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0], x: 80, y: 80 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            position: "absolute",
            top: `${pos.y}%`,
            left: `${pos.x}%`,
            width: 2,
            height: 40,
            background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, transparent 100%)",
            transform: "rotate(45deg)",
            borderRadius: 1,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}
    </AnimatePresence>
  );
}

export function AgentFloor() {
  const agents = useClubStore(s => s.agents);
  const gatewayStatus = useClubStore(s => s.gatewayStatus);

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

      {/* ── Shooting Star ── */}
      <ShootingStar />

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

      {/* ── Seagulls ── */}
      <Seagulls />

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
        >{"\u2601\uFE0F"}</motion.div>
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
        animate={{ x: [0, -30, 0], opacity: [0.18, 0.7, 0.18] }}
        transition={{
          x: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" },
        }}
        style={{
          position: "absolute",
          bottom: "27.5%", left: 0, right: 0,
          height: 12,
          background: "repeating-linear-gradient(90deg, transparent 0, rgba(255,255,255,0.18) 12px, transparent 24px)",
          borderRadius: "50%",
        }}
      />

      {/* ── Jumping Fish ── */}
      <JumpingFish />

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

      {/* ── Footprints ── */}
      <Footprints />

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
        >{"\uD83C\uDF34"}</motion.div>
      ))}

      {/* ── Umbrella + chair ── */}
      <div style={{ position: "absolute", bottom: "29.5%", left: "14%", fontSize: "1.6rem", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.3))" }}>{"\u26F1\uFE0F"}</div>
      <div style={{ position: "absolute", bottom: "28.5%", right: "18%", fontSize: "1.3rem" }}>{"\uD83C\uDFC4"}</div>
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ position: "absolute", bottom: "28.5%", right: "30%", fontSize: "1rem" }}
      >{"\uD83E\uDD80"}</motion.div>

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

      {/* ── Agent characters (real sessions) ── */}
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
          {agents.length > 0 ? (
            agents.map(agent => <AgentCharacter key={agent.id} agent={agent} />)
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                background: "rgba(6,13,26,0.60)",
                border: "1px solid rgba(255,255,255,0.10)",
                backdropFilter: "blur(12px)",
                borderRadius: 16,
                padding: "16px 28px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>{"\uD83C\uDFD6\uFE0F"}</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 500 }}>
                {gatewayStatus === "connected" ? "No active sessions" : "Gateway offline"}
              </div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 4 }}>
                {gatewayStatus === "connected"
                  ? "Agents will appear when jobs run"
                  : "Waiting for gateway connection\u2026"}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Stats bar (top-left) ── */}
      <div style={{ position: "absolute", top: 16, left: 16, display: "flex", gap: 8 }}>
        {[
          { icon: "\uD83C\uDFD6\uFE0F", val: `${agents.length} agents` },
          { icon: "\u26A1", val: `${agents.filter(a => a.status !== "idle").length} active` },
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
    </div>
  );
}
