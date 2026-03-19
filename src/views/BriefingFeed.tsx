import { motion, AnimatePresence } from "framer-motion";
import { useClubStore, FeedItem } from "../store/useClubStore";

const TYPE = {
  brief:     { emoji: "☀️", color: "var(--sand)",  label: "Morning Brief" },
  alert:     { emoji: "🚨", color: "var(--coral)", label: "Alert" },
  heartbeat: { emoji: "💓", color: "var(--ocean)", label: "Heartbeat" },
  agent:     { emoji: "🤖", color: "var(--palm)",  label: "Agent" },
  system:    { emoji: "⚙️", color: "var(--text-muted)", label: "System" },
};

function Card({ item }: { item: FeedItem }) {
  const { markFeedRead } = useClubStore();
  const t = TYPE[item.type] || TYPE.system;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => markFeedRead(item.id)}
      style={{
        background: "var(--bg-surface)",
        border: `1px solid ${!item.read ? "rgba(56,189,248,0.25)" : "var(--border)"}`,
        borderLeft: !item.read ? `3px solid var(--ocean)` : "1px solid var(--border)",
        borderRadius: 14,
        padding: "14px 16px",
        cursor: "pointer",
        display: "flex",
        gap: 12,
        transition: "background 0.15s",
      }}
    >
      <div style={{ fontSize: 20, flexShrink: 0 }}>{t.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: t.color }}>
            {t.label}
          </span>
          <span style={{ color: "var(--text-faint)", fontSize: 10 }}>
            {item.timestamp.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </span>
          {!item.read && (
            <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "var(--ocean)", boxShadow: "0 0 6px rgba(56,189,248,0.6)" }} />
          )}
        </div>
        <div style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{item.title}</div>
        <div style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.body}</div>
      </div>
    </motion.div>
  );
}

export function BriefingFeed() {
  const { feed } = useClubStore();
  const unread = feed.filter(f => !f.read).length;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: 24, gap: 20, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>Briefing Feed</h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {unread > 0 ? `${unread} unread` : "All caught up ✓"}
          </p>
        </div>
        {unread > 0 && (
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => feed.forEach(f => useClubStore.getState().markFeedRead(f.id))}
            style={{
              background: "var(--bg-surface)", border: "1px solid var(--border)",
              borderRadius: 10, padding: "6px 14px", color: "var(--text-secondary)",
              fontSize: 12, cursor: "pointer",
            }}
          >Mark all read</motion.button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        <AnimatePresence>
          {feed.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 48 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
              <div style={{ fontSize: 14 }}>Nothing yet — agents are standing by</div>
            </div>
          ) : (
            feed.map(item => <Card key={item.id} item={item} />)
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
