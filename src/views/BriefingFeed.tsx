import { motion } from "framer-motion";
import { useClubStore, FeedItem } from "../store/useClubStore";
import { clsx } from "clsx";

const TYPE_CONFIG = {
  brief: { emoji: "☀️", color: "text-sand-400", label: "Morning Brief" },
  alert: { emoji: "🚨", color: "text-coral-400", label: "Alert" },
  heartbeat: { emoji: "💓", color: "text-ocean-400", label: "Heartbeat" },
  agent: { emoji: "🤖", color: "text-palm-400", label: "Agent" },
  system: { emoji: "⚙️", color: "text-white/40", label: "System" },
};

function FeedCard({ item }: { item: FeedItem }) {
  const { markFeedRead } = useClubStore();
  const cfg = TYPE_CONFIG[item.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => markFeedRead(item.id)}
      className={clsx(
        "glass rounded-2xl p-4 cursor-pointer transition-all hover:bg-white/15",
        !item.read && "border-l-2 border-ocean-400"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="text-xl flex-shrink-0">{cfg.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={clsx("text-[10px] uppercase tracking-widest font-semibold", cfg.color)}>
              {cfg.label}
            </span>
            <span className="text-white/30 text-[10px]">
              {item.timestamp.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </span>
            {!item.read && <div className="w-1.5 h-1.5 rounded-full bg-ocean-400 ml-auto" />}
          </div>
          <div className="text-white text-sm font-semibold mb-1">{item.title}</div>
          <div className="text-white/60 text-xs leading-relaxed line-clamp-3">{item.body}</div>
        </div>
      </div>
    </motion.div>
  );
}

export function BriefingFeed() {
  const { feed } = useClubStore();
  const unread = feed.filter((f) => !f.read).length;

  return (
    <div className="h-full flex flex-col p-6 gap-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Briefing Feed</h1>
          <p className="text-white/50 text-sm">
            {unread > 0 ? `${unread} unread` : "All caught up ✓"}
          </p>
        </div>
        {unread > 0 && (
          <button
            className="glass px-4 py-2 rounded-xl text-white/60 text-sm hover:bg-white/20 transition-all"
            onClick={() => feed.forEach((f) => useClubStore.getState().markFeedRead(f.id))}
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto flex-1">
        {feed.map((item) => (
          <FeedCard key={item.id} item={item} />
        ))}
        {feed.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center text-white/40">
            <div className="text-4xl mb-2">📡</div>
            <div>Nothing yet — agents are standing by</div>
          </div>
        )}
      </div>
    </div>
  );
}
