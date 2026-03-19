import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "./components/Sidebar";
import { AgentFloor } from "./views/AgentFloor";
import { MissionCalendar } from "./views/MissionCalendar";
import { BriefingFeed } from "./views/BriefingFeed";
import { SkillsLab } from "./views/SkillsLab";
import { Sandbox } from "./views/Sandbox";
import { LiveBuild } from "./views/LiveBuild";
import { useClubStore } from "./store/useClubStore";

function ViewContent() {
  const { view } = useClubStore();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={view}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="flex-1 h-full overflow-hidden"
      >
        {view === "floor" && <AgentFloor />}
        {view === "calendar" && <MissionCalendar />}
        {view === "feed" && <BriefingFeed />}
        {view === "skills" && <SkillsLab />}
        {view === "sandbox" && <Sandbox />}
        {view === "livebuild" && <LiveBuild />}
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  const { setGatewayConnected } = useClubStore();

  // Try to connect to OpenClaw gateway
  useEffect(() => {
    let ws: WebSocket | null = null;
    let retryTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      try {
        ws = new WebSocket("ws://127.0.0.1:18789");
        ws.onopen = () => setGatewayConnected(true);
        ws.onclose = () => {
          setGatewayConnected(false);
          retryTimeout = setTimeout(connect, 5000);
        };
        ws.onerror = () => {
          setGatewayConnected(false);
        };
      } catch {
        setGatewayConnected(false);
        retryTimeout = setTimeout(connect, 5000);
      }
    };

    connect();
    return () => {
      ws?.close();
      clearTimeout(retryTimeout);
    };
  }, []);

  return (
    <TooltipProvider>
      <div className="w-screen h-screen flex overflow-hidden bg-ocean-900">
        <Sidebar />
        <div className="flex-1 h-full overflow-hidden">
          <ViewContent />
        </div>
      </div>
    </TooltipProvider>
  );
}

export default App;
