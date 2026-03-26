import { motion } from "framer-motion";
import { useClubStore, View } from "../store/useClubStore";

const NAV: { view: View; emoji: string; label: string }[] = [
  { view: "floor",      emoji: "🏖️", label: "Agent Floor" },
  { view: "calendar",   emoji: "📅", label: "Calendar" },
  { view: "feed",       emoji: "📡", label: "Briefings" },
  { view: "skills",     emoji: "🛠️", label: "Skills" },
  { view: "sandbox",    emoji: "🧪", label: "Sandbox" },
  { view: "system",     emoji: "⚡", label: "System" },
  { view: "livebuild",  emoji: "🔴", label: "Live Build" },
];

export function Sidebar() {
  const view    = useClubStore(s => s.view);
  const setView = useClubStore(s => s.setView);
  const feed    = useClubStore(s => s.feed);
  const unread  = feed.filter(f => !f.read).length;

  return (
    <nav
      style={{
        width: 64,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "12px 0",
        gap: 4,
        background: "rgba(6,13,26,0.70)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(20px)",
        zIndex: 10,
      }}
    >
      {NAV.map((n) => {
        const active = view === n.view;
        const hasBadge = n.view === "feed" && unread > 0;
        return (
          <motion.button
            key={n.view}
            onClick={() => setView(n.view)}
            title={n.label}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            style={{
              position: "relative",
              width: 44,
              height: 44,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              cursor: "pointer",
              border: "none",
              transition: "background 0.15s, box-shadow 0.15s, opacity 0.15s",
              background: active ? "rgba(56,189,248,0.15)" : "transparent",
              boxShadow: active ? "0 0 0 1px rgba(56,189,248,0.30), inset 0 1px 0 rgba(255,255,255,0.08)" : "none",
              opacity: active ? 1 : 0.5,
            }}
            onMouseEnter={e => {
              if (!active) (e.currentTarget as HTMLElement).style.opacity = "0.85";
            }}
            onMouseLeave={e => {
              if (!active) (e.currentTarget as HTMLElement).style.opacity = "0.5";
            }}
          >
            {n.emoji}
            {hasBadge && (
              <span style={{
                position: "absolute",
                top: 4,
                right: 4,
                width: 14,
                height: 14,
                borderRadius: 99,
                background: "var(--coral)",
                color: "white",
                fontSize: 8,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1.5px solid var(--bg-base)",
              }}>
                {unread > 9 ? "9+" : unread}
              </span>
            )}
            {/* Active indicator bar */}
            {active && (
              <motion.div
                layoutId="nav-active"
                style={{
                  position: "absolute",
                  left: -12,
                  width: 3,
                  height: 20,
                  borderRadius: 99,
                  background: "var(--ocean)",
                  boxShadow: "0 0 8px rgba(56,189,248,0.6)",
                }}
              />
            )}
          </motion.button>
        );
      })}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Version */}
      <span style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.05em" }}>v0.2</span>
    </nav>
  );
}
