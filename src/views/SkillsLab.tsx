import { motion } from "framer-motion";
import { useClubStore, Skill } from "../store/useClubStore";

function SkillCard({ skill }: { skill: Skill }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      style={{
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: 16, padding: "16px", display: "flex", flexDirection: "column", gap: 12,
        opacity: skill.installed ? 1 : 0.65,
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <span style={{ fontSize: 28 }}>{skill.emoji}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {skill.version && (
            <span style={{ fontSize: 10, color: "var(--text-faint)", fontFamily: "monospace" }}>v{skill.version}</span>
          )}
          {skill.installed && (
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: skill.enabled ? "var(--palm)" : "var(--text-faint)",
              boxShadow: skill.enabled ? "0 0 6px rgba(74,222,128,0.7)" : "none",
            }} />
          )}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{skill.name}</div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{skill.description}</div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
        {skill.installed ? (
          <>
            <button style={{
              flex: 1, background: "var(--bg-elevated)", border: "1px solid var(--border)",
              borderRadius: 9, padding: "6px 0", fontSize: 11, color: "var(--text-secondary)", cursor: "pointer",
            }}>{skill.enabled ? "Disable" : "Enable"}</button>
            <button style={{
              flex: 1, background: "var(--bg-elevated)", border: "1px solid var(--border)",
              borderRadius: 9, padding: "6px 0", fontSize: 11, color: "var(--text-secondary)", cursor: "pointer",
            }}>Configure</button>
          </>
        ) : (
          <button style={{
            flex: 1, background: "rgba(56,189,248,0.10)", border: "1px solid rgba(56,189,248,0.25)",
            borderRadius: 9, padding: "6px 0", fontSize: 11, fontWeight: 600,
            color: "var(--ocean)", cursor: "pointer",
          }}>Install</button>
        )}
      </div>
    </motion.div>
  );
}

export function SkillsLab() {
  const { skills } = useClubStore();
  const installed = skills.filter(s => s.installed);
  const available = skills.filter(s => !s.installed);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: 24, gap: 20, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>Skills Lab</h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {installed.length} installed · {available.length} available
          </p>
        </div>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(56,189,248,0.10)", border: "1px solid rgba(56,189,248,0.25)",
          borderRadius: 10, padding: "7px 16px", color: "var(--ocean)", fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}>
          <span>🦞</span><span>Browse ClawHub</span>
        </motion.button>
      </div>

      {/* Search */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: 12, padding: "8px 14px", flexShrink: 0,
      }}>
        <span style={{ color: "var(--text-faint)" }}>🔍</span>
        <input placeholder="Search skills…" style={{
          background: "none", border: "none", outline: "none",
          color: "var(--text-primary)", fontSize: 13, flex: 1,
        }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
        {installed.length > 0 && (
          <section>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>
              Installed
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
              {installed.map(s => <SkillCard key={s.id} skill={s} />)}
            </div>
          </section>
        )}
        {available.length > 0 && (
          <section>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>
              Available on ClawHub
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
              {available.map(s => <SkillCard key={s.id} skill={s} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
