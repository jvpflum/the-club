# 🏖️ The Club

> AI Mission Control — Beach-themed desktop command center for OpenClaw agents.

Built with Tauri 2.0 + React + TypeScript. Apple-polish UI, animated agent floor, autonomous sandboxes.

## Views

- **🏖️ Agent Floor** — Live animated view of all agents working. Characters move, tasks float above their heads, sub-agents spawn in real-time.
- **📅 Mission Calendar** — All cron jobs and scheduled tasks on a timeline. Add, edit, trigger runs.
- **📡 Briefing Feed** — Morning briefs, alerts, heartbeat outputs in one chronological stream.
- **🛠️ Skills Lab** — Browse, install, configure, and toggle OpenClaw skills from a clean GUI.
- **🧪 Sandbox** — Isolated autonomous workspaces. Deploy agents to work on projects independently.

## Stack

- **Tauri 2.0** — Native desktop app (Windows/macOS/Linux)
- **React + TypeScript** — UI
- **Tailwind CSS v4** — Styling
- **Framer Motion** — Animations
- **Zustand** — State management
- **OpenClaw Gateway** — WebSocket connection to your local AI agent runtime

## Dev Setup

```bash
npm install
npm run tauri dev
```

## Build

```bash
npm run tauri build
```

## Gateway Connection

The Club connects to OpenClaw Gateway at `ws://127.0.0.1:18789`. Make sure your gateway is running:

```bash
openclaw gateway status
```

## Vision

The Club is self-improving. The Sandbox view lets you point agents at this very repo to autonomously build new features, fix bugs, and open PRs. The app evolves with you.
