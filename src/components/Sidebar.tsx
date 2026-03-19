import { useClubStore, View } from "../store/useClubStore";
import { clsx } from "clsx";

const NAV: { view: View; emoji: string; label: string }[] = [
  { view: "floor", emoji: "🏖️", label: "Agent Floor" },
  { view: "calendar", emoji: "📅", label: "Mission Calendar" },
  { view: "feed", emoji: "📡", label: "Briefing Feed" },
  { view: "skills", emoji: "🛠️", label: "Skills Lab" },
  { view: "sandbox", emoji: "🧪", label: "Sandbox" },
];

export function Sidebar() {
  const { view, setView, gatewayConnected, feed } = useClubStore();
  const unread = feed.filter((f) => !f.read).length;

  return (
    <div className="glass flex flex-col w-16 h-full py-4 items-center gap-1 border-r border-white/10 z-10">
      {/* Logo */}
      <div className="mb-4 text-2xl animate-bounce-subtle" title="The Club">🌴</div>

      {NAV.map((n) => (
        <button
          key={n.view}
          onClick={() => setView(n.view)}
          title={n.label}
          className={clsx(
            "relative w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all duration-200",
            view === n.view
              ? "bg-white/20 shadow-lg shadow-ocean-500/20 scale-110"
              : "hover:bg-white/10 hover:scale-105 opacity-60 hover:opacity-100"
          )}
        >
          {n.emoji}
          {n.view === "feed" && unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-coral-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {unread}
            </span>
          )}
        </button>
      ))}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Gateway status */}
      <div
        title={gatewayConnected ? "Gateway connected" : "Gateway offline"}
        className={clsx(
          "w-2 h-2 rounded-full mb-2 transition-all",
          gatewayConnected ? "bg-palm-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" : "bg-coral-400 animate-pulse"
        )}
      />
    </div>
  );
}
