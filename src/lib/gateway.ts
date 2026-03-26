/**
 * OpenClaw Gateway WebSocket + HTTP client
 * Connects to ws://127.0.0.1:18789 with auto-reconnect
 */

export type GatewayStatus = "connecting" | "connected" | "disconnected" | "error";

export interface GatewayMessage {
  [key: string]: unknown;
}

type MessageHandler = (msg: GatewayMessage) => void;
type StatusHandler = (status: GatewayStatus) => void;

const WS_URL = "ws://127.0.0.1:18789";
const HTTP_BASE = "http://127.0.0.1:18789";

class GatewayClient {
  private ws: WebSocket | null = null;
  private _status: GatewayStatus = "disconnected";
  private messageHandlers = new Set<MessageHandler>();
  private statusHandlers = new Set<StatusHandler>();
  private reconnectDelay = 1000;
  private reconnectTimer: number | null = null;
  private shouldReconnect = true;

  get status(): GatewayStatus {
    return this._status;
  }

  private setStatus(s: GatewayStatus) {
    if (this._status === s) return;
    this._status = s;
    for (const h of this.statusHandlers) h(s);
  }

  connect() {
    this.shouldReconnect = true;
    if (this.ws) {
      const { readyState } = this.ws;
      if (readyState === WebSocket.OPEN || readyState === WebSocket.CONNECTING) return;
    }
    this.setStatus("connecting");
    try {
      const ws = new WebSocket(WS_URL);
      this.ws = ws;

      ws.onopen = () => {
        this.reconnectDelay = 1000;
        this.setStatus("connected");
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(String(ev.data)) as GatewayMessage;
          for (const h of this.messageHandlers) h(msg);
        } catch {
          /* non-JSON message, ignore */
        }
      };

      ws.onerror = () => {
        /* onerror always followed by onclose — handle reconnect there */
      };

      ws.onclose = () => {
        this.ws = null;
        this.setStatus("disconnected");
        if (this.shouldReconnect) this.scheduleReconnect();
      };
    } catch {
      this.setStatus("error");
      if (this.shouldReconnect) this.scheduleReconnect();
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer != null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus("disconnected");
  }

  private scheduleReconnect() {
    if (this.reconnectTimer != null) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectDelay);
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s cap
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  /** HTTP GET helper for REST endpoints */
  async get<T = unknown>(path: string): Promise<T> {
    const url = `${HTTP_BASE}${path.startsWith("/") ? path : "/" + path}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) throw new Error(`Gateway ${resp.status}: ${resp.statusText}`);
    return resp.json();
  }

  /** Send JSON over WebSocket */
  send(data: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}

export const gateway = new GatewayClient();
